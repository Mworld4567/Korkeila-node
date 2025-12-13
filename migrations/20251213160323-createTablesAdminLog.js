"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_logs", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      admin_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      action_module: {
        type: Sequelize.STRING,
        allowNull: true
      },
      action_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      remark: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      updated_at: {
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("admin_logs");
  },
};
