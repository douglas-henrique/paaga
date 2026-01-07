import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auditLog, getIpAddress } from "@/lib/audit-log"
import { logger } from "@/lib/logger"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Sanitize and validate email
        const email = String(credentials.email).toLowerCase().trim();
        if (!email || !email.includes('@')) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          // Don't reveal if user exists or not (security)
          // Log failed login attempt
          const ipAddress = getIpAddress(request);
          await auditLog.loginFailed(email, ipAddress);
          logger.logFailedLogin(email, ipAddress);
          return null;
        }

        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (!isValid) {
          // Log failed login attempt
          const ipAddress = getIpAddress(request);
          await auditLog.loginFailed(email, ipAddress);
          logger.logFailedLogin(email, ipAddress);
          return null;
        }

        // Log successful login
        const ipAddress = getIpAddress(request);
        await auditLog.loginSuccess(user.id, ipAddress);
        logger.logSuccessfulLogin(user.id, email, ipAddress);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
})

