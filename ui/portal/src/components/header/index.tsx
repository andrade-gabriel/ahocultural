import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Menu as MenuIcon, Search, ChevronRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/* ---------------------------
   1) MENU PRINCIPAL
---------------------------- */
type SubItem = {
  label: string;
  href: (location?: string) => string;
};
type NavItem = {
  label: string;
  href: (location?: string) => string;
  showInMain?: boolean;
};

const isCity = (loc?: string) => !!loc && !["contato", "quem-somos", "anuncie", "estudio-aho"].includes(loc);
const joinLoc = (loc: string | undefined, path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return isCity(loc) ? `/${loc}${p}` : p;
};


export const NAV_ITEMS: NavItem[] = [
  { label: "headerTodayLink", showInMain: true, href: (loc) => joinLoc(loc, `/pra-hoje`) },
  { label: "headerWeekendLink", showInMain: true, href: (loc) => joinLoc(loc, `/este-fds`) },
  { label: "headerWeekLink", showInMain: true, href: (loc) => joinLoc(loc, `/esta-semana`) },
  { label: "headerFeaturedLink", showInMain: true, href: (loc) => joinLoc(loc, `/destaques`) },
  { label: "headerStudioLink", showInMain: true, href: (loc) => joinLoc(loc, `/estudio-aho`) },
];

/* ---------------------------
   2) SUBMENU FIXO
---------------------------- */
const STUDIO_SUBMENU: SubItem[] = [
  { label: "headerInstitutionalLink", href: (loc) => joinLoc(loc, `/quem-somos`) },
  { label: "headerAdvertiseLink", href: (loc) => joinLoc(loc, `/seu-espaco-na-aho`) },
  { label: "headerContactLink", href: (loc) => joinLoc(loc, `/contato`) },
];

const eqPath = (a: string, b: string) => {
  const norm = (s: string) => (s.endsWith("/") ? s.slice(0, -1) : s);
  return norm(a) === norm(b);
};

/* ---------------------------
   2.1) IDIOMAS
---------------------------- */
type LangCode = "pt" | "en" | "es";
type Language = { code: LangCode; label: string; flag: string };

const LANGUAGES: Language[] = [
  { code: "pt", label: "Português", flag: "pt-br" },
  { code: "en", label: "English", flag: "en-us" },
  { code: "es", label: "Español", flag: "es" },
];

// Caso prefira SVGs:
// const flagSrc = (code: LangCode) => `/flags/${code}.svg`;

function useLanguage() {
  const { i18n } = useTranslation();
  const initial =
    (typeof window !== "undefined" && (localStorage.getItem("lang") as LangCode)) ||
    ((i18n.language?.slice(0, 2) as LangCode) ?? "pt");

  const [current, setCurrent] = useState<LangCode>(initial);

  useEffect(() => {
    const apply = async (lng: LangCode) => {
      await i18n.changeLanguage(lng);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("lang", lng);
      }
    };
    apply(current);
  }, [current, i18n]);

  const change = (lng: LangCode) => {
    setCurrent(lng);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lng);
    }
  };

  return { current, change };
}

function LanguageSelector({
  current,
  onChange,
  variant = "desktop",
}: {
  current: LangCode;
  onChange: (lng: LangCode) => void;
  variant?: "desktop" | "mobile";
}) {
  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  if (variant === "mobile") {
    // Botões simples no menu mobile, com bandeira
    return (
      <div className="mt-4 space-y-1">
        <div className="px-3 text-xs uppercase tracking-wide text-muted-foreground/80">Idioma</div>
        <div className="flex items-center gap-2 px-3">
          {LANGUAGES.map((l) => (
            <Button
              key={l.code}
              variant={l.code === current ? "default" : "outline"}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onChange(l.code)}
              aria-label={`Mudar idioma para ${l.label}`}
            >
              <img
                src={`/languages/${l.flag}.svg`}
                alt={l.label}
                className="h-4 w-4 rounded-full object-cover inline-block"
              />
              <span className="text-base leading-none"></span>
              {l.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown (desktop) com a bandeira do idioma atual no trigger
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          aria-label={`Idioma atual ${currentLang.label}`}
        >
          {/* <span className="text-base leading-none">{currentLang.flag}</span> */}
          <img
            src={`/languages/${currentLang.flag}.svg`}
            alt={currentLang.label}
            className="h-4 w-4 rounded-full object-cover inline-block"
          />
          <span className="hidden sm:inline">{currentLang.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => onChange(l.code)} className="gap-2">
            {/* <span className="text-base leading-none">{l.flag}</span> */}
            <img
              src={`/languages/${l.flag}.svg`}
              alt={currentLang.label}
              className="h-4 w-4 rounded-full object-cover inline-block"
            />
            <span className={cn("flex-1", l.code === current && "font-semibold")}>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------
   3) COMPONENTE
---------------------------- */
export const Header = () => {
  const { t } = useTranslation(["default", "header"]);
  const { location } = useParams<{ location?: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [query, setQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);
  const [openStudioMobile, setOpenStudioMobile] = useState(false);

  const { current: lang, change: setLang } = useLanguage();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const base = joinLoc(location, "/eventos");
    navigate(`${base}?q=${encodeURIComponent(q)}`);
  };

  const mainItems = useMemo(() => NAV_ITEMS.filter((i) => i.showInMain), []);

  return (
    <header className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Linha 1: Logo + Busca + Idioma + Mobile menu */}
      <div className="mx-auto w-full px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="p-0 h-10 w-[140px] justify-start hover:bg-transparent focus-visible:outline-none"
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
                placeholder={t("default:defaultSearchPlaceholder")}
                className="h-9 w-full rounded-full border-none bg-muted/30 pl-10 pr-4 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-foreground/30"
              />
            </div>
          </form>

          {/* Seletor de Idioma (desktop) */}
          <div className="hidden lg:flex">
            <LanguageSelector current={lang} onChange={setLang} />
          </div>

          {/* Menu Mobile */}
          <div className="flex lg:hidden">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <img src="/logo.svg" alt="AHÔ Cultural" className="h-6" />
                  </SheetTitle>
                </SheetHeader>

                {/* Seletor de Idioma (mobile) */}
                <LanguageSelector
                  variant="mobile"
                  current={lang}
                  onChange={(code) => {
                    setLang(code);
                    // Se quiser fechar o menu após trocar:
                    // setOpenMobile(false);
                  }}
                />

                <nav className="mt-6 space-y-2">
                  {mainItems.map((item) => {
                    const isStudio = item.label === "headerStudioLink";
                    const href = item.href(location);

                    return (
                      <div key={item.label}>
                        <button
                          className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:outline-none"
                          onClick={() => {
                            if (isStudio) setOpenStudioMobile((s) => !s);
                            else {
                              navigate(href);
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <span className="font-bebas font-bold uppercase tracking-[-0.02em] text-black text-lg leading-none">
                            {t(`header:${item.label}`)}
                          </span>
                          {isStudio &&
                            (openStudioMobile ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            ))}
                        </button>

                        {isStudio && openStudioMobile && (
                          <div className="ml-4 mt-1 space-y-1">
                            {STUDIO_SUBMENU.map((sub) => (
                              <button
                                key={sub.label}
                                className="w-full rounded-md px-3 py-2 text-left focus-visible:outline-none"
                                onClick={() => {
                                  navigate(sub.href(location));
                                  setOpenMobile(false);
                                }}
                              >
                                <span className="font-bebas font-bold uppercase tracking-[-0.02em] text-lg text-black/60 hover:text-black transition-colors">
                                  {t(`header:${sub.label}`)}
                                </span>
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
          <ul className="flex h-10 items-stretch justify-between">
            {mainItems.map((item) => {
              const href = item.href(location);
              const active = eqPath(pathname, href);
              return (
                <li key={item.label} className="flex-1">
                  <button
                    className={cn(
                      "w-full h-full px-0 font-bebas font-bold uppercase tracking-[-0.02em] text-black text-lg leading-none transition-colors",
                      active && "underline underline-offset-8 decoration-2",
                      "hover:text-black focus:bg-transparent focus-visible:outline-none"
                    )}
                    onClick={() => navigate(href)}
                  >
                    {t(`header:${item.label}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <Separator className="hidden lg:block" />

      {/* Linha 3: Submenu institucional (desktop) */}
      <div className="hidden lg:block w-full border-border/50">
        <div className="mx-auto w-full">
          <div className="flex w-full items-stretch justify-start">
            {STUDIO_SUBMENU.map((sub) => {
              const href = sub.href(location);
              const active = eqPath(pathname, href);
              return (
                <button
                  key={sub.label}
                  className={cn(
                    "flex-1 h-10 px-4 font-bebas font-bold uppercase tracking-[-0.02em] text-lg leading-none transition-colors",
                    active
                      ? "text-black underline underline-offset-8 decoration-2"
                      : "text-black/50 hover:text-black",
                    "focus:bg-transparent focus-visible:outline-none"
                  )}
                  onClick={() => navigate(href)}
                >
                  {t(`header:${sub.label}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="hidden lg:block" />
    </header>
  );
};
