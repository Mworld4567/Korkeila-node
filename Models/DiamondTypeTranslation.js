const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

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

module.exports = DiamondTypeTranslation;