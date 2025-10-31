import { useCallback } from "react";
import { StrictAsyncCombobox, type Option } from "./StrictAsyncSelect";
import { listCategories, getCategoryById } from "@/api/category";

const DEFAULT_TAKE = 10;

export function CategoryAutocomplete({
  value,
  parent,
  onChange,
  disabled,
}: {
  value: string | null;
  parent: boolean | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const fetchOptions = useCallback(async (q: string, signal?: AbortSignal): Promise<Option[]> => {
    parent = parent ? parent : false;
    const term = q.trim();
    // 1) quando não digitou nada -> top 10
    if (!term) {
      const items = await listCategories({ skip: 0, take: DEFAULT_TAKE, parent: parent }, { signal });
      return items.map(c => ({ value: c.id, label: c.name.pt }));
    }

    // 2) quando digitou -> tenta filtrar
    const filtered = await listCategories({ skip: 0, take: DEFAULT_TAKE, parent: parent, search: term }, { signal });
    if (filtered.length > 0) {
      return filtered.map(c => ({ value: c.id, label: c.name.pt }));
    }

    // 3) fallback: se não encontrou nada, volta top 10
    const fallback = await listCategories({ skip: 0, take: DEFAULT_TAKE, parent: parent }, { signal });
    return fallback.map(c => ({ value: c.id, label: c.name.pt }));
  }, []);

  const resolveById = useCallback(async (id: string, signal?: AbortSignal) => {
    try {
      const c = await getCategoryById(id, { signal });
      return { value: c.id, label: c.name.pt } as Option;
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
      placeholder="Selecionar categoria…"
      disabled={disabled}
      emptyLabel="Sem resultados"
    />
  );
}
