const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Metal = require("./Metal");
const Language = require("./Language");

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

MetalTranslation.belongsTo(Metal, { foreignKey: 'metal_id', as: 'metal' });
MetalTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });
Metal.hasMany(MetalTranslation, { foreignKey: 'metal_id', as: 'metal_translations' });

module.exports = MetalTranslation;
