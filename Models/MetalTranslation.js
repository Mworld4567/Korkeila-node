const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const MetalTranslation = sequelize.define(
    "metal_translations",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        metal_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        metal_name: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

module.exports = MetalTranslation;
