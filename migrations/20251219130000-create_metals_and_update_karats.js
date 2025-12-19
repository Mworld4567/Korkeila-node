'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create metals table
    await queryInterface.createTable('metals', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      metal_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Insert Gold and Platinum
    await queryInterface.bulkInsert('metals', [
      {
        metal_name: 'Gold',
        deleted_at: null
      },
      {
        metal_name: 'Platinum',
        deleted_at: null
      },
    ]);

    // Get the metal IDs for mapping
    const [goldMetal] = await queryInterface.sequelize.query(
      "SELECT id FROM metals WHERE metal_name = 'Gold' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const [platinumMetal] = await queryInterface.sequelize.query(
      "SELECT id FROM metals WHERE metal_name = 'Platinum' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Add metal_type_id column to karats table
    await queryInterface.addColumn('karats', 'metal_type_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'metals',
        key: 'id'
      }
    });

    // Migrate existing data: Update metal_type_id based on metal_type ENUM value
    if (goldMetal && goldMetal.id) {
      await queryInterface.sequelize.query(
        `UPDATE karats SET metal_type_id = ${goldMetal.id} WHERE metal_type IN ('Gold', 'gold')`,
        { type: Sequelize.QueryTypes.UPDATE }
      );
    }

    if (platinumMetal && platinumMetal.id) {
      await queryInterface.sequelize.query(
        `UPDATE karats SET metal_type_id = ${platinumMetal.id} WHERE metal_type IN ('Platinum', 'platinum')`,
        { type: Sequelize.QueryTypes.UPDATE }
      );
    }

    // Make metal_type_id NOT NULL after data migration
    await queryInterface.changeColumn('karats', 'metal_type_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'metals',
        key: 'id'
      }
    });

    // Remove the old metal_type ENUM column
    await queryInterface.removeColumn('karats', 'metal_type');
  },

  async down(queryInterface, Sequelize) {
    // Add back metal_type column
    await queryInterface.addColumn('karats', 'metal_type', {
      type: Sequelize.ENUM('Gold', 'silver', 'Platinum'),
      allowNull: true,
    });

    // Migrate data back from metal_type_id to metal_type
    const [goldMetal] = await queryInterface.sequelize.query(
      "SELECT id FROM metals WHERE metal_name = 'Gold' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const [platinumMetal] = await queryInterface.sequelize.query(
      "SELECT id FROM metals WHERE metal_name = 'Platinum' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (goldMetal && goldMetal.id) {
      await queryInterface.sequelize.query(
        `UPDATE karats SET metal_type = 'Gold' WHERE metal_type_id = ${goldMetal.id}`,
        { type: Sequelize.QueryTypes.UPDATE }
      );
    }

    if (platinumMetal && platinumMetal.id) {
      await queryInterface.sequelize.query(
        `UPDATE karats SET metal_type = 'Platinum' WHERE metal_type_id = ${platinumMetal.id}`,
        { type: Sequelize.QueryTypes.UPDATE }
      );
    }

    // Make metal_type NOT NULL
    await queryInterface.changeColumn('karats', 'metal_type', {
      type: Sequelize.ENUM('Gold', 'silver', 'Platinum'),
      allowNull: false,
    });

    // Remove metal_type_id column
    await queryInterface.removeColumn('karats', 'metal_type_id');

    // Drop metals table
    await queryInterface.dropTable('metals');
  },
};
