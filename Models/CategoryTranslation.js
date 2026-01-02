const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Category = require("./Category");
const Language = require("./Language");

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
CategoryTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });
Category.hasMany(CategoryTranslation, { foreignKey: 'category_id', as: 'category_translations' });

module.exports = CategoryTranslation;