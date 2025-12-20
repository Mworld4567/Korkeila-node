const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Product = sequelize.define(
    "products",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        style_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        image: { type: Sequelize.STRING(255), allowNull: false },
        is_display: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
    },
    {
        timestamps: false,
    }
);

module.exports = Product;