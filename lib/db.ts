import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

function buildPrismaPgConfig(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get("schema") ?? undefined;
  const sslRootCert = process.env.PGSSLROOTCERT || process.env.DATABASE_CA_CERT_PATH;

  if (sslRootCert && !url.searchParams.has("sslrootcert")) {
    url.searchParams.set("sslrootcert", sslRootCert);
  }

  return {
    connectionString: url.toString(),
    schema,
  };
}

const pgConfig = buildPrismaPgConfig(connectionString);
const adapter = new PrismaPg({ connectionString: pgConfig.connectionString }, { schema: pgConfig.schema });

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
