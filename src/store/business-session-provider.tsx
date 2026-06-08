"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BusinessSession, RegistrationDraft } from "@/lib/types";
import { refreshBusinessAccessToken } from "@/services/api-client";
import {
  ACCESS_TOKEN_LIFETIME_MS,
  clearStoredSession,
  getStoredSession,
  isSessionExpired,
  REGISTRATION_KEY,
  SESSION_EVENT,
  SESSION_KEY,
  setStoredSession,
  shouldRefreshSession,
  touchStoredSessionActivity,
} from "@/services/session-storage";

type BusinessSessionContextValue = {
  isReady: boolean;
  session: BusinessSession | null;
  registrationDraft: RegistrationDraft;
  setSession: (value: BusinessSession) => void;
  clearSession: () => void;
  setRegistrationDraft: (value: RegistrationDraft) => void;
  clearRegistrationDraft: () => void;
};

const BusinessSessionContext = createContext<BusinessSessionContextValue | null>(null);

export function BusinessSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSessionState] = useState<BusinessSession | null>(null);
  const [registrationDraft, setRegistrationDraftState] = useState<RegistrationDraft>({});

  useEffect(() => {
    function syncSessionState() {
      try {
        const storedSession = getStoredSession();
        const storedDraft = window.sessionStorage.getItem(REGISTRATION_KEY);

        if (storedSession) {
          setSessionState(storedSession);
        } else {
          setSessionState(null);
        }

        if (storedDraft) {
          setRegistrationDraftState(JSON.parse(storedDraft) as RegistrationDraft);
        } else {
          setRegistrationDraftState({});
        }
      } catch {
        clearStoredSession();
        setSessionState(null);
        setRegistrationDraftState({});
      }
    }

    const frame = window.requestAnimationFrame(() => {
      try {
        syncSessionState();
      } finally {
        setIsReady(true);
      }
    });

    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key === SESSION_KEY || event.key === REGISTRATION_KEY) {
        syncSessionState();
      }
    }

    function handleSessionEvent() {
      syncSessionState();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SESSION_EVENT, handleSessionEvent);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SESSION_EVENT, handleSessionEvent);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady || !session) {
      return;
    }

    let refreshInFlight = false;

    async function validateDashboardSession(markActivity = false) {
      if (!window.location.pathname.startsWith("/dashboard")) {
        return;
      }

      const currentSession = getStoredSession();
      if (!currentSession || isSessionExpired(currentSession)) {
        clearStoredSession();
        setSessionState(null);
        window.location.replace("/login");
        return;
      }

      if (markActivity) {
        touchStoredSessionActivity();
      }

      if (!refreshInFlight && shouldRefreshSession(currentSession)) {
        refreshInFlight = true;
        try {
          const refreshedToken = await refreshBusinessAccessToken();
          if (!refreshedToken) {
            clearStoredSession();
            setSessionState(null);
            window.location.replace("/login");
          }
        } finally {
          refreshInFlight = false;
        }
      }
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "focus",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      void validateDashboardSession(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void validateDashboardSession(true);
      }
    };

    const interval = window.setInterval(() => {
      void validateDashboardSession(false);
    }, Math.min(60_000, ACCESS_TOKEN_LIFETIME_MS / 4));

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void validateDashboardSession(false);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isReady, session]);

  const value = useMemo<BusinessSessionContextValue>(
    () => ({
      isReady,
      session,
      registrationDraft,
      setSession(nextValue) {
        setStoredSession(nextValue);
        setSessionState(getStoredSession());
      },
      clearSession() {
        clearStoredSession();
        setSessionState(null);
      },
      setRegistrationDraft(nextValue) {
        setRegistrationDraftState(nextValue);
        window.sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify(nextValue));
      },
      clearRegistrationDraft() {
        setRegistrationDraftState({});
        window.sessionStorage.removeItem(REGISTRATION_KEY);
      },
    }),
    [isReady, registrationDraft, session],
  );

  return (
    <BusinessSessionContext.Provider value={value}>
      {children}
    </BusinessSessionContext.Provider>
  );
}

export function useBusinessSession() {
  const context = useContext(BusinessSessionContext);

  if (!context) {
    throw new Error("useBusinessSession must be used inside BusinessSessionProvider");
  }

  return context;
}
