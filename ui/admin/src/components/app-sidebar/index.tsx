import { Link, useLocation } from "react-router";
import {
  Tags,
  Building2,
  MapPinCheckInside,
  Newspaper,
  CalendarCheck,
  Landmark,
  Star
} from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { pathname } = useLocation();

  const isActive = (url: string) =>
    pathname === `/${url}` || pathname.startsWith(`/${url}/`);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="text-center">Portal Administrativo</SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {/* -------- Seção: Institucional (header suave) -------- */}
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Landmark className="h-4 w-4" />
                  <span>
                    Institucional
                  </span>
                </div>

                {/* Subitens com indentação e linha guia */}
                <div className="ml-6 border-l pl-4 space-y-1">
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className={cn(
                      "rounded-md text-sm text-muted-foreground hover:text-foreground",
                      isActive("about") && "bg-accent/60 text-accent-foreground border border-accent/70"
                    )}
                  >
                    <Link to="/about">Quem Somos</Link>
                  </SidebarMenuButton>

                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className={cn(
                      "rounded-md text-sm text-muted-foreground hover:text-foreground",
                      isActive("advertisement") && "bg-accent/60 text-accent-foreground border border-accent/70"
                    )}
                  >
                    <Link to="/advertisement">Seu espaço na AHÔ</Link>
                  </SidebarMenuButton>

                  {/* <SidebarMenuButton
                    asChild
                    size="sm"
                    className={cn(
                      "rounded-md text-sm text-muted-foreground hover:text-foreground",
                      isActive("contato") && "bg-accent/60 text-accent-foreground border border-accent/70"
                    )}
                  >
                    <Link to="/contato">Contato</Link>
                  </SidebarMenuButton> */}

                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className={cn(
                      "rounded-md text-sm text-muted-foreground hover:text-foreground",
                      isActive("estudio-aho") && "bg-accent/60 text-accent-foreground border border-accent/70"
                    )}
                  >
                    <Link to="/estudio-aho">Estúdio AHÔ</Link>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>

              {/* -------- Demais entradas de primeiro nível -------- */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("company") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/company">
                    <Building2 size={20} />
                    <span>Empresas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("category") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/category">
                    <Tags size={20} />
                    <span>Categorias</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("location") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/location">
                    <MapPinCheckInside size={20} />
                    <span>Pontos de Referência</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("article") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/article">
                    <Newspaper size={20} />
                    <span>Matérias</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("event") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/event">
                    <CalendarCheck size={20} />
                    <span>Eventos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "gap-4 rounded-lg group-data-[collapsible=icon]:!p-2",
                    isActive("highlight") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/highlight">
                    <Star size={20} />
                    <span>Destaques</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}