import i18n from "i18next";
import { initReactI18next, useTranslation as useI18nextTranslation } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt.json";
import { loadSettings, subscribeToSettings } from "./settingsStore.js";

// Maps the display names shown in the Language dropdown to i18next codes.
export const LANGUAGE_OPTIONS = ["English", "Español", "Français", "Deutsch", "Português"];
const LANG_CODE = {
    English: "en",
    Español: "es",
    Français: "fr",
    Deutsch: "de",
    Português: "pt",
};

export function langCodeFor(displayName) {
    return LANG_CODE[displayName] || "en";
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        de: { translation: de },
        pt: { translation: pt },
    },
    lng: langCodeFor(loadSettings().language),
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
        // Our strings use single braces ({n}, {name}) rather than i18next's
        // default {{n}}, so this doesn't require touching any of the ~255
        // translated strings already written.
        prefix: "{",
        suffix: "}",
    },
    returnEmptyString: false,
    // Instead of silently falling back to English when a key is missing for
    // the active language (which is indistinguishable from "not translated
    // yet" and is exactly what made past gaps hard to spot), flag it loudly
    // in development so missing coverage is impossible to miss while testing.
    parseMissingKeyHandler: (key) => {
        if (import.meta.env.DEV) {
            console.warn(`[i18n] Missing translation key: "${key}"`);
            return `⚠️${key}⚠️`;
        }
        return key;
    },
});

// Keep i18next's active language in sync with the app's own settings store
// (Settings.jsx just writes { language: "Français" } etc. like before).
subscribeToSettings((settings) => {
    const code = langCodeFor(settings.language);
    if (i18n.language !== code) {
        i18n.changeLanguage(code);
    }
});

// Same shape as before: { t, lang }. Existing call sites (`const { t } =
// useTranslation()`, `t("key", { n: 3 })`) keep working unchanged.
export function useTranslation() {
    const { t, i18n: instance } = useI18nextTranslation();
    return { t, lang: instance.language };
}