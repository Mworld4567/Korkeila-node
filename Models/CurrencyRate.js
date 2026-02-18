const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const CurrencyRate = sequelize.define(
    "currency_rates",
    {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        currency_code: {
            type: Sequelize.STRING(10),
            allowNull: false,
        },
        rate: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: true },
        updated_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = CurrencyRate;
