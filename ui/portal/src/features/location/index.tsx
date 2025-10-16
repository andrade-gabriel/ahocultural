import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { type Location, listLocations } from "@/api/location";
import { cn } from "@/lib/utils";

function getLayoutClasses(count: number) {
  let grid =
    "grid grid-cols-1 md:grid-cols-2 items-center justify-items-center gap-y-8 md:gap-y-12";
  let text =
    "font-semibold tracking-tight text-black select-none uppercase leading-tight text-center";

  if (count === 2) {
    text = cn(text, "text-[10vw] md:text-[7vw] lg:text-[5vw]");
    grid = cn(grid, "min-h-[60vh]");
  } else if (count === 4) {
    text = cn(text, "text-[9vw] md:text-[6vw] lg:text-[4.5vw]");
  } else {
    text = cn(text, "text-[8vw] md:text-[5.5vw] lg:text-[4vw]");
  }

  return { grid, text };
}

export const LocationLayout = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      let redirected = false; // evita setState após redirect

      try {
        const data = await listLocations({ skip: 0, take: 50 }, { signal: controller.signal });
        const active = (data ?? []).filter((l) => l.active);

        if (active.length === 1 && active[0]?.citySlug) {
          redirected = true;
          setRedirecting(true);
          navigate(`/${active[0].citySlug}`, { replace: true });
          return;
        }

        setItems(active);
      } catch (err: any) {
        const name = err?.name;
        const code = err?.code;
        if (name === "AbortError" || name === "CanceledError" || code === "ERR_CANCELED") return;
        // setError(err?.message ?? "Falha ao carregar locais.");
      } finally {
        if (!redirected) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [navigate]);

  // enquanto carrega ou redireciona, tela branca total
  if (loading || redirecting) {
    return <div className="min-h-dvh bg-white" />;
  }

  const { grid, text } = getLayoutClasses(items.length);

  if(items.length != 0)
    return (
      <div className="min-h-dvh bg-white text-black">
        {/* Header */}
        <header className="w-full">
          <div className="w-full flex justify-center">
            <img
              src="/logo.svg"
              alt="AHÔ Cultural"
              className="block h-auto shrink-0 pointer-events-none select-none"
              style={{ width: "clamp(160px, 15vw, 280px)" }}
              draggable={false}
            />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6">
            <ul className={grid} role="list" aria-label="Escolha a cidade">
              {items.map((l) => (
                <li key={l.id} className="w-full flex items-center justify-center">
                  <Link
                    to={`/${l.citySlug}`}
                    className={cn(
                      text,
                      "hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none"
                    )}
                  >
                    {l.city}
                  </Link>
                </li>
              ))}
            </ul>
        </main>

        <footer className="h-10" />
      </div>
    );
  return null;
};
