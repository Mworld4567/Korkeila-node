const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DiamondRate = sequelize.define(
    "diamond_rates",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        diamond_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        diamond_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        clarity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = DiamondRate;