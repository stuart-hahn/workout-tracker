import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "wt_session";

function newSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function createSession(userId: string) {
  const sessionToken = newSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await prisma.session.create({
    data: { userId, sessionToken, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionToken, {
    ...cookieOptions(),
    expires: expiresAt,
  });

  return { sessionToken, expiresAt };
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    jar.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return null;
  }

  return session.user;
}

