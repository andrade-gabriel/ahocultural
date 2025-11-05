import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { pickI18n } from "@/lib/i18n-utils";
import { useLang } from "@/hooks/useLang";
import { getAbout } from "@/api/about";
import type { About } from "@/api/about/types";

/* ----------------------------- i18n helpers ----------------------------- */
type LangCode = Parameters<typeof pickI18n>[1];

export const AboutLayout = () => {
  const { t } = useTranslation("about");
  const lang = useLang() as LangCode;

  const [data, setData] = useState<About | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    setLoading(true);
    setErr(undefined);

    const ac = new AbortController();

    getAbout({ signal: ac.signal })
      .then((res) => setData(res))
      .catch((e) => {
        if (!ac.signal.aborted)
          setErr(
            e instanceof Error
              ? e.message
              : t("aboutLoadError", { defaultValue: "Falha ao carregar informações." })
          );
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [t]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-[800px] px-6 py-10">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-[800px] px-6 py-10">
          <Alert variant="destructive">
            <AlertTitle>{t("error", { defaultValue: "Erro" })}</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const html = data ? pickI18n(data.body, lang) : "";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[800px] px-6 py-10 prose prose-neutral dark:prose-invert">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="text-muted-foreground">
            {t("emptyAbout", { defaultValue: "Nenhuma informação disponível no momento." })}
          </p>
        )}
      </div>
    </div>
  );
};
