"use client";

import type { BusinessSession } from "@/lib/types";

export const SESSION_KEY = "aris-pay.business.session";
export const REGISTRATION_KEY = "aris-pay.business.registration";
export const SESSION_EVENT = "aris-pay:session-updated";

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(REGISTRATION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  window.location.replace("/login");
}

export function getStoredSession(): BusinessSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      return null;
    }

    return JSON.parse(storedSession) as BusinessSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function setStoredSession(session: BusinessSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}
