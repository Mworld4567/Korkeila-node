const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const DiamondType = require("./DiamondType");
const Language = require("./Language");

const DiamondTypeTranslation = sequelize.define(
    "diamond_type_translations",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        diamond_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        diamond_type_name: { type: Sequelize.STRING(255), allowNull: false },
    },
    {
        timestamps: false,
    }
);

DiamondTypeTranslation.belongsTo(DiamondType, { foreignKey: 'diamond_type_id', as: 'diamond_type' });
DiamondTypeTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });
DiamondType.hasMany(DiamondTypeTranslation, { foreignKey: 'diamond_type_id', as: 'diamond_type_translations' });

module.exports = DiamondTypeTranslation;