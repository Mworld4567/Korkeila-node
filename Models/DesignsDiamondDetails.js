const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const DiamondRate = require("./DiamondRate");
const CutMaster = require("./CutMaster");
const DesignsDiamondDetails = sequelize.define(
    "designs_diamond_details",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        diamond_rate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, },
        pcs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        is_center: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 0 },
        position_visible: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
    },
    {
        timestamps: false,
    }
);

DesignsDiamondDetails.belongsTo(DiamondRate, { foreignKey: 'diamond_rate_id', as: 'diamond_rate' });
DesignsDiamondDetails.belongsTo(CutMaster, { foreignKey: 'cut_master_id', as: 'cut_master' });
module.exports = DesignsDiamondDetails;