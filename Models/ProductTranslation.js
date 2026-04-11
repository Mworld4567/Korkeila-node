const Sequelize = require("sequelize");
const sequelize = require("../config/dbconfig");
const Language = require("./Language");
// const Product = require("./Product");
// const Language = require("./Language");
const ProductTranslation = sequelize.define(
    "product_translations",
    {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, allowNull: false, primaryKey: true },
        product_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        language_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        product_name: { type: Sequelize.STRING(255), allowNull: false },
        // seo_slug: { type: Sequelize.STRING(255), allowNull: true },
    },
    {
        timestamps: false,
   

//       hooks: {
//       beforeCreate: (product) => {
//         if (product.product_name) {
//           product.seo_slug = slugify(product.product_name, {
//             lower: true,
//             strict: true
//           });
//         }
//       },
//       beforeCreate: (product) => {
//   if (!product.seo_slug && product.product_name) {
//     product.seo_slug = slugify(product.product_name, {
//       lower: true,
//       strict: true
//     });
//   }
// }
//     }
  }
);

// ProductTranslation.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });

module.exports = ProductTranslation;

