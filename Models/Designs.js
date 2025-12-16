const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");

const Designs = sequelize.define(
    "designs",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        design_variant_name: { type: Sequelize.STRING(255), allowNull: false },
        category_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'category_masters', key: 'id' } },
        style_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'style_masters', key: 'id' } },
        cut_master_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'cut_masters', key: 'id' } },
        karat_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'karats', key: 'id' } },
        mark_up: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
        // is_active: { type: Sequelize.TINYINT(4), allowNull: false, defaultValue: 1 },
    },
    {
        timestamps: false,
    }
);

module.exports = Designs;