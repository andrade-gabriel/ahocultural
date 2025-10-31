import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { namespaces, resources } from "./resources";

void i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    ns: [...namespaces],
    resources,
    fallbackLng: ["pt", "en", "es"],
    supportedLngs: ["pt", "en", "es"],
    returnObjects: true,
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });

export default i18n;
