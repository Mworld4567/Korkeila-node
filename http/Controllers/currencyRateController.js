const logError = require("../../logger/log");
const CurrencyRate = require("../../Models/CurrencyRate");

function parseShowOnWebsite(value, fallback = null) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value ? 1 : 0;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") return 1;
    if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") return 0;
    const num = Number(normalized);
    if (!Number.isNaN(num)) return num ? 1 : 0;
    return fallback;
}

const currencyRateController = () => {
    return {
        read: async (req, res) => {
            try {
                const rows = await CurrencyRate.findAll({
                    order: [["currency_code", "ASC"]],
                });
                const data = rows.map((x) => ({
                    id: x.id,
                    currency_code: x.currency_code,
                    rate: x.rate != null ? Number(x.rate) : null,
                    show_on_website: x.show_on_website != null ? Number(x.show_on_website) === 1 : true,
                    created_at: x.created_at,
                    updated_at: x.updated_at,
                }));
                return res.status(200).json({
                    success: true,
                    message: "Currency rates fetched successfully",
                    data,
                });
            } catch (error) {
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        readOne: async (req, res) => {
            try {
                const row = await CurrencyRate.findByPk(req.params.id);
                if (!row) {
                    return res.status(404).json({
                        success: false,
                        message: "Currency rate not found",
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: {
                        id: row.id,
                        currency_code: row.currency_code,
                        rate: row.rate != null ? Number(row.rate) : null,
                        show_on_website: row.show_on_website != null ? Number(row.show_on_website) === 1 : true,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                    },
                });
            } catch (error) {
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        create: async (req, res) => {
            try {
                const currencyCode = (req.body.currency_code || "").toString().toUpperCase();
                const rate = parseFloat(req.body.rate);
                const showOnWebsite = parseShowOnWebsite(req.body.show_on_website, 1);
                if (!currencyCode) {
                    return res.status(400).json({
                        success: false,
                        message: "currency_code is required",
                    });
                }
                if (currencyCode === "EUR") {
                    return res.status(400).json({
                        success: false,
                        message: "EUR is base (rate 1). Do not add a row for EUR.",
                    });
                }
                if (Number.isNaN(rate) || rate <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Valid rate (positive number) is required. Rate = units of this currency per 1 EUR.",
                    });
                }
                const existing = await CurrencyRate.findOne({
                    where: { currency_code: currencyCode },
                });
                if (existing) {
                    return res.status(409).json({
                        success: false,
                        message: "This currency already has a rate. Use update instead.",
                    });
                }
                const created = await CurrencyRate.create({
                    currency_code: currencyCode,
                    rate,
                    show_on_website: showOnWebsite,
                });
                return res.status(200).json({
                    success: true,
                    message: "Currency rate created successfully",
                    data: {
                        id: created.id,
                        currency_code: created.currency_code,
                        rate: Number(created.rate),
                        show_on_website: created.show_on_website != null ? Number(created.show_on_website) === 1 : true,
                        created_at: created.created_at,
                        updated_at: created.updated_at,
                    },
                });
            } catch (error) {
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        update: async (req, res) => {
            try {
                const row = await CurrencyRate.findByPk(req.params.id);
                if (!row) {
                    return res.status(404).json({
                        success: false,
                        message: "Currency rate not found",
                    });
                }
                const rate = req.body.rate != null ? parseFloat(req.body.rate) : null;
                const showOnWebsite = parseShowOnWebsite(req.body.show_on_website, null);
                if (rate !== null && (Number.isNaN(rate) || rate <= 0)) {
                    return res.status(400).json({
                        success: false,
                        message: "rate must be a positive number (units per 1 EUR)",
                    });
                }
                if (rate !== null) {
                    row.rate = rate;
                }
                if (showOnWebsite !== null) {
                    row.show_on_website = showOnWebsite;
                }
                if (rate !== null || showOnWebsite !== null) {
                    await row.save();
                }
                return res.status(200).json({
                    success: true,
                    message: "Currency rate updated successfully",
                    data: {
                        id: row.id,
                        currency_code: row.currency_code,
                        rate: Number(row.rate),
                        show_on_website: row.show_on_website != null ? Number(row.show_on_website) === 1 : true,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                    },
                });
            } catch (error) {
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        publicVisible: async (req, res) => {
            try {
                const rows = await CurrencyRate.findAll({
                    where: { show_on_website: 1 },
                    order: [["currency_code", "ASC"]],
                    attributes: ["currency_code", "rate"],
                });
                const data = rows.map((x) => ({
                    currency_code: x.currency_code,
                    rate: x.rate != null ? Number(x.rate) : null,
                }));
                return res.status(200).json({
                    success: true,
                    message: "Visible currencies fetched successfully",
                    data,
                });
            } catch (error) {
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
    };
};

module.exports = currencyRateController;
