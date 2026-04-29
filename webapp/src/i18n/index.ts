import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

const LANGUAGE_STORAGE_KEY = "appLanguage";

function getInitialLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

export default i18n;
