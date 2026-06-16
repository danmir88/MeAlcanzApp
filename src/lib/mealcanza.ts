export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
};

export type Settings = {
  currency: string;
  greenThreshold: number;
  yellowThreshold: number;
};

export type Config = {
  balance: number; // initial balance configured
  pendingPayments: number;
  configuredAt: string; // ISO
};

const KEYS = {
  config: "mealcanza_config",
  expenses: "mealcanza_expenses",
  settings: "mealcanza_settings",
  onboarded: "mealcanza_onboarded",
};

export const DEFAULT_SETTINGS: Settings = {
  currency: "Bs",
  greenThreshold: 100,
  yellowThreshold: 50,
};

export const CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Salud",
  "Educación",
  "Compras",
  "Entretenimiento",
  "Otros",
] as const;

const isBrowser = () => typeof window !== "undefined";

export function loadConfig(): Config | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEYS.config);
  return raw ? JSON.parse(raw) : null;
}
export function saveConfig(c: Config) {
  localStorage.setItem(KEYS.config, JSON.stringify(c));
}
export function loadExpenses(): Expense[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(KEYS.expenses);
  return raw ? JSON.parse(raw) : [];
}
export function saveExpenses(e: Expense[]) {
  localStorage.setItem(KEYS.expenses, JSON.stringify(e));
}
export function loadSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}
export function saveSettings(s: Settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}
export function isOnboarded(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(KEYS.onboarded) === "1";
}
export function setOnboarded(v: boolean) {
  localStorage.setItem(KEYS.onboarded, v ? "1" : "0");
}
export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function daysUntilEndOfMonth(today = new Date()): number {
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const diff = last.getDate() - today.getDate() + 1; // include today
  return Math.max(diff, 1);
}

export function computeStats(config: Config, expenses: Expense[], settings: Settings) {
  const spent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const saldoDisponible = config.balance - spent;
  const dineroLibre = saldoDisponible - config.pendingPayments;
  const diasRestantes = daysUntilEndOfMonth();
  const gastoDiario = dineroLibre / diasRestantes;
  let status: "green" | "yellow" | "red" = "red";
  let mensaje = "Reduce gastos para llegar a fin de mes.";
  if (gastoDiario >= settings.greenThreshold) {
    status = "green";
    mensaje = "Vas muy bien.";
  } else if (gastoDiario >= settings.yellowThreshold) {
    status = "yellow";
    mensaje = "Cuidado con los gastos.";
  }
  return {
    spent,
    saldoDisponible,
    dineroLibre,
    diasRestantes,
    gastoDiario,
    status,
    mensaje,
  };
}

export function formatMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safe.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
