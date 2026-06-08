"use client";

import type { BusinessSession } from "@/lib/types";

export const SESSION_KEY = "aris-pay.business.session";
export const REGISTRATION_KEY = "aris-pay.business.registration";
export const SESSION_EVENT = "aris-pay:session-updated";
export const ACCESS_TOKEN_LIFETIME_MS = 20 * 60 * 1000;
export const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

function dispatchSessionEvent() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function decodeJwtExpiry(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as {
      exp?: number;
    };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function buildAccessTokenExpiry(token: string) {
  const clientExpiry = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
  const jwtExpiry = decodeJwtExpiry(token);
  const effectiveExpiry = jwtExpiry ? Math.min(jwtExpiry, clientExpiry) : clientExpiry;
  return new Date(effectiveExpiry).toISOString();
}

function buildStoredSession(session: BusinessSession): BusinessSession {
  return {
    ...session,
    accessTokenExpiresAt: session.accessTokenExpiresAt || buildAccessTokenExpiry(session.token),
    lastActivityAt: session.lastActivityAt || new Date().toISOString(),
  };
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(REGISTRATION_KEY);
  dispatchSessionEvent();
}

export function clearAllBrowserStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
  window.sessionStorage.clear();
  dispatchSessionEvent();
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  window.location.replace("/login");
}

export function isSessionExpired(session: BusinessSession, now = Date.now()) {
  const tokenExpiry = session.accessTokenExpiresAt
    ? new Date(session.accessTokenExpiresAt).getTime()
    : 0;
  const lastActivity = session.lastActivityAt
    ? new Date(session.lastActivityAt).getTime()
    : 0;

  return (
    !tokenExpiry ||
    !lastActivity ||
    Number.isNaN(tokenExpiry) ||
    Number.isNaN(lastActivity) ||
    tokenExpiry <= now ||
    lastActivity + ACCESS_TOKEN_LIFETIME_MS <= now
  );
}

export function shouldRefreshSession(session: BusinessSession, now = Date.now()) {
  const tokenExpiry = session.accessTokenExpiresAt
    ? new Date(session.accessTokenExpiresAt).getTime()
    : 0;

  if (!tokenExpiry || Number.isNaN(tokenExpiry)) {
    return true;
  }

  return tokenExpiry - now <= TOKEN_REFRESH_BUFFER_MS;
}

export function getStoredSession(): BusinessSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      return null;
    }

    const session = buildStoredSession(JSON.parse(storedSession) as BusinessSession);
    if (isSessionExpired(session)) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function setStoredSession(session: BusinessSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(buildStoredSession(session)));
  dispatchSessionEvent();
}

export function touchStoredSessionActivity() {
  if (typeof window === "undefined") return null;

  const currentSession = getStoredSession();
  if (!currentSession) {
    return null;
  }

  const nextSession: BusinessSession = {
    ...currentSession,
    accessTokenExpiresAt: currentSession.accessTokenExpiresAt,
    lastActivityAt: new Date().toISOString(),
  };

  setStoredSession(nextSession);
  return nextSession;
}
