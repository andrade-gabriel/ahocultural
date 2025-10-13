import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const Header = () => {
  const { location } = useParams<{
    location?: string;
  }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim())
      navigate(`/${location}/eventos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* --- Linha 1: logo • cidades • busca --- */}
      <div className="w-full">
        <div className="mx-auto w-full px-6">
          <div className="flex h-20 items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="p-0 h-10 w-[140px] justify-start hover:bg-transparent"
              aria-label="Ir para a Home"
            >
              <img
                src="/logo.svg"
                alt="AHÔ Cultural"
                className="block w-auto select-none"
              />
            </Button>
            <form
              onSubmit={onSubmit}
              className="ml-auto flex items-center gap-3 w-full max-w-[420px]"
            >
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
          </div>
        </div>
      </div>
      <Separator className="mt-3" />
      {/* --- Linha 2: menu principal (bold/uppercase) --- */}
      <nav className="w-full">
        <div className="mx-auto w-full">
          <ul className="flex h-12 items-stretch justify-between">
            {/* <li className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none
                     hover:bg-black hover:text-white transition-colors duration-200"
              >
                Sobre Ahô
              </Button>
            </li> */}
            <li className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none
                     hover:bg-black hover:text-white transition-colors duration-200"
                onClick={() => navigate(`/${location}/eventos`)}
              >
                Eventos
              </Button>
            </li>
            <li className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none
                     hover:bg-black hover:text-white transition-colors duration-200"
              >
                Revista
              </Button>
            </li>
            <li className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none
                     hover:bg-black hover:text-white transition-colors duration-200"
              >
                Destaques
              </Button>
            </li>
            {/* <li className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-full px-0 text-base font-extrabold uppercase tracking-wide rounded-none
                     hover:bg-black hover:text-white transition-colors duration-200"
              >
                Ahô Aconselha
              </Button>
            </li> */}
          </ul>
        </div>
      </nav>
      <Separator />
      {/* --- Linha 3: abas secundárias (muted) --- */}
      <div className="w-full border-border/50">
        <div className="mx-auto w-full">
          <div className="flex w-full items-stretch justify-start">
            <button
              className="flex-1 h-10 px-4 text-sm font-semibold uppercase tracking-widest
                   text-foreground transition-colors duration-200 rounded-none
                   hover:bg-black hover:text-white"
              onClick={() => navigate(`/${location}/eventos/hoje`)}
            >
              Pra Hoje
            </button>
            <button
              className="flex-1 h-10 px-4 text-sm font-semibold uppercase tracking-widest
                   text-foreground transition-colors duration-200 rounded-none
                   hover:bg-black hover:text-white"
              onClick={() => navigate(`/${location}/eventos/esta-semana`)}
            >
              Esta Semana
            </button>
            <button
              className="flex-1 h-10 px-4 text-sm font-semibold uppercase tracking-widest
                   text-foreground transition-colors duration-200 rounded-none
                   hover:bg-black hover:text-white"
              onClick={() => navigate(`/${location}/eventos/fim-de-semana`)}
            >
              Este FDS
            </button>
            <button
              className="flex-1 h-10 px-4 text-sm font-semibold uppercase tracking-widest
                   text-foreground transition-colors duration-200 rounded-none
                   hover:bg-black hover:text-white"
            >
              Ahô Aconselha
            </button>
          </div>
        </div>
      </div>
      <Separator />
    </header>
  );
};