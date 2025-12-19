const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const CategoryMaster = sequelize.define(
    "category_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        category_name: { type: Sequelize.STRING(255), allowNull: false },
        category_code: { type: Sequelize.STRING(255), allowNull: false },
        parent_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

CategoryMaster.belongsTo(CategoryMaster, { foreignKey: 'parent_id', as: 'parent_category' });
CategoryMaster.hasMany(CategoryMaster, { foreignKey: 'parent_id', as: 'child_categories' });

module.exports = CategoryMaster;