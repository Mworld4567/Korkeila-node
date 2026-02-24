const { languageId } = require("../config/globalVariable");

/**
 * Static Finnish translations for cut_name (database stores English only).
 * Key = English cut_name in UPPERCASE for lookup; value = Finnish label.
 */
const CUT_NAME_FI = {
    ROUND: "pyöreän",
    PRINCESS: "prinsessa",
    EMERALD: "smaragdi",
    OVAL: "soikea",
    MARQUISE: "markiisi",
    PEAR: "pisara",
    CUSHION: "tyyny",
    RADIANT: "säteilevä",
};

/**
 * Returns cut name in the requested language.
 * @param {string} englishCutName - Cut name from database (e.g. "Round", "Princess")
 * @param {number|null|undefined} langId - language_id (e.g. 1 = English, 2 = Finnish)
 * @returns {string} - Translated name for Finnish (2), otherwise original English
 */
function getCutNameForLanguage(englishCutName, langId) {
    if (!englishCutName || typeof englishCutName !== "string") return englishCutName || "";
    const id = langId != null ? parseInt(langId, 10) : null;
    if (id === languageId.Finnish) {
        const key = englishCutName.trim().toUpperCase();
        return CUT_NAME_FI[key] != null ? CUT_NAME_FI[key] : englishCutName;
    }
    return englishCutName;
}

module.exports = {
    getCutNameForLanguage,
    CUT_NAME_FI,
};
