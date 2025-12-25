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

// Define hasMany relationship after CategoryTranslation is loaded to avoid circular dependency
// This will be set up in CategoryTranslation.js after both models are defined

module.exports = Category;