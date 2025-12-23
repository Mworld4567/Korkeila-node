const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Category = require("./Category");

const CategoryTranslation = sequelize.define(
    "category_translations",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        category_name: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

CategoryTranslation.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
module.exports = CategoryTranslation;