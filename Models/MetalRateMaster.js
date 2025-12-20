const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Karat = require("./Karat");
const Metal = require("./Metal");

const MetalRateMaster = sequelize.define(
    "metal_rate_masters",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        karat_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        metal_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
        date: { type: Sequelize.DATEONLY, allowNull: false },
    },
    {
        timestamps: false,
    }
);

MetalRateMaster.belongsTo(Karat, { foreignKey: 'karat_id', as: 'karat' });
MetalRateMaster.belongsTo(Metal, { foreignKey: 'metal_id', as: 'metal' });

module.exports = MetalRateMaster;