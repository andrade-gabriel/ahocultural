import { Link, useLocation } from "react-router";
import {
  Tags,
  Building2,
  MapPinCheckInside,
  TrainFront,
  Newspaper,
  CalendarCheck
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

const items = [
  {
    title: "Empresas",
    url: "company",
    icon: Building2,
  },
  {
    title: "Categorias",
    url: "category",
    icon: Tags,
  },
  {
    title: "Pontos de Referência",
    url: "location",
    icon: MapPinCheckInside,
  },
  {
    title: "Estações de Metrô",
    url: "subway",
    icon: TrainFront,
  },
  {
    title: "Matérias",
    url: "article",
    icon: Newspaper,
  },
  {
    title: "Eventos",
    url: "event",
    icon: CalendarCheck,
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="text-center">
        AHO Cultural
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const href = `/${item.url}`;
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="gap-4 rounded-lg group-data-[collapsible=icon]:!p-2"
                      size={"lg"}
                      asChild
                      data-active={isActive || undefined}
                    >
                      <Link to={`/${item.url}`} className="">
                        <item.icon size={24} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}