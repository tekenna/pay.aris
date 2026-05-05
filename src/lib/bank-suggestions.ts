export type Bank = {
  name: string;
  cbnCode: string;
  bankCode: string;
  logoUrl?: string | null;
};

export type BankSuggestion = {
  name: string;
  code: string;
  logoUrl: string | null;
  probability?: "high" | "medium" | "low";
};

const NUBAN_LENGTH = 10;
const SERIAL_NUM_LENGTH = 9;

const NGN_NUMBER_INITIALS = [
  "701","702","703","704","705","706","707","708","709",
  "802","803","805","806","807","808","809","810","811","812","813","814","815","816","817","818",
  "901","902","903","904","905","906","907","908","909",
];

export const BANKS: Bank[] = [
  { name: "ACCESS BANK", cbnCode: "000044", bankCode: "000014" },
  { name: "CITIBANK", cbnCode: "000023", bankCode: "000009" },
  { name: "DIAMOND BANK", cbnCode: "000063", bankCode: "000014" },
  { name: "ECOBANK NIGERIA", cbnCode: "000050", bankCode: "000010" },
  { name: "FIDELITY BANK", cbnCode: "000070", bankCode: "000007" },
  { name: "FIRST BANK OF NIGERIA", cbnCode: "000011", bankCode: "000016" },
  { name: "FIRST CITY MONUMENT BANK", cbnCode: "000214", bankCode: "000003" },
  { name: "GUARANTY TRUST BANK", cbnCode: "000058", bankCode: "000013" },
  { name: "HERITAGE BANK", cbnCode: "000030", bankCode: "000020" },
  { name: "JAIZ BANK", cbnCode: "000301", bankCode: "000006" },
  { name: "TAJ BANK", cbnCode: "000330", bankCode: "000026" },
  { name: "KEYSTONE BANK", cbnCode: "000082", bankCode: "000002" },
  { name: "PROVIDUS BANK", cbnCode: "000101", bankCode: "000023" },
  { name: "POLARIS BANK (SKYE)", cbnCode: "000076", bankCode: "000008" },
  { name: "STANBIC IBTC BANK", cbnCode: "000221", bankCode: "000012" },
  { name: "STANDARD CHARTERED BANK", cbnCode: "000068", bankCode: "000021" },
  { name: "STERLING BANK", cbnCode: "000232", bankCode: "000001" },
  { name: "SUNTRUST", cbnCode: "000100", bankCode: "000022" },
  { name: "UNION BANK OF NIGERIA", cbnCode: "000032", bankCode: "000018" },
  { name: "UNITED BANK FOR AFRICA", cbnCode: "000033", bankCode: "000004" },
  { name: "UNITY BANK", cbnCode: "000215", bankCode: "000011" },
  { name: "WEMA BANK", cbnCode: "000035", bankCode: "000017" },
  { name: "ZENITH BANK", cbnCode: "000057", bankCode: "000015" },
  { name: "OFI", cbnCode: "950547", bankCode: "000044" },
  { name: "Kayi", cbnCode: "951067", bankCode: "090" },
  { name: "Kuda", cbnCode: "950211", bankCode: "090267" },
  { name: "Moniepoint", cbnCode: "950515", bankCode: "090405" },
  { name: "SafeHaven MFB", cbnCode: "951113", bankCode: "090286" },
  { name: "Opay", cbnCode: "105305", bankCode: "100004" },
  { name: "Palmpay", cbnCode: "105469", bankCode: "100033" },
];

const BANK_LOGO_CANDIDATES: Record<string, string[]> = {
  "ACCESS BANK": ["access bank", "access(diamond) bank", "access money"],
  CITIBANK: ["citty bank"],
  "ECOBANK NIGERIA": ["ecobank", "ecomobile", "ecobank xpress account"],
  "FIDELITY BANK": ["fidelity bank", "fidelity mobile"],
  "FIRST BANK OF NIGERIA": ["first bank of nigeria"],
  "FIRST CITY MONUMENT BANK": ["fcmb", "first city monument bank"],
  "GUARANTY TRUST BANK": ["gaurantee trust bank", "gt bank", "gtbank plc", "gt mobile"],
  "HERITAGE BANK": ["heritage bank"],
  "JAIZ BANK": ["jaiz bank"],
  "TAJ BANK": ["taj bank", "tajwallet"],
  "KEYSTONE BANK": ["keystone bank"],
  "PROVIDUS BANK": ["providus bank"],
  "POLARIS BANK (SKYE)": ["polaris bank"],
  "STANBIC IBTC BANK": ["stanbic ibtc bank", "stanbic ibtc @ease wallet"],
  "STANDARD CHARTERED BANK": ["standard chartered bank"],
  "STERLING BANK": ["sterling bank", "sterling mobile"],
  SUNTRUST: ["suntrust bank"],
  "UNION BANK OF NIGERIA": ["union bank"],
  "UNITED BANK FOR AFRICA": ["united bank for africa", "uba moni"],
  "UNITY BANK": ["unity bank"],
  "WEMA BANK": ["wema bank", "alat by wema"],
  "ZENITH BANK": ["zenith bank"],
  "SafeHaven MFB": ["safehaven"],
  Opay: ["paycom"],
  Kuda: ["kuda", "kuda microfinance bank"],
};

const BANK_LOGO_PATHS: Record<string, string> = {
  "access bank": "/images/bank-logos/access bank.svg",
  "access diamond": "/images/bank-logos/access(diamond) bank.svg",
  "citibank": "/images/bank-logos/citty bank.svg",
  "ecobank": "/images/bank-logos/ecobank.svg",
  "fidelity": "/images/bank-logos/fidelity bank.svg",
  "first bank": "/images/bank-logos/first bank of nigeria.svg",
  "fcmb": "/images/bank-logos/fcmb.svg",
  "first city monument": "/images/bank-logos/first city monument bank.svg",
  "guaranty trust": "/images/bank-logos/gt bank.svg",
  "gtbank": "/images/bank-logos/gt bank.svg",
  "gt bank": "/images/bank-logos/gt bank.svg",
  "heritage": "/images/bank-logos/heritage bank.svg",
  "jaiz": "/images/bank-logos/jaiz bank.svg",
  "taj": "/images/bank-logos/taj bank.svg",
  "keystone": "/images/bank-logos/keystone bank.svg",
  "providus": "/images/bank-logos/providus bank.svg",
  "polaris": "/images/bank-logos/polaris bank.svg",
  "stanbic ibtc": "/images/bank-logos/stanbic ibtc bank.svg",
  "standard chartered": "/images/bank-logos/standard chartered bank.svg",
  "sterling": "/images/bank-logos/sterling bank.svg",
  "suntrust": "/images/bank-logos/suntrust bank.svg",
  "union": "/images/bank-logos/union bank.svg",
  "united bank for africa": "/images/bank-logos/united bank for africa.svg",
  "uba": "/images/bank-logos/united bank for africa.svg",
  "unity": "/images/bank-logos/unity bank.svg",
  "wema": "/images/bank-logos/wema bank.svg",
  "zenith": "/images/bank-logos/zenith bank.svg",
  "safehaven": "/images/bank-logos/safehaven.svg",
  "safe haven": "/images/bank-logos/safehaven.svg",
  "opay": "/images/bank-logos/paycom.svg",
  "paycom": "/images/bank-logos/paycom.svg",
  "kuda": "/images/bank-logos/kuda.svg",
  "kuda microfinance": "/images/bank-logos/kuda microfinance bank.svg",
};

function normalizeBankName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(bank|plc|of|nigeria|mfb|microfinance|limited|ltd|wallet)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBankLogoUrl(bankName?: string | null, explicitLogoUrl?: string | null) {
  if (!bankName) {
    return null;
  }

  const normalized = normalizeBankName(bankName);
  const directPath =
    BANK_LOGO_PATHS[bankName.toLowerCase()] || BANK_LOGO_PATHS[normalized];
  if (directPath) {
    return directPath;
  }
  const directCandidates = BANK_LOGO_CANDIDATES[bankName] || [];
  const candidates = [...directCandidates, normalized];

  const match = candidates.find((candidate) => {
    const slug = candidate.toLowerCase();
    return [
      "access bank","access(diamond) bank","access money","citty bank","ecobank","ecomobile","ecobank xpress account",
      "fidelity bank","fidelity mobile","first bank of nigeria","fcmb","first city monument bank","gaurantee trust bank",
      "gt bank","gtbank plc","gt mobile","heritage bank","jaiz bank","taj bank","tajwallet","keystone bank",
      "providus bank","polaris bank","stanbic ibtc bank","stanbic ibtc @ease wallet","standard chartered bank",
      "sterling bank","sterling mobile","suntrust bank","union bank","united bank for africa","uba moni",
      "unity bank","wema bank","alat by wema","zenith bank","safehaven","paycom","kuda","kuda microfinance bank",
    ].includes(slug);
  });

  if (!match) {
    return null;
  }

  return `/images/bank-logos/${match}.svg`;
}

function calculateCheckDigit(serialNumber: string, bankCode: string) {
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  const cipher = bankCode + serialNumber;

  let weightedSum = 0;
  for (let index = 0; index < cipher.length; index += 1) {
    weightedSum += Number.parseInt(cipher[index], 10) * weights[index];
  }

  let checkDigit = 10 - (weightedSum % 10);
  if (checkDigit === 10) {
    checkDigit = 0;
  }

  return checkDigit;
}

function isBankAccountValid(accountNumber: string, bankCode: string) {
  if (!accountNumber || accountNumber.length !== NUBAN_LENGTH) {
    return false;
  }

  const serialNumber = accountNumber.substring(0, SERIAL_NUM_LENGTH);
  const checkDigit = calculateCheckDigit(serialNumber, bankCode);

  return checkDigit === Number.parseInt(accountNumber[SERIAL_NUM_LENGTH], 10);
}

function isNigerianPhonePrefix(prefix: string) {
  return NGN_NUMBER_INITIALS.includes(prefix);
}

function mergeSuggestions(primary: BankSuggestion[], secondary: BankSuggestion[]) {
  const merged = [...primary];
  const existingCodes = new Set(primary.map((item) => item.code));

  for (const suggestion of secondary) {
    if (!existingCodes.has(suggestion.code)) {
      merged.push(suggestion);
      existingCodes.add(suggestion.code);
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return merged.sort((left, right) => {
    const leftOrder = order[left.probability || "low"] ?? 3;
    const rightOrder = order[right.probability || "low"] ?? 3;
    return leftOrder - rightOrder;
  });
}

function getPartialBankMatches(accountNumber: string, banks: Bank[]) {
  const suggestions: BankSuggestion[] = [];
  const prefix = accountNumber.substring(0, 3);

  const bankPatterns: Record<string, string[]> = {
    "000": ["GUARANTY TRUST BANK", "ZENITH BANK", "ACCESS BANK", "FIRST BANK OF NIGERIA"],
    "001": ["ACCESS BANK", "ZENITH BANK"],
    "002": ["GUARANTY TRUST BANK", "ZENITH BANK"],
    "003": ["UNITED BANK FOR AFRICA", "FIRST BANK OF NIGERIA"],
    "004": ["UNITED BANK FOR AFRICA", "ACCESS BANK"],
    "005": ["ZENITH BANK", "GUARANTY TRUST BANK"],
    "006": ["ZENITH BANK", "FIRST BANK OF NIGERIA"],
    "007": ["FIRST BANK OF NIGERIA", "ACCESS BANK"],
    "008": ["GUARANTY TRUST BANK", "UNITED BANK FOR AFRICA"],
    "009": ["ZENITH BANK", "GUARANTY TRUST BANK"],
  };

  const matchedBanks = bankPatterns[prefix] || [];
  for (const bankName of matchedBanks) {
    const bank = banks.find((item) => item.name === bankName);
    if (bank) {
      suggestions.push({
        name: bank.name,
        code: bank.bankCode,
        logoUrl: getBankLogoUrl(bank.name, bank.logoUrl),
        probability: "medium",
      });
    }
  }

  if (!suggestions.length) {
    for (const bankName of [
      "GUARANTY TRUST BANK",
      "ZENITH BANK",
      "ACCESS BANK",
      "FIRST BANK OF NIGERIA",
      "UNITED BANK FOR AFRICA",
    ]) {
      const bank = banks.find((item) => item.name === bankName);
      if (bank) {
        suggestions.push({
          name: bank.name,
          code: bank.bankCode,
          logoUrl: getBankLogoUrl(bank.name, bank.logoUrl),
          probability: "low",
        });
      }
    }
  }

  return suggestions;
}

function getValidBanksForAccount(accountNumber: string, banks: Bank[]) {
  return banks.filter((bank) => bank.cbnCode && isBankAccountValid(accountNumber, bank.cbnCode)).map((bank) => ({
    name: bank.name,
    code: bank.bankCode,
    logoUrl: getBankLogoUrl(bank.name, bank.logoUrl),
  }));
}

export function getBankSuggestions(accountNumber: string, banks: Bank[] = BANKS): BankSuggestion[] {
  const cleanNumber = accountNumber.replace(/\D/g, "");

  if (cleanNumber.length < 3) {
    return [];
  }

  const suggestions: BankSuggestion[] = [];
  const prefix = cleanNumber.substring(0, 3);

  if (isNigerianPhonePrefix(prefix)) {
    suggestions.push(
      { name: "Opay", code: "100004", logoUrl: getBankLogoUrl("Opay"), probability: "high" },
      { name: "Palmpay", code: "100033", logoUrl: getBankLogoUrl("Palmpay"), probability: "high" },
    );
  }

  suggestions.push(...getPartialBankMatches(cleanNumber, banks));

  if (cleanNumber.length === NUBAN_LENGTH) {
    const validBanks = getValidBanksForAccount(cleanNumber, banks).map((bank) => ({
      ...bank,
      probability: "high" as const,
    }));
    return mergeSuggestions(validBanks, suggestions);
  }

  return suggestions;
}

export function findBankByCode(bankCode?: string | null, banks: Bank[] = BANKS) {
  return banks.find((bank) => bank.bankCode === bankCode) || null;
}

export function formatAccountNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}
