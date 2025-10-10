import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const PanelLayout = () => {
    return (
        <SidebarProvider defaultOpen={true}>
            <SidebarInset>
                <div className="flex flex-1 flex-col">
                    <Header />
                    <main className="flex flex-1 flex-col items-center overflow-y-auto py-6 px-6">
                        <div className="w-full max-w-[1400px] flex-1 flex flex-col gap-4">
                            <Outlet />
                        </div>
                    </main>
                    <Footer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};
