import { useCallback } from "react";
import { StrictAsyncCombobox, type Option } from "./StrictAsyncSelect";
import { listCompanies, getCompanyById } from "@/api/company";

const DEFAULT_TAKE = 10;

export function CompanyAutocomplete({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const fetchOptions = useCallback(async (q: string, signal?: AbortSignal): Promise<Option[]> => {
    const term = q.trim();
    // 1) quando não digitou nada -> top 10
    if (!term) {
      const items = await listCompanies({ skip: 0, take: DEFAULT_TAKE }, { signal });
      return items.map(c => ({ value: c.id, label: c.name }));
    }

    // 2) quando digitou -> tenta filtrar
    const filtered = await listCompanies({ skip: 0, take: DEFAULT_TAKE, search: term }, { signal });
    if (filtered.length > 0) {
      return filtered.map(c => ({ value: c.id, label: c.name }));
    }

    // 3) fallback: se não encontrou nada, volta top 10
    const fallback = await listCompanies({ skip: 0, take: DEFAULT_TAKE }, { signal });
    return fallback.map(c => ({ value: c.id, label: c.name }));
  }, []);

  const resolveById = useCallback(async (id: string, signal?: AbortSignal) => {
    try {
      const c = await getCompanyById(id, { signal });
      return { value: c.id, label: c.name } as Option;
    } catch {
      return null;
    }
  }, []);

  return (
    <StrictAsyncCombobox
      value={value}
      onChange={onChange}
      fetchOptions={fetchOptions}
      resolveById={resolveById}
      placeholder="Selecionar empresa…"
      disabled={disabled}
      emptyLabel="Sem resultados"  // quase nunca aparecerá por causa do fallback
    />
  );
}
