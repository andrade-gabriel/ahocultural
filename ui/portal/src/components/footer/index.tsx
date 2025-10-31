import { Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation("default")
  return (
    <footer className="w-full border-t border-border/50 bg-background py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-4 px-6 text-center">
        {/* --- Social --- */}
        <a
          href="https://www.instagram.com/ahocultural"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-white hover:bg-black transition-colors duration-200 px-4 py-2 rounded-none"
        >
          <Instagram className="h-4 w-4" />
          <span>@ahocultural</span>
        </a>

        {/* --- Copyright --- */}
        <p className="text-xs text-muted-foreground tracking-wide uppercase">
          © {new Date().getFullYear()} Ahô Cultural. {t("defaultFooterText")}
        </p>
      </div>
    </footer>
  );
};
