"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BusinessSession, RegistrationDraft } from "@/lib/types";

const SESSION_KEY = "aris-pay.business.session";
const REGISTRATION_KEY = "aris-pay.business.registration";
const SESSION_EVENT = "aris-pay:session-updated";

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
        const storedSession = window.localStorage.getItem(SESSION_KEY);
        const storedDraft = window.sessionStorage.getItem(REGISTRATION_KEY);

        if (storedSession) {
          setSessionState(JSON.parse(storedSession) as BusinessSession);
        } else {
          setSessionState(null);
        }

        if (storedDraft) {
          setRegistrationDraftState(JSON.parse(storedDraft) as RegistrationDraft);
        } else {
          setRegistrationDraftState({});
        }
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(REGISTRATION_KEY);
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

  const value = useMemo<BusinessSessionContextValue>(
    () => ({
      isReady,
      session,
      registrationDraft,
      setSession(nextValue) {
        setSessionState(nextValue);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextValue));
      },
      clearSession() {
        setSessionState(null);
        window.localStorage.removeItem(SESSION_KEY);
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
