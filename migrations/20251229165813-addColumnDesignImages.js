'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
    await queryInterface.removeColumn('designs_images', 'image_name');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('designs_images', 'image_1');
    await queryInterface.removeColumn('designs_images', 'image_2');
    await queryInterface.removeColumn('designs_images', 'image_3');
    await queryInterface.removeColumn('designs_images', 'image_4');
    await queryInterface.removeColumn('designs_images', 'video_1');
    await queryInterface.addColumn('designs_images', 'image_name');
  }
};
