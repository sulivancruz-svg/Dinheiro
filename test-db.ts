import "dotenv/config";
import { prisma } from "./lib/db/prisma";

async function test() {
  try {
    const users = await prisma.user.count();
    console.log(`✅ SUCESSO! Usuários no banco: ${users}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
