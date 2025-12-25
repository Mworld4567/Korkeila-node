const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Language = require("./Language");

const DesignTranslation = sequelize.define(
    "design_translations",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        note: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

DesignTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });

module.exports = DesignTranslation;

