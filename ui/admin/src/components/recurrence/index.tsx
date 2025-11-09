import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RecurrenceValue = {
  rrule: string;     // gerado automaticamente
  until: string;     // datetime-local
  rdates: string[];  // SEMPRE []
  exdates: string[]; // lista de datetime-local
};

type Props = {
  value?: RecurrenceValue;
  onChange: (val: RecurrenceValue | undefined) => void;
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
  disabled?: boolean;
};

type Freq = "DAILY" | "WEEKLY" | "MONTHLY";
const WEEKDAYS = [
  { code: "MO", label: "Seg" },
  { code: "TU", label: "Ter" },
  { code: "WE", label: "Qua" },
  { code: "TH", label: "Qui" },
  { code: "FR", label: "Sex" },
  { code: "SA", label: "Sáb" },
  { code: "SU", label: "Dom" },
] as const;

/** Label + tooltip reutilizável */
function LabelWithHelp({
  children,
  help,
  htmlFor,
}: { children: React.ReactNode; help: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex items-center gap-2">
      <FormLabel htmlFor={htmlFor}>{children}</FormLabel>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger type="button" className="text-muted-foreground">
            <Info className="h-4 w-4" aria-label="Ajuda" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-pre-line text-xs leading-relaxed">
            {help}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function buildRRule(opts: {
  freq: Freq;
  interval: number;
  byWeekDays: string[];        // MO,TU,...
  byMonthDay?: number | null;  // 1..31 (opcional p/ MONTHLY)
}) {
  const parts: string[] = [];
  parts.push(`FREQ=${opts.freq}`);

  const interval = Number.isFinite(opts.interval) && opts.interval > 0 ? opts.interval : 1;
  if (interval !== 1) parts.push(`INTERVAL=${interval}`);

  if (opts.freq === "WEEKLY" && opts.byWeekDays.length) {
    parts.push(`BYDAY=${opts.byWeekDays.join(",")}`);
  }

  if (opts.freq === "MONTHLY" && opts.byMonthDay && Number.isFinite(opts.byMonthDay)) {
    parts.push(`BYMONTHDAY=${opts.byMonthDay}`);
  }

  return parts.join(";");
}

/** Editor de lista de datas (apenas EXDATE aqui) */
function DateListEditor({
  label,
  help,
  value,
  onChange,
  disabled,
  addText,
  inputId,
}: {
  label: string;
  help: React.ReactNode;
  value: string[];
  onChange: (list: string[]) => void;
  disabled?: boolean;
  addText: string;
  inputId?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft) return;
    const d = new Date(draft);
    if (Number.isNaN(d.getTime())) return;
    const next = [...value, draft];
    next.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    onChange(next);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <LabelWithHelp help={help}>{label}</LabelWithHelp>
      <div className="flex gap-2">
        <Input
          id={inputId}
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" onClick={add} disabled={disabled || !draft}>
          {addText}
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="divide-y rounded border">
          {value.map((v, i) => (
            <li key={`${v}-${i}`} className="flex items-center justify-between p-2 text-sm">
              <span>{v}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeAt(i)} disabled={disabled}>
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const RecurrenceEditor = ({
  value,
  onChange,
  enabled,
  onToggleEnabled,
  disabled,
}: Props) => {
  // estado interno (defaults)
  const [freq, setFreq] = useState<Freq>("WEEKLY");
  const [interval, setInterval] = useState<number>(1);
  const [byWeekDays, setByWeekDays] = useState<string[]>(["WE"]); // padrão: quarta
  const [byMonthDay, setByMonthDay] = useState<number | null>(null);
  const until = value?.until ?? "";
  const rdates: string[] = []; // sempre vazio
  const exdates = value?.exdates ?? [];

  // liga/desliga
  const handleToggle = (v: boolean) => {
    onToggleEnabled(v);
    if (!v) {
      onChange(undefined);
    } else {
      const rrule = buildRRule({ freq, interval, byWeekDays, byMonthDay });
      onChange({ rrule, until: "", rdates: [], exdates: [] });
    }
  };

  // recalcula RRULE quando controles mudam
  useMemo(() => {
    if (!enabled) return;
    const rrule = buildRRule({ freq, interval, byWeekDays, byMonthDay });
    onChange({ rrule, until: until || "", rdates, exdates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq, interval, byWeekDays, byMonthDay]);

  const toggleWeekday = (code: string, checked: boolean) => {
    const set = new Set(byWeekDays);
    if (checked) set.add(code);
    else set.delete(code);
    setByWeekDays(Array.from(set));
  };

  const setUntil = (v: string) => {
    onChange({ rrule: buildRRule({ freq, interval, byWeekDays, byMonthDay }), until: v, rdates, exdates });
  };

  const setExDates = (list: string[]) => {
    onChange({ rrule: buildRRule({ freq, interval, byWeekDays, byMonthDay }), until, rdates, exdates: list });
  };

  return (
    <div className="rounded-lg border p-4 grid gap-4">
      {/* toggle master */}
      <FormItem className="flex items-center gap-3">
        <FormLabel className="mb-0">Evento recorrente</FormLabel>
        <FormControl>
          <Switch checked={enabled} onCheckedChange={handleToggle} disabled={disabled} />
        </FormControl>
        <FormMessage />
      </FormItem>

      {!enabled ? null : (
        <div className="grid gap-4">
          {/* FREQ + INTERVALO */}
          <div className="grid gap-4 md:grid-cols-3">
            <FormItem>
              <LabelWithHelp
                help={
                  <>
                    Escolha o período-base da repetição.{"\n"}
                    • Diária: repete em dias.{"\n"}
                    • Semanal: repete em semanas (opcionalmente em dias específicos).{"\n"}
                    • Mensal: repete no mesmo dia do mês (ex.: dia 10).
                  </>
                }
              >
                Frequência da repetição
              </LabelWithHelp>
              <FormControl>
                <select
                  className="border rounded px-3 py-2"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value as Freq)}
                  disabled={disabled}
                  aria-label="Frequência da repetição"
                >
                  <option value="DAILY">Diária</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </FormControl>
            </FormItem>

            <FormItem>
              <LabelWithHelp
                help={
                  <>
                    Define de quantos em quantos períodos o evento se repete.{"\n"}
                    Exemplos:{"\n"}
                    • Diária + A cada 2 → a cada 2 dias.{"\n"}
                    • Semanal + A cada 1 → toda semana.{"\n"}
                    • Mensal + A cada 3 → a cada 3 meses.
                  </>
                }
              >
                A cada (intervalo)
              </LabelWithHelp>
              <FormControl>
                <Input
                  id="recurrence-interval"
                  type="number"
                  min={1}
                  step={1}
                  value={String(interval)}
                  onChange={(e) => setInterval(Math.max(1, Number(e.target.value || 1)))}
                  disabled={disabled}
                  aria-describedby="recurrence-interval-help"
                />
              </FormControl>
            </FormItem>

            {freq === "MONTHLY" && (
              <FormItem>
                <LabelWithHelp
                  help={
                    <>
                      Dia do mês para a ocorrência (1 a 31).{"\n"}
                      Ex.: 15 → todo mês no dia 15.{"\n"}
                      Se vazio, usa o dia do início do evento.
                    </>
                  }
                >
                  Dia do mês
                </LabelWithHelp>
                <FormControl>
                  <Input
                    id="recurrence-monthday"
                    type="number"
                    min={1}
                    max={31}
                    value={byMonthDay ? String(byMonthDay) : ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : NaN;
                      setByMonthDay(Number.isFinite(v) ? Math.min(31, Math.max(1, v)) : null);
                    }}
                    disabled={disabled}
                    placeholder="1 a 31"
                  />
                </FormControl>
              </FormItem>
            )}
          </div>

          {/* BYDAY (somente semanal) */}
          {freq === "WEEKLY" && (
            <div className="grid gap-2">
              <LabelWithHelp
                help={
                  <>
                    Selecione em quais dias da semana a ocorrência deve acontecer.{"\n"}
                    Ex.: Ter + Qua → repete toda terça e quarta, conforme o intervalo.
                  </>
                }
              >
                Dias da semana
              </LabelWithHelp>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => {
                  const checked = byWeekDays.includes(d.code);
                  return (
                    <label key={d.code} className="inline-flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleWeekday(d.code, Boolean(v))}
                        disabled={disabled}
                        aria-label={`Dia da semana: ${d.label}`}
                      />
                      <span>{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* UNTIL */}
          <FormItem>
            <LabelWithHelp
              help={
                <>
                  Data limite (inclusiva) até quando gerar as ocorrências.{"\n"}
                  Use isso para evitar séries infinitas ou um índice muito grande.
                </>
              }
            >
              Repetir até
            </LabelWithHelp>
            <FormControl>
              <Input
                id="recurrence-until"
                type="datetime-local"
                value={until ?? ""}
                onChange={(e) => setUntil(e.target.value)}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* EXDATE (datas a pular) */}
          <DateListEditor
            label="Datas a pular (EXDATE)"
            help={
              <>
                Exceções: datas que **não** devem acontecer, apesar da regra.{"\n"}
                Ex.: feriado em que o evento não ocorre.
              </>
            }
            value={exdates}
            onChange={setExDates}
            disabled={disabled}
            addText="Adicionar exceção"
            inputId="recurrence-exdates"
          />
        </div>
      )}
    </div>
  );
};
