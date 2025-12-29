'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove old columns
    await queryInterface.removeColumn('designs_images', 'image_1');
    await queryInterface.removeColumn('designs_images', 'image_2');
    await queryInterface.removeColumn('designs_images', 'image_3');
    await queryInterface.removeColumn('designs_images', 'image_4');
    await queryInterface.removeColumn('designs_images', 'video_1');
    
    // Add new columns
    await queryInterface.addColumn('designs_images', 'image_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('designs_images', 'order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('designs_images', 'is_product_listing', {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove new columns
    await queryInterface.removeColumn('designs_images', 'image_name');
    await queryInterface.removeColumn('designs_images', 'order');
    await queryInterface.removeColumn('designs_images', 'is_product_listing');
    
    // Restore old columns
    await queryInterface.addColumn('designs_images', 'image_1', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('designs_images', 'image_2', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('designs_images', 'image_3', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('designs_images', 'image_4', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('designs_images', 'video_1', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }
};

