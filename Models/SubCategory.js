const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Category = require("./Category");

const SubCategory = sequelize.define(
    "sub_categories",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        sub_category_name: { type: Sequelize.STRING(255), allowNull: false },
        sub_category_code: { type: Sequelize.STRING(255), allowNull: false },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

module.exports = SubCategory;