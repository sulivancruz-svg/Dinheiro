import { PrismaClient } from "@prisma/client";

async function test() {
  const prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });

  try {
    console.log("Tentando conectar ao banco de dados...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    const users = await prisma.user.count();
    console.log(`✅ SUCESSO! Usuários no banco: ${users}`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ ERRO DETALHADO:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
