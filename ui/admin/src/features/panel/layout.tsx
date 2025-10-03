import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar/index";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/header/index";

export const PanelLayout = () => {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                <div className="flex flex-1 flex-col">
                    <Header />
                    <div className="flex flex-1 flex-col gap-4 py-4 px-6 bg-white shadow rounded-2xl w-full h-full overflow-y-auto">
                        <Outlet />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};
