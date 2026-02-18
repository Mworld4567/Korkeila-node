const CurrencyRate = require("../Models/CurrencyRate");

const BASE_CURRENCY = "EUR";

/**
 * Get rate for a currency. EUR = 1 (base). Others: rate = units per 1 EUR (e.g. 2.3 means 1 EUR = 2.3 SGD).
 * Display: eur_amount * rate = amount in that currency.
 * @param {string} toCurrency - e.g. 'SGD', 'USD'
 * @returns {Promise<number|null>} rate or null if not found (1 for EUR)
 */
async function getCurrencyRate(toCurrency) {
    if (!toCurrency || String(toCurrency).toUpperCase() === BASE_CURRENCY) {
        return 1;
    }
    const row = await CurrencyRate.findOne({
        where: { currency_code: String(toCurrency).toUpperCase() },
    });
    if (!row || row.rate == null) return null;
    return Number(row.rate);
}

/**
 * Convert EUR amount to target currency and format for display (sync when rate already fetched).
 * @param {number} eurAmount - amount in EUR
 * @param {string} toCurrency - e.g. 'SGD'
 * @param {number} rate - conversion rate (use 1 for EUR)
 * @returns {string} formatted price string
 */
function formatPriceInCurrency(eurAmount, toCurrency, rate = 1) {
    if (eurAmount == null || Number.isNaN(Number(eurAmount))) return "";
    const amount = Math.round(Number(eurAmount) * rate);
    if (toCurrency === "SGD") {
        return `S$ ${amount.toLocaleString("en-SG")}`;
    }
    if (toCurrency === "EUR" || rate === 1) {
        return `€ ${amount.toLocaleString("en-EU")}`;
    }
    return `${toCurrency} ${amount.toLocaleString("en-EU")}`;
}

/**
 * Convert EUR amount to target currency and format for display.
 * @param {number} eurAmount - amount in EUR
 * @param {string} toCurrency - e.g. 'SGD'
 * @param {number|null} rate - optional pre-fetched rate
 * @returns {Promise<{ amount: number, formatted: string, symbol: string }|null>} converted or null if rate missing
 */
async function convertAndFormat(eurAmount, toCurrency, rate = null) {
    if (eurAmount == null || Number.isNaN(Number(eurAmount))) return null;
    const r = rate !== null && rate !== undefined ? rate : await getCurrencyRate(toCurrency);
    if (r == null || r <= 0) return null;
    const amount = Math.round(Number(eurAmount) * r);
    const formatted = formatPriceInCurrency(eurAmount, toCurrency, r);
    const symbol = toCurrency === "SGD" ? "S$" : toCurrency === "EUR" ? "€" : toCurrency + " ";
    return { amount, formatted, symbol };
}

module.exports = { getCurrencyRate, convertAndFormat, formatPriceInCurrency, BASE_CURRENCY };
