// location.loader.ts
import { listLocations, type Location } from "@/api/location";

export async function locationLoader() {
  const data = await listLocations({ skip: 0, take: 50 });
  const items: Location[] = (data ?? []).filter((l) => l.active);

  // Se houver exatamente 1, redireciona ANTES de renderizar o componente
  if (items.length === 1 && items[0]?.citySlug) {
    throw new Response(null, {
      status: 302,
      headers: { Location: `/${items[0].citySlug}` },
    });
  }
  
  return { items };
}