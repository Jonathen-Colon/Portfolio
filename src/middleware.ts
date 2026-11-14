import { defineMiddleware } from "astro:middleware";

/**
 * Setup guard. EmDash's setup wizard lets the first visitor create the admin account.
 * While the `SETUP_KEY` Worker secret is set, the wizard and its API answer 404 unless the
 * visitor opened /_emdash/admin/setup?setup_key=<key> first (which sets a short-lived cookie).
 * Without `SETUP_KEY` (local dev, or after the secret is deleted) this does nothing.
 */
const COOKIE = "portfolio_setup_key";

function isSetupPath(pathname: string) {
  return pathname.startsWith("/_emdash/admin/setup") || pathname.startsWith("/_emdash/api/setup");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const onRequest = defineMiddleware((context, next) => {
  const key = process.env.SETUP_KEY;
  if (!key || !isSetupPath(context.url.pathname)) return next();

  const fromQuery = context.url.searchParams.get("setup_key");
  if (fromQuery && safeEqual(fromQuery, key)) {
    context.cookies.set(COOKIE, key, {
      path: "/_emdash",
      httpOnly: true,
      secure: context.url.protocol === "https:",
      sameSite: "strict",
      maxAge: 60 * 60 * 6,
    });
    return next();
  }

  const fromCookie = context.cookies.get(COOKIE)?.value;
  if (fromCookie && safeEqual(fromCookie, key)) return next();

  return new Response("Not found", { status: 404 });
});
