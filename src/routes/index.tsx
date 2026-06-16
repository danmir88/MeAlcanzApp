import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Share2,
  Settings as SettingsIcon,
  Wallet,
  CalendarDays,
  Receipt,
  ArrowLeft,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CATEGORIES,
  type Config,
  type Expense,
  type Settings,
  computeStats,
  formatMoney,
  isOnboarded,
  loadConfig,
  loadExpenses,
  loadSettings,
  resetAll,
  saveConfig,
  saveExpenses,
  saveSettings,
  setOnboarded as persistOnboarded,
} from "@/lib/mealcanza";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Me AlcanzApp — ¿Cuánto puedo gastar hoy?" },
      {
        name: "description",
        content:
          "Calcula cuánto puedes gastar cada día para llegar a fin de mes sin quedarte sin dinero.",
      },
      { property: "og:title", content: "Me AlcanzApp" },
      {
        property: "og:description",
        content: "La app que te ayuda a llegar a fin de mes.",
      },
    ],
  }),
  component: App,
  ssr: false,
});

type Screen = "welcome" | "setup" | "main";

function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [config, setConfig] = useState<Config | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({
    currency: "Bs",
    greenThreshold: 100,
    yellowThreshold: 50,
  });

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setExpenses(loadExpenses());
    setSettings(loadSettings());
    if (isOnboarded() && cfg) setScreen("main");
    else setScreen("welcome");
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {screen === "welcome" && (
          <Welcome
            onStart={() => setScreen(config ? "main" : "setup")}
          />
        )}
        {screen === "setup" && (
          <Setup
            settings={settings}
            initial={config}
            onSave={(c) => {
              setConfig(c);
              saveConfig(c);
              persistOnboarded(true);
              setScreen("main");
              toast.success("Listo, tu plan diario está calculado.");
            }}
            onBack={() => setScreen("welcome")}
          />
        )}
        {screen === "main" && config && (
          <Main
            config={config}
            expenses={expenses}
            settings={settings}
            onAddExpense={(e) => {
              const next = [e, ...expenses];
              setExpenses(next);
              saveExpenses(next);
            }}
            onDeleteExpense={(id) => {
              const next = expenses.filter((e) => e.id !== id);
              setExpenses(next);
              saveExpenses(next);
            }}
            onUpdateSettings={(s) => {
              setSettings(s);
              saveSettings(s);
            }}
            onReconfigure={() => setScreen("setup")}
            onResetAll={() => {
              resetAll();
              setConfig(null);
              setExpenses([]);
              setSettings({ currency: "Bs", greenThreshold: 100, yellowThreshold: 50 });
              setScreen("welcome");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Welcome ---------------------------- */

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--status-green-soft)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--status-yellow-soft)" }}
      />

      <header className="relative z-10 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground shadow-md"
          style={{ background: "var(--primary)" }}
        >
          <Wallet className="h-5 w-5" />
        </span>
        <span className="font-display text-base text-foreground">Me AlcanzApp</span>
      </header>

      <main className="relative z-10 mt-16 flex flex-1 flex-col">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Tu plan diario, sin complicaciones
        </p>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight">
          ¿Cuánto puedo gastar <span className="text-primary">hoy?</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          La app que te ayuda a llegar a fin de mes. Calcula tu gasto diario,
          registra tus gastos y mantén el control con un semáforo simple.
        </p>

        <div className="mt-10 grid gap-3">
          <Feature
            color="var(--status-green)"
            title="Saludable"
            text="Vas bien, sigue así."
          />
          <Feature
            color="var(--status-yellow)"
            title="Cuidado"
            text="Modera tus gastos del día."
          />
          <Feature
            color="var(--status-red)"
            title="Riesgo"
            text="Reduce gastos para llegar."
          />
        </div>

        <div className="mt-auto pt-10">
          <Button
            onClick={onStart}
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg"
          >
            Comenzar
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tus datos se guardan solo en tu dispositivo.
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: color, boxShadow: `0 0 0 4px color-mix(in oklab, ${color} 18%, transparent)` }}
      />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/* ---------------------------- Setup ---------------------------- */

function Setup({
  settings,
  initial,
  onSave,
  onBack,
}: {
  settings: Settings;
  initial: Config | null;
  onSave: (c: Config) => void;
  onBack: () => void;
}) {
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? "");
  const [pending, setPending] = useState(initial?.pendingPayments?.toString() ?? "");

  const submit = () => {
    const b = parseFloat(balance);
    const p = parseFloat(pending);
    if (!Number.isFinite(b) || b < 0) {
      toast.error("Ingresa un saldo disponible válido.");
      return;
    }
    const pp = Number.isFinite(p) && p >= 0 ? p : 0;
    onSave({
      balance: b,
      pendingPayments: pp,
      configuredAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <header className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-muted"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Configuración inicial</span>
      </header>

      <h1 className="mt-6 font-display text-3xl font-bold leading-tight">
        Cuéntanos cómo estás <span className="text-primary">este mes</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Con estos dos datos calculamos cuánto puedes gastar por día.
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="balance" className="text-sm font-semibold">
            Saldo disponible actual
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              {settings.currency}
            </span>
            <Input
              id="balance"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="h-14 rounded-2xl pl-14 text-lg font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Cuánto dinero tienes hoy disponible en total.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pending" className="text-sm font-semibold">
            Pagos pendientes del mes
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              {settings.currency}
            </span>
            <Input
              id="pending"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="h-14 rounded-2xl pl-14 text-lg font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Alquiler, créditos, servicios, tarjetas y otras obligaciones.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-10">
        <Button
          onClick={submit}
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg"
        >
          Calcular
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- Main ---------------------------- */

function Main({
  config,
  expenses,
  settings,
  onAddExpense,
  onDeleteExpense,
  onUpdateSettings,
  onReconfigure,
  onResetAll,
}: {
  config: Config;
  expenses: Expense[];
  settings: Settings;
  onAddExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateSettings: (s: Settings) => void;
  onReconfigure: () => void;
  onResetAll: () => void;
}) {
  const stats = useMemo(
    () => computeStats(config, expenses, settings),
    [config, expenses, settings],
  );
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const statusVars =
    stats.status === "green"
      ? { fg: "var(--status-green-foreground)", bg: "var(--status-green)", soft: "var(--status-green-soft)" }
      : stats.status === "yellow"
      ? { fg: "var(--status-yellow-foreground)", bg: "var(--status-yellow)", soft: "var(--status-yellow-soft)" }
      : { fg: "var(--status-red-foreground)", bg: "var(--status-red)", soft: "var(--status-red-soft)" };

  const share = async () => {
    const text = `Me quedan ${formatMoney(stats.saldoDisponible, settings.currency)} y puedo gastar ${formatMoney(
      Math.max(stats.gastoDiario, 0),
      settings.currency,
    )} por día hasta fin de mes usando Me AlcanzApp.`;
    try {
      if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
        await (navigator as Navigator).share({ text, title: "Me AlcanzApp" });
        return;
      }
    } catch {
      /* ignore and fall back */
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative flex flex-1 flex-col pb-32">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground shadow"
            style={{ background: "var(--primary)" }}
          >
            <Wallet className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold">Me AlcanzApp</span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-muted"
          aria-label="Ajustes"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Hero card */}
      <section className="px-5 pt-6">
        <Card
          className="relative overflow-hidden rounded-3xl border-0 p-6 shadow-xl"
          style={{ background: statusVars.bg, color: statusVars.fg }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />

          <div className="relative">
            <p className="text-sm font-medium opacity-90">Puedes gastar hoy</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-xs font-semibold uppercase tracking-wider opacity-80">
                {settings.currency}
              </span>
              <span className="font-display text-6xl font-bold leading-none tracking-tight">
                {Math.max(stats.gastoDiario, 0).toLocaleString("es-ES", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-white" />
              {stats.mensaje}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              <Stat label="Saldo" value={formatMoney(stats.saldoDisponible, settings.currency)} />
              <Stat label="Pendientes" value={formatMoney(config.pendingPayments, settings.currency)} />
              <Stat label="Días restantes" value={`${stats.diasRestantes}`} />
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={share}
            className="h-12 rounded-2xl text-sm font-semibold"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartir resultado
          </Button>
          <Button
            variant="outline"
            onClick={onReconfigure}
            className="h-12 rounded-2xl text-sm font-semibold"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Reconfigurar
          </Button>
        </div>
      </section>

      {/* Historial */}
      <section className="mt-8 flex-1 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Historial</h2>
          <span className="text-xs text-muted-foreground">
            {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">Aún no registras gastos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Toca el botón <span className="font-bold">+</span> para añadir el primero.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <CategoryIcon category={e.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{e.category}</p>
                    <p className="shrink-0 font-display text-sm font-bold">
                      − {formatMoney(e.amount, settings.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {e.description || "Sin descripción"}
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteExpense(e.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Eliminar gasto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 left-1/2 z-20 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full text-primary-foreground shadow-2xl transition active:scale-95"
        style={{ background: "var(--primary)" }}
        aria-label="Agregar gasto"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <AddExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        currency={settings.currency}
        onAdd={onAddExpense}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdate={onUpdateSettings}
        onReset={onResetAll}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const emoji: Record<string, string> = {
    Alimentación: "🍽️",
    Transporte: "🚌",
    Salud: "💊",
    Educación: "📚",
    Compras: "🛍️",
    Entretenimiento: "🎬",
    Otros: "✨",
  };
  return <span className="text-lg">{emoji[category] ?? "✨"}</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

/* ---------------------------- Add Expense ---------------------------- */

function AddExpenseDialog({
  open,
  onOpenChange,
  currency,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
  onAdd: (e: Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setAmount("");
      setCategory(CATEGORIES[0]);
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  const submit = () => {
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    onAdd({
      id: crypto.randomUUID(),
      amount: a,
      category,
      description: description.trim(),
      date: new Date(date).toISOString(),
    });
    onOpenChange(false);
    toast.success("Gasto registrado.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nuevo gasto</DialogTitle>
          <DialogDescription>Se descontará automáticamente de tu saldo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-14 rounded-2xl pl-14 text-lg font-semibold"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descripción</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="min-h-[72px] rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-2xl"
          >
            Cancelar
          </Button>
          <Button onClick={submit} className="h-12 rounded-2xl font-semibold">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- Settings ---------------------------- */

function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onUpdate,
  onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: Settings;
  onUpdate: (s: Settings) => void;
  onReset: () => void;
}) {
  const [currency, setCurrency] = useState(settings.currency);
  const [green, setGreen] = useState(settings.greenThreshold.toString());
  const [yellow, setYellow] = useState(settings.yellowThreshold.toString());

  useEffect(() => {
    if (open) {
      setCurrency(settings.currency);
      setGreen(settings.greenThreshold.toString());
      setYellow(settings.yellowThreshold.toString());
    }
  }, [open, settings]);

  const save = () => {
    const g = parseFloat(green);
    const y = parseFloat(yellow);
    if (!Number.isFinite(g) || !Number.isFinite(y) || g <= y) {
      toast.error("El límite verde debe ser mayor al amarillo.");
      return;
    }
    onUpdate({
      currency: currency.trim() || "Bs",
      greenThreshold: g,
      yellowThreshold: y,
    });
    toast.success("Ajustes guardados.");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl">Ajustes</SheetTitle>
          <SheetDescription>Personaliza la moneda y el semáforo.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={5}
              className="h-12 rounded-2xl"
              placeholder="Bs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="green" className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--status-green)" }}
                />
                Verde ≥
              </Label>
              <Input
                id="green"
                type="number"
                inputMode="decimal"
                value={green}
                onChange={(e) => setGreen(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yellow" className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--status-yellow)" }}
                />
                Amarillo ≥
              </Label>
              <Input
                id="yellow"
                type="number"
                inputMode="decimal"
                value={yellow}
                onChange={(e) => setYellow(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Por debajo del amarillo se considera estado rojo.
          </p>

          <Button onClick={save} className="h-12 w-full rounded-2xl font-semibold">
            Guardar ajustes
          </Button>

          <button
            onClick={() => {
              if (confirm("¿Borrar todos los datos? Esta acción no se puede deshacer.")) {
                onReset();
                onOpenChange(false);
              }
            }}
            className="w-full rounded-2xl py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Borrar todos los datos
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
