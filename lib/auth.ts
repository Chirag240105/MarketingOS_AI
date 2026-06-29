import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { getAppUrl } from "./app-url";
import { prisma } from "./db";

const localHostname = ["local", "host"].join("");
const localIp = ["127", "0", "0", "1"].join(".");

function pointsToLocalOrigin(value?: string) {
  if (!value) return false;
  try {
    const hostname = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname;
    return hostname === localHostname || hostname === localIp;
  } catch {
    return false;
  }
}

const safeAuthUrl = getAppUrl();
if (pointsToLocalOrigin(process.env.AUTH_URL)) process.env.AUTH_URL = safeAuthUrl;
if (pointsToLocalOrigin(process.env.NEXTAUTH_URL)) process.env.NEXTAUTH_URL = safeAuthUrl;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        
        const isValid = await compare(credentials.password as string, user.password);
        return isValid
          ? { id: user.id, email: user.email, name: user.name, image: user.image }
          : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      const userId = typeof token.id === "string" ? token.id : undefined;
      if (session.user && userId) session.user.id = userId;
      return session;
    },
  },
});

// Role-Based Access Control Helper
export async function requireRole(allowedRoles: string[]) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized access");

  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!dbUser || !allowedRoles.includes(dbUser.role)) {
    throw new Error("Forbidden: Insufficient privileges");
  }
  return dbUser;
}
