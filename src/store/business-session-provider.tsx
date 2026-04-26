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
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedSession = window.localStorage.getItem(SESSION_KEY);
        const storedDraft = window.sessionStorage.getItem(REGISTRATION_KEY);

        if (storedSession) {
          setSessionState(JSON.parse(storedSession) as BusinessSession);
        }

        if (storedDraft) {
          setRegistrationDraftState(JSON.parse(storedDraft) as RegistrationDraft);
        }
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(REGISTRATION_KEY);
        setSessionState(null);
        setRegistrationDraftState({});
      } finally {
        setIsReady(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
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
