const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Category = require("./Category");
const SubCategory = require("./SubCategory");

const StyleMaster = sequelize.define(
    "style_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        style_name: { type: Sequelize.STRING(255), allowNull: false },
        style_code: { type: Sequelize.STRING(255), allowNull: false },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    },
    {
        timestamps: false,
    }
);

StyleMaster.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
StyleMaster.belongsTo(SubCategory, { foreignKey: 'sub_category_id', as: 'sub_category' });

module.exports = StyleMaster;