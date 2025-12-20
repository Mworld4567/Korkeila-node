const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DesignsDiamondDetails = sequelize.define(
    "designs_diamond_details",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        diamond_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        pcs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
        timestamps: false,
    }
);

module.exports = DesignsDiamondDetails;