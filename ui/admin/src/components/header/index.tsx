import { useState } from "react";
import { useNavigate } from "react-router";
import { signOut } from "@/api/authentication";
import { Button } from "@/components/ui/button";
import {
  LogOut
} from "@/components/icons";

export const Header = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();          // limpa storage/token
      navigate("/access", { replace: true }); // ajuste a rota de login se for outra
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <div className="sticky w-full flex justify-between items-center px-6 h-12 shadow-none border-b">
      <div className="flex items-center gap-4">
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="cursor-pointer"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>Logout</span>
      </Button>
    </div>
  );
};
