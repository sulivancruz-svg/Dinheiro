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
  description?: string;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".csv", ".ofx", ".txt", ".pdf"];
const AMOUNT_PATTERN =
  /[-+]?\s?(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|[-+]?\s?(?:R\$\s*)?\d+[.,]\d{2}/g;

function parseBrazilianAmount(rawValue: string): number | null {
  const cleaned = rawValue
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  if (!cleaned || cleaned === "-" || cleaned === ".") {
    return null;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseOfx(content: string): ParsedTransaction[] {
  const matches = content.match(/<TRNAMT>\s*([-+]?[\d.,]+)/gi) || [];

  return matches
    .map((match) => {
      const amount = parseBrazilianAmount(match.replace(/<TRNAMT>/i, ""));
      return amount === null ? null : { amount };
    })
    .filter((item): item is ParsedTransaction => item !== null);
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

    const amount = [...columns]
      .reverse()
      .map(parseBrazilianAmount)
      .find((value): value is number => value !== null);

    if (amount !== undefined) {
      transactions.push({
        amount,
        description: columns.slice(0, Math.max(columns.length - 1, 1)).join(" "),
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
    const amountMatches = line.match(AMOUNT_PATTERN) || [];
    const amount = amountMatches
      .map(parseBrazilianAmount)
      .findLast((value): value is number => value !== null);

    if (amount !== undefined) {
      transactions.push({
        amount,
        description: line.replace(amountMatches.at(-1) || "", "").trim(),
      });
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
      expenses: Math.round(total),
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
    income: Math.round(income),
    expenses: Math.round(expenses),
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
      preview: transactions.slice(0, 8),
    });
  } catch (error) {
    console.error("Error in POST /api/importacao/analisar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
