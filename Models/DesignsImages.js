const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const DesignsImages = sequelize.define(
    "designs_images",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'designs', key: 'id' } },
        // image_name: { type: Sequelize.STRING(255), allowNull: false },
        image_1: { type: Sequelize.STRING(255), allowNull: true },
        image_2: { type: Sequelize.STRING(255), allowNull: true },
        image_3: { type: Sequelize.STRING(255), allowNull: true },
        image_4: { type: Sequelize.STRING(255), allowNull: true },
        video_1: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

module.exports = DesignsImages;