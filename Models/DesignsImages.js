const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DesignsImages = sequelize.define(
    "designs_images",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'designs', key: 'id' } },
        image_name: { type: Sequelize.STRING(255), allowNull: true },
        order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        is_product_listing: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
    },
    {
        timestamps: false,
    }
);

module.exports = DesignsImages;