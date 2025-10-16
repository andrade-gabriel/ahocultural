import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Menu as MenuIcon, Search, ChevronRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ---------------------------
   1) CONFIG DO MENU
---------------------------- */
type SubItem = {
  label: string;
  href: (location?: string) => string;
};
type NavItem = {
  label: string;
  href: (location?: string) => string;
  showInMain?: boolean;
  children?: SubItem[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Eventos",
    showInMain: true,
    href: (loc) => `/${loc ?? ""}/eventos`,
    children: [
      { label: "Pra Hoje", href: (loc) => `/${loc ?? ""}/eventos/hoje` },
      { label: "Esta Semana", href: (loc) => `/${loc ?? ""}/eventos/esta-semana` },
      { label: "Este FDS", href: (loc) => `/${loc ?? ""}/eventos/fim-de-semana` },
    ],
  },
  { label: "Revista", showInMain: true, href: () => `/revista` },
  { label: "Destaques", showInMain: true, href: () => `/destaques` },
  { label: "Ahô Aconselha", showInMain: true, href: () => `/aconselha` },
];

/* helpers */
const isEventsPath = (pathname: string) => /\/eventos(\/|$)/.test(pathname);
const eqPath = (a: string, b: string) => {
  const norm = (s: string) => (s.endsWith("/") ? s.slice(0, -1) : s);
  return norm(a) === norm(b);
};

/* ---------------------------
   2) COMPONENTE
---------------------------- */
export const Header = () => {
  const { location } = useParams<{ location?: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [query, setQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/${location}/eventos?q=${encodeURIComponent(q)}`);
  };

  const mainItems = useMemo(() => NAV_ITEMS.filter((i) => i.showInMain), []);
  const contextualChildren = useMemo<SubItem[]>(() => {
    const ev = NAV_ITEMS.find((i) => i.label.toLowerCase() === "eventos");
    return ev?.children ?? [];
  }, []);

  return (
    <header className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Linha 1: Logo • Busca • Hamburguer (à direita) */}
      <div className="mx-auto w-full px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="p-0 h-10 w-[140px] justify-start hover:bg-transparent focus-visible:outline-none"
            aria-label="Ir para a Home"
          >
            <img src="/logo.svg" alt="AHÔ Cultural" className="block w-auto select-none" />
          </Button>

          {/* Busca */}
          <form onSubmit={onSubmit} className="ml-auto flex items-center gap-3 w-full max-w-[420px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 h-4 w-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-9 w-full rounded-full border-none bg-muted/30 pl-10 pr-4 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-foreground/30"
              />
            </div>
          </form>

          {/* Hamburguer no canto direito */}
          <div className="flex lg:hidden">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src="/logo.svg" alt="AHÔ Cultural" className="h-6" />
                  </SheetTitle>
                </SheetHeader>

                <nav className="mt-6 space-y-2">
                  {mainItems.map((item) => {
                    const key = item.label;
                    const hasChildren = !!item.children?.length;
                    const expanded = !!openChildren[key];

                    return (
                      <div key={key}>
                        <button
                          className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:outline-none"
                          onClick={() => {
                            if (hasChildren) {
                              setOpenChildren((s) => ({ ...s, [key]: !s[key] }));
                            } else {
                              navigate(item.href(location));
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <span className="font-medium">{item.label}</span>
                          {hasChildren ? (
                            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          ) : null}
                        </button>

                        {hasChildren && expanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.children!.map((sub) => (
                              <button
                                key={sub.label}
                                className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none"
                                onClick={() => {
                                  navigate(sub.href(location));
                                  setOpenMobile(false);
                                }}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <Separator className="mt-2" />

      {/* Linha 2: Menu principal (desktop) */}
      <nav className="hidden lg:block w-full">
        <div className="mx-auto w-full">
          <ul className="flex h-12 items-stretch justify-between">
            {mainItems.map((item) => {
              const href = item.href(location);
              const active =
                eqPath(pathname, href) ||
                (item.label.toLowerCase() === "eventos" && isEventsPath(pathname));
              return (
                <li key={item.label} className="flex-1">
                  <button
                    className={cn(
                      "w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none transition-colors",
                      "hover:bg-foreground hover:text-background",
                      active && "underline underline-offset-8 decoration-2",
                      "focus:bg-transparent focus:text-inherit focus-visible:outline-none"
                    )}
                    onClick={(e) => {
                      navigate(href);
                      (e.currentTarget as HTMLButtonElement).blur();
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <Separator className="hidden lg:block" />

      {/* Linha 3: Abas contextuais (desktop) */}
      {isEventsPath(pathname) && contextualChildren.length > 0 && (
        <>
          <div className="hidden lg:block w-full border-border/50">
            <div className="mx-auto w-full">
              <div className="flex w-full items-stretch justify-start">
                {contextualChildren.map((sub) => {
                  const href = sub.href(location);
                  const active = eqPath(pathname, href);
                  return (
                    <button
                      key={sub.label}
                      className={cn(
                        "flex-1 h-10 px-4 text-sm font-semibold uppercase tracking-widest transition-colors rounded-none",
                        "hover:bg-foreground hover:text-background",
                        active && "underline underline-offset-8 decoration-2",
                        "focus:bg-transparent focus:text-inherit focus-visible:outline-none"
                      )}
                      onClick={(e) => {
                        navigate(href);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <Separator className="hidden lg:block" />
        </>
      )}
    </header>
  );
};
