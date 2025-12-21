const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Category = sequelize.define(
    "categories",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        category_name: { type: Sequelize.STRING(255), allowNull: false },
        category_code: { type: Sequelize.STRING(255), allowNull: false },
        image: { type: Sequelize.STRING(255), allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = Category;