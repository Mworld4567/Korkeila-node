const logError = require("../../logger/log");
const CurrencyRate = require("../../Models/CurrencyRate");

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
                });
                return res.status(200).json({
                    success: true,
                    message: "Currency rate created successfully",
                    data: {
                        id: created.id,
                        currency_code: created.currency_code,
                        rate: Number(created.rate),
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
                if (rate !== null && (Number.isNaN(rate) || rate <= 0)) {
                    return res.status(400).json({
                        success: false,
                        message: "rate must be a positive number (units per 1 EUR)",
                    });
                }
                if (rate !== null) {
                    row.rate = rate;
                    await row.save();
                }
                return res.status(200).json({
                    success: true,
                    message: "Currency rate updated successfully",
                    data: {
                        id: row.id,
                        currency_code: row.currency_code,
                        rate: Number(row.rate),
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
    };
};

module.exports = currencyRateController;
