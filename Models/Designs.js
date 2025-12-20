const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Designs = sequelize.define(
    "designs",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        metal_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        diamond_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        metal_weight: { type: Sequelize.FLOAT, allowNull: false, },
        mark_up: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        description: { type: Sequelize.TEXT, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = Designs;