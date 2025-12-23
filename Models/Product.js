const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Category = require("./Category");
const SubCategory = require("./SubCategory");
const StyleMaster = require("./StyleMaster");
const ProductTranslation = require("./ProductTranslation");
const Product = sequelize.define(
    "products",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        style_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        image: { type: Sequelize.STRING(255), allowNull: true },
        is_display: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
    },
    {
        timestamps: false,
    }
);

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(SubCategory, { foreignKey: 'sub_category_id', as: 'subCategory' });
Product.belongsTo(StyleMaster, { foreignKey: 'style_id', as: 'style' });
Product.hasMany(ProductTranslation, { foreignKey: 'product_id', as: 'product_translations' });

module.exports = Product;