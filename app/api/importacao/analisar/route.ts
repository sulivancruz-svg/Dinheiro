import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFParse } from "pdf-parse";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { authOptions } from "@/lib/auth/config";
import { logSecureEvent } from "@/lib/utils/logger";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

const pdfWorkerSrc = pathToFileURL(
  join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;

PDFParse.setWorker(pdfWorkerSrc);

type ParsedTransaction = {
  amount: number;
  date?: string;
  description: string;
  line: string;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".csv", ".ofx", ".txt", ".pdf"];
const AMOUNT_PATTERN =
  /(?<![\d])[-+]?\s?(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+,\d{2}|\d{1,3}(?:,\d{3})+\.\d{2}|\d+,\d{2}|\d+\.\d{2})(?![\d])/g;
const DATE_PATTERN = /\b\d{2}\/\d{2}(?:\/\d{2,4})?\b/;
const SUMMARY_LINE_PATTERN =
  /\b(total\s+(?:da|desta)?\s*fatura|total\s+a\s+pagar|pagamento\s+m[ií]nimo|valor\s+total|saldo\s+(?:anterior|atual|dispon[ií]vel)|limite\s+(?:total|dispon[ií]vel|utilizado)|vencimento|melhor\s+dia|fechamento|resumo\s+(?:da|de)|compras\s+(?:nacionais|internacionais)|valor\s+em\s+d[oó]lar|cota[cç][aã]o)\b/i;
const CARD_INFO_LINE_PATTERN =
  /\b(total\s+a\s+financiar|pag\.\s*m[ií]nimo|m[ií]nimo|compras\s*\/\s*d[eé]bitos|cr[eé]ditos\s*\/\s*pagamentos|parcela\s+de|juros|cet\s+do\s+parcelamento|valor\s+do\s+iof|iof|encargos|total\s*\.+)\b|^\s*\(?[+=-]\)?/i;
const ONLY_AMOUNT_LINE_PATTERN = new RegExp(
  `^\\s*(?:${AMOUNT_PATTERN.source})\\s*$`,
  "i"
);
const MIN_TRANSACTION_AMOUNT = 0.01;
const MAX_REASONABLE_TRANSACTION_AMOUNT = 100_000;

function parseBrazilianAmount(rawValue: string): number | null {
  const valueWithSign = rawValue.replace(/\s+/g, "").replace(/[^\d,.-]/g, "");

  if (!valueWithSign || valueWithSign === "-" || valueWithSign === ".") {
    return null;
  }

  const sign = valueWithSign.startsWith("-") ? -1 : 1;
  const unsigned = valueWithSign.replace(/^[+-]/, "");
  const lastComma = unsigned.lastIndexOf(",");
  const lastDot = unsigned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const decimalIndex = Math.max(lastComma, lastDot);
  const decimalPart = unsigned.slice(decimalIndex + 1);

  if (decimalIndex === -1 || decimalPart.length !== 2) {
    return null;
  }

  const integerPart = unsigned.slice(0, decimalIndex).replace(/[.,]/g, "");
  const normalized = `${integerPart}.${decimalPart}`;
  const value = Number(normalized) * sign;

  if (
    !Number.isFinite(value) ||
    Math.abs(value) < MIN_TRANSACTION_AMOUNT ||
    Math.abs(value) > MAX_REASONABLE_TRANSACTION_AMOUNT
  ) {
    return null;
  }

  return value;
}

function cleanDescription(line: string, amountToken: string) {
  return line
    .replace(amountToken, "")
    .replace(DATE_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractTransactionFromLine(line: string): ParsedTransaction | null {
  if (
    SUMMARY_LINE_PATTERN.test(line) ||
    CARD_INFO_LINE_PATTERN.test(line) ||
    ONLY_AMOUNT_LINE_PATTERN.test(line)
  ) {
    return null;
  }

  const amountMatches = line.match(AMOUNT_PATTERN) || [];
  const amountToken = amountMatches.at(-1);

  if (!amountToken) {
    return null;
  }

  const amount = parseBrazilianAmount(amountToken);

  if (amount === null) {
    return null;
  }

  const description = cleanDescription(line, amountToken);

  if (
    !description ||
    SUMMARY_LINE_PATTERN.test(description) ||
    CARD_INFO_LINE_PATTERN.test(description)
  ) {
    return null;
  }

  return {
    amount,
    date: line.match(DATE_PATTERN)?.[0],
    description,
    line,
  };
}

function parseOfx(content: string): ParsedTransaction[] {
  const transactionMatches =
    content.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi) || [];
  const transactions: ParsedTransaction[] = [];

  for (const transactionBlock of transactionMatches) {
    const rawAmount = transactionBlock.match(/<TRNAMT>\s*([-+]?[\d.,]+)/i)?.[1];
    const amount = rawAmount ? parseBrazilianAmount(rawAmount) : null;

    if (amount === null) {
      continue;
    }

    transactions.push({
      amount,
      date: transactionBlock
        .match(/<DTPOSTED>\s*(\d{4})(\d{2})(\d{2})/i)
        ?.slice(1, 4)
        .reverse()
        .join("/"),
      description:
        transactionBlock.match(/<MEMO>\s*([^\r\n<]+)/i)?.[1]?.trim() ||
        transactionBlock.match(/<NAME>\s*([^\r\n<]+)/i)?.[1]?.trim() ||
        "Transacao OFX",
      line: transactionBlock.replace(/\s+/g, " ").trim(),
    });
  }

  return transactions;
}

function parseDelimited(content: string): ParsedTransaction[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const delimiter = line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
    const columns = line.split(delimiter).map((column) => column.trim());

    const amountColumn = [...columns]
      .reverse()
      .find((value) => parseBrazilianAmount(value) !== null);
    const amount = amountColumn ? parseBrazilianAmount(amountColumn) : null;

    if (amount !== null) {
      transactions.push({
        amount,
        date: line.match(DATE_PATTERN)?.[0],
        description:
          columns
            .filter((column) => column !== amountColumn)
            .join(" ")
            .replace(/\s{2,}/g, " ")
            .trim() || "Transacao importada",
        line,
      });
    }
  }

  return transactions;
}

function parseLooseText(content: string): ParsedTransaction[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const transaction = extractTransactionFromLine(line);

    if (transaction) {
      transactions.push(transaction);
    }
  }

  return transactions;
}

async function extractFileContent(file: File, extension: string) {
  if (extension === ".pdf") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });

    try {
      const parsedPdf = await parser.getText();
      return parsedPdf.text;
    } finally {
      await parser.destroy();
    }
  }

  return file.text();
}

function parseTransactions(content: string, extension: string) {
  if (extension === ".ofx") {
    return parseOfx(content);
  }

  if (extension === ".csv") {
    return parseDelimited(content);
  }

  return parseLooseText(content);
}

function summarizeTransactions(
  transactions: ParsedTransaction[],
  sourceType: string
) {
  const isCardInvoice = sourceType === "cartao";

  if (isCardInvoice) {
    const total = transactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );

    return {
      income: 0,
      expenses: Math.round(total * 100) / 100,
      positiveCount: transactions.filter((transaction) => transaction.amount > 0)
        .length,
      negativeCount: transactions.filter((transaction) => transaction.amount < 0)
        .length,
    };
  }

  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    positiveCount: transactions.filter((transaction) => transaction.amount > 0)
      .length,
    negativeCount: transactions.filter((transaction) => transaction.amount < 0)
      .length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const formData = await request.formData();
    const sourceType = String(formData.get("sourceType") || "extrato");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo obrigatorio." },
        { status: 400 }
      );
    }

    const lowerName = file.name.toLowerCase();
    const extension = SUPPORTED_EXTENSIONS.find((item) =>
      lowerName.endsWith(item)
    );

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Formato ainda nao suportado. Envie CSV, OFX, TXT ou PDF com texto selecionavel.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Limite: 8MB." },
        { status: 400 }
      );
    }

    const content = await extractFileContent(file, extension);
    const transactions = parseTransactions(content, extension);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nao encontrei transacoes com valores neste arquivo. Se for PDF escaneado como imagem, exporte em CSV/OFX/TXT ou use um PDF com texto selecionavel.",
        },
        { status: 400 }
      );
    }

    const summary = summarizeTransactions(transactions, sourceType);
    const suggestion = {
      rendaFixa: 0,
      rendaVariavel: summary.income,
      gastosFixos: 0,
      gastosVariaveis: summary.expenses,
      parcelasMensais: 0,
      valorPoupado: 0,
      valorInvestido: 0,
      dividaTotal: 0,
    };

    await prisma.auditLog.create({
      data: {
        evento: "financial_file_analyzed",
        userId,
        ipAddress,
        detalhes: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          sourceType,
          transactions: transactions.length,
        }),
      },
    });

    logSecureEvent("financial_file_analyzed", userId, ipAddress, {
      fileSize: file.size,
      sourceType,
      transactions: transactions.length,
    });

    return NextResponse.json({
      fileName: file.name,
      sourceType,
      transactions: transactions.length,
      summary,
      suggestion,
      items: transactions,
      preview: transactions.slice(0, 20),
    });
  } catch (error) {
    console.error("Error in POST /api/importacao/analisar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
