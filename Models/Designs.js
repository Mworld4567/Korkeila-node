const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const MetalRateMaster = require("./MetalRateMaster");
const DesignsDiamondDetails = require("./DesignsDiamondDetails");
const Product = require("./Product");
const DesignsImages = require("./DesignsImages");
const DesignTranslation = require("./DesignTranslation");
const Designs = sequelize.define(
    "designs",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
        category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        sub_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        metal_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        metal_weight: { type: Sequelize.FLOAT, allowNull: false, },
        mark_up: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        is_filter_available: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
        price_flag: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 },
        sku_number: { type: Sequelize.STRING(255), allowNull: true },
        // price: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
        // pricing_message: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

Designs.belongsTo(MetalRateMaster, { foreignKey: 'metal_rate_id', as: 'metal_rate' });
Designs.hasMany(DesignsDiamondDetails, { foreignKey: 'design_id', as: 'diamond_details' });
Designs.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Designs.hasMany(DesignsImages, { foreignKey: 'design_id', as: 'images' });
Designs.hasMany(DesignTranslation, { foreignKey: 'design_id', as: 'design_translations' });
module.exports = Designs;