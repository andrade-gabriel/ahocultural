import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { listCategories, listCategoryChildren } from "@/api/category";
import { listLocations } from "@/api/location";
import { useTranslation } from "react-i18next";

type Category = { id: string; name: string; slug?: string };
type Subcategory = { id: string; name: string; slug?: string };
type Location = {
  id: string;
  city: string;
  citySlug: string;
  districtsAndSlugs: Record<string, string>; // { "Vila Madalena": "vila-madalena" }
};

type FilterState = {
  categoryId: string | null;
  subcategoryId: string | null;
  referenceId: string | null; // location.id
  district: string | null;    // slug do bairro
  date: Date | null;
  text?: string | null;
};

type Props = {
  onApply?: (filters: FilterState) => void;
  onChange?: (filters: FilterState) => void;
  defaultValue?: Partial<FilterState>;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function FilterLayout({ onApply, onChange, defaultValue }: Props) {
  const navigate = useNavigate();
  const { location: locationParam, district: districtParam } = useParams<{
    location?: string;
    district?: string;
  }>();

  // ----- dados -----
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // loading flags
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // ----- estado -----
  const [filters, setFilters] = useState<FilterState>({
    categoryId: defaultValue?.categoryId ?? null,
    subcategoryId: defaultValue?.subcategoryId ?? null,
    referenceId: defaultValue?.referenceId ?? null,
    district: defaultValue?.district ?? null,
    date: defaultValue?.date ?? null,
    text: defaultValue?.text ?? null,
  });

  // bairros derivados da referência (lista visível)
  const districts = useMemo(() => {
    const loc = locations.find((l) => l.id === filters.referenceId);
    return loc ? Object.entries(loc.districtsAndSlugs).map(([name, slug]) => ({ name, slug })) : [];
  }, [locations, filters.referenceId]);

  // ----- load inicial (categorias + locais) -----
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingCats(true);
        const [cats, locs] = await Promise.all([
          listCategories({ take: 100 }, { signal: controller.signal }),
          listLocations({ take: 100 }, { signal: controller.signal }),
        ]);
        setCategories(cats);
        setLocations(locs);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") console.error("Erro carregando filtros:", e);
      } finally {
        setLoadingCats(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ----- quando muda a categoria: zera sub e busca filhos -----
  useEffect(() => {
    const catId = filters.categoryId;
    setFilters((f) => ({ ...f, subcategoryId: null }));
    setSubcategories([]);

    if (!catId) return;

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingSubs(true);
        const children = await listCategoryChildren(catId, { take: 200 }, { signal: controller.signal });
        setSubcategories(children ?? []);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") console.error("Erro ao carregar subcategorias:", e);
        setSubcategories([]);
      } finally {
        setLoadingSubs(false);
      }
    })();

    return () => controller.abort();
  }, [filters.categoryId]);

  // ----- quando muda referência: zera bairro -----
  useEffect(() => {
    setFilters((f) => ({ ...f, district: null }));
  }, [filters.referenceId]);

  // notify pai
  useEffect(() => {
    onChange?.(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categoryId, filters.subcategoryId, filters.referenceId, filters.district, filters.date, filters.text]);

  const clearAll = () =>
    setFilters({ categoryId: null, subcategoryId: null, referenceId: null, district: null, date: null, text: null });

  // ---------- helpers para montar URL ----------
  const getCategorySlug = (id: string | null) => {
    if (!id) return null;
    const cat = categories.find((c) => c.id === id);
    if (!cat) return null;
    return (cat as any).slug ?? slugify(cat.name);
  };

  const getSubcategorySlug = (id: string | null) => {
    if (!id) return null;
    const sub = subcategories.find((s) => s.id === id);
    if (!sub) return null;
    return (sub as any).slug ?? slugify(sub.name);
  };

  const resolveCitySlug = () => {
    if (filters.referenceId) {
      const loc = locations.find((l) => l.id === filters.referenceId);
      if (loc?.citySlug) return loc.citySlug;
    }
    return locationParam ?? "";
  };

  const buildEventsUrl = () => {
    const citySlug = resolveCitySlug();
    if (!citySlug) return null;

    const parts: string[] = ["", citySlug]; // "/sao-paulo"

    // district preferencialmente do filtro; se não tiver, usa o que já está na URL
    const districtSlug = filters.district ?? districtParam ?? null;
    if (districtSlug) parts.push(districtSlug);

    parts.push("eventos");

    const categorySlug = getCategorySlug(filters.categoryId);
    if (categorySlug) {
      parts.push(categorySlug);
      const subSlug = getSubcategorySlug(filters.subcategoryId);
      if (subSlug) parts.push(subSlug);
    }

    // query params (opcionais)
    const qs = new URLSearchParams();
    if (filters.text) qs.set("q", filters.text);
    if (filters.date) qs.set("from", format(filters.date, "yyyy-MM-dd"));

    const path = parts.join("/");
    return qs.toString() ? `${path}?${qs.toString()}` : path;
  };

  const handleApply = () => {
    const url = buildEventsUrl();
    if (url) navigate(url);
    onApply?.(filters);
  };

  /* ============== UI ============== */

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Categoria */}
        <Field label="Categoria" className="md:col-span-4">
          <Combobox
            loading={loadingCats}
            value={filters.categoryId ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, categoryId: v || null }))}
            placeholder="Selecione a categoria"
            items={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>

        {/* Subcategoria */}
        <Field label="Subcategoria" className="md:col-span-4">
          <Combobox
            loading={loadingSubs}
            disabled={!filters.categoryId || (subcategories.length === 0 && !loadingSubs)}
            value={filters.subcategoryId ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, subcategoryId: v || null }))}
            placeholder={
              filters.categoryId ? (loadingSubs ? "Carregando..." : "Selecione a subcategoria") : "Escolha uma categoria primeiro"
            }
            items={subcategories.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>

        {/* Ponto de Referência */}
        <Field label="Ponto de Referência" className="md:col-span-4">
          <Combobox
            value={filters.referenceId ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, referenceId: v || null }))}
            placeholder="Selecione o ponto de referência"
            items={locations.map((l) => ({ value: l.id, label: l.city }))}
          />
        </Field>

        {/* Bairro (value = slug; label = nome) */}
        <Field label="Bairro" className="md:col-span-4">
          <Combobox
            disabled={!filters.referenceId}
            value={filters.district ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, district: v || null }))}
            placeholder={filters.referenceId ? "Selecione o bairro" : "Escolha o ponto de referência"}
            items={districts.map(({ name, slug }) => ({ value: slug, label: name }))}
          />
        </Field>

        {/* Data */}
        <Field label="A partir de" className="md:col-span-4">
          <DateButton
            date={filters.date ?? undefined}
            onChange={(d) => setFilters((f) => ({ ...f, date: d ?? null }))}
          />
        </Field>

        {/* Texto */}
        <Field label="Texto" className="md:col-span-4">
          <Input
            type="text"
            value={filters.text ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value || null }))}
            placeholder="Ex.: show, jazz, exposição…"
          />
        </Field>

        {/* Ações */}
        <div className="md:col-span-4 flex flex-row items-stretch gap-2">
          <Button variant="outline" className="w-1/2 md:w-auto" onClick={clearAll}>
            Limpar
          </Button>
          <Button className="w-1/2 md:w-auto" onClick={handleApply}>
            Buscar
          </Button>
        </div>
      </div>

      {/* Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.categoryId && (
          <Chip
            label={categories.find((c) => c.id === filters.categoryId)?.name ?? "Categoria"}
            onClear={() => setFilters((f) => ({ ...f, categoryId: null }))}
          />
        )}
        {filters.subcategoryId && (
          <Chip
            label={subcategories.find((s) => s.id === filters.subcategoryId)?.name ?? "Subcategoria"}
            onClear={() => setFilters((f) => ({ ...f, subcategoryId: null }))}
          />
        )}
        {filters.referenceId && (
          <Chip
            label={locations.find((l) => l.id === filters.referenceId)?.city ?? "Referência"}
            onClear={() => setFilters((f) => ({ ...f, referenceId: null }))}
          />
        )}
        {filters.district && <Chip label={filters.district} onClear={() => setFilters((f) => ({ ...f, district: null }))} />}
        {filters.date && (
          <Chip
            label={format(filters.date, "dd 'de' MMMM")}
            onClear={() => setFilters((f) => ({ ...f, date: null }))}
          />
        )}
        {filters.text && <Chip label={filters.text} onClear={() => setFilters((f) => ({ ...f, text: null }))} />}
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function Field(props: { label: string; className?: string; children: React.ReactNode }) {
  const { label, className, children } = props;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-foreground/80">{label}</div>
      {children}
    </div>
  );
}

function Combobox({
  value,
  onChange,
  items,
  placeholder,
  disabled,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation("default")
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.label : loading ? "Carregando..." : (placeholder ?? "Selecionar")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("defaultSearchPlaceholder")} />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value === value ? "" : item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DateButton({
  date,
  onChange,
}: {
  date?: Date;
  onChange: (d?: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {date ? format(date, "dd 'de' MMMM 'de' yyyy") : "Selecione a data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onChange} locale={ptBR} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="pr-1.5 pl-2 py-1 rounded-full">
      {label}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 ml-1 rounded-full hover:bg-muted"
        onClick={onClear}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}
