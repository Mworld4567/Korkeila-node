const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Metal = require("./Metal");

const Karat = sequelize.define(
    "karats",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        metal_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'metals', key: 'id' } },
        karat_value: { type: Sequelize.STRING(255), allowNull: true },
        karat: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
    }
);

Karat.belongsTo(Metal, { foreignKey: 'metal_type_id', as: 'metal' });

module.exports = Karat;