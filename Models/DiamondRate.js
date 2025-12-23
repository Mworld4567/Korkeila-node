const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const DiamondType = require("./DiamondType");
const DiamondClarity = require("./DiamondClarity");
const DiamondMaster = require("./DiamondMaster");
const DiamondRate = sequelize.define(
    "diamond_rates",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        diamond_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        diamond_type_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        clarity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
        timestamps: false,
    }
);

DiamondRate.belongsTo(DiamondType, { foreignKey: 'diamond_type_id', as: 'diamond_type' });
DiamondRate.belongsTo(DiamondClarity, { foreignKey: 'clarity_id', as: 'clarity' });
DiamondRate.belongsTo(DiamondMaster, { foreignKey: 'diamond_master_id', as: 'diamond_master' });

module.exports = DiamondRate;