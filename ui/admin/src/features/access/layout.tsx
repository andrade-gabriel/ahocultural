import { Outlet } from "react-router";

export const AccessLayout = () => {
  return (
    <main className="flex flex-col gap-4 p-4 w-full min-h-screen bg-neutral-100">
        <Outlet />
    </main>
  );
};
