const logError = require("../../logger/log");
const Product = require("../../Models/Product");
const Category = require("../../Models/Category");
const SubCategory = require("../../Models/SubCategory");
const StyleMaster = require("../../Models/StyleMaster");
const ProductTranslation = require("../../Models/ProductTranslation");
const Designs = require("../../Models/Designs");
const DesignsDiamondDetails = require("../../Models/DesignsDiamondDetails");
const DesignsImages = require("../../Models/DesignsImages");
const MetalRateMaster = require("../../Models/MetalRateMaster");
const DiamondRate = require("../../Models/DiamondRate");
const DiamondMaster = require("../../Models/DiamondMaster");
const Metal = require("../../Models/Metal");
const Karat = require("../../Models/Karat");
const CutMaster = require("../../Models/CutMaster");
const DesignTranslation = require("../../Models/DesignTranslation");
const CategoryTranslation = require("../../Models/CategoryTranslation");
const sequelize = require("../../config/dbconfig");
const { Op } = require("sequelize");
const { deleteFromBucket } = require("../middlewares/awsS3Middleware");
const { extractFilename, constructImageUrl } = require("../../helpers/imageHelper");
const Language = require("../../Models/Language");
const { priceFlag, languageId, priceMessages } = require("../../config/globalVariable");

const productController = () => {
    return {
        create: async (req, res) => {
            const transaction = await sequelize.transaction();
            try {

                // Validate required fields
                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category ID",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category ID",
                    });
                }

                if (!req.body.style_id || req.body.style_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter style ID",
                    });
                }

                // Validate product_name_array exists
                if (!req.body.product_name_array || !Array.isArray(req.body.product_name_array) || req.body.product_name_array.length === 0) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Please provide product_name_array",
                    });
                }

                // Check if any product_name already exists for the same language_id
                for (const language of req.body.product_name_array) {
                    if (!language.language_id || !language.product_name) {
                        await transaction.rollback();
                        return res.status(409).json({
                            success: false,
                            message: "Please provide language_id and product_name for all entries",
                        });
                    }

                    const existingTranslation = await ProductTranslation.findOne({
                        where: {
                            language_id: parseInt(language.language_id),
                            product_name: language.product_name.trim(),
                        },
                        transaction
                    });

                    if (existingTranslation) {
                        await transaction.rollback();
                        return res.status(409).json({
                            success: false,
                            message: `Product name "${language.product_name}" already exists`,
                        });
                    }
                }

                // Check if product with same category_id, sub_category_id, and style_id already exists
                const existingProduct = await Product.findOne({
                    where: {
                        category_id: parseInt(req.body.category_id),
                        sub_category_id: parseInt(req.body.sub_category_id),
                        style_id: parseInt(req.body.style_id),
                    },
                    transaction
                });

                // if (existingProduct) {
                //     await transaction.rollback();
                //     return res.status(409).json({
                //         success: false,
                //         message: "Product with this category, sub-category, and style combination already exists",
                //     });
                // }

                // Handle image - store only filename (last part) in database
                let product_image = null;
                if (req.file && req.file.key) {
                    // Image uploaded as file - extract only the filename (last part)
                    product_image = extractFilename(req.file.key);
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text (filename or URL) - extract only filename
                    product_image = extractFilename(req.body.image.trim());
                }

                // Get is_display value, default to 1 if not provided
                const is_display = req.body.is_display !== undefined ? parseInt(req.body.is_display) : 1;

                // Generate product_name from first letters of category_name, sub_category_name, and style_name
                // const categoryFirstLetter = req.body.category_name && req.body.category_name.trim().length > 0 
                //     ? req.body.category_name.trim().charAt(0).toUpperCase() 
                //     : '';
                // const subCategoryFirstLetter = req.body.sub_category_name && req.body.sub_category_name.trim().length > 0 
                //     ? req.body.sub_category_name.trim().charAt(0).toUpperCase() 
                //     : '';
                // const styleFirstLetter = req.body.style_name && req.body.style_name.trim().length > 0 
                //     ? req.body.style_name.trim().charAt(0).toUpperCase() 
                //     : '';
                // const product_name = categoryFirstLetter + subCategoryFirstLetter + styleFirstLetter;

                const data = {
                    category_id: parseInt(req.body.category_id),
                    category_name: req.body.category_name,
                    sub_category_id: parseInt(req.body.sub_category_id),
                    sub_category_name: req.body.sub_category_name,
                    style_id: parseInt(req.body.style_id),
                    style_name: req.body.style_name,
                    image: product_image, // Store only filename/key
                    is_display: is_display,
                };

                // Create product
                const product = await Product.create(data, { transaction });
                data.id = product.id;

                const product_name_array = [];
                for (const language of req.body.product_name_array) {
                    product_name_array.push({
                        product_id: product.id,
                        language_id: language.language_id,
                        product_name: language.product_name,
                    });
                }
               const product_translations = await ProductTranslation.bulkCreate(product_name_array, { transaction });
               data.product_translations = product_translations;
                // Construct full URL for response
                data.image = constructImageUrl(data.image, 'product');

                await transaction.commit();

                return res.status(200).json({
                    success: true,
                    message: "Product created successfully",
                    data: data,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                await transaction.rollback();
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        read: async (req, res) => {
            try {
                
                const mydata = await Product.findAll({
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        },
                        {
                            model: ProductTranslation,
                            as: 'product_translations',
                            attributes: ['id', 'product_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name']
                                }
                            ]
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                // Construct full URLs for images dynamically
                const dataWithUrls = mydata.map(item => {
                    const itemData = item.toJSON();
                    itemData.image = constructImageUrl(itemData.image, 'product');
                    // Also construct URL for category image if included
                    if (itemData.category && itemData.category.image) {
                        itemData.category.image = constructImageUrl(itemData.category.image, 'categoryMaster');
                    }
                    // Extract product_name from English translation
                    if (itemData.product_translations && Array.isArray(itemData.product_translations)) {
                        const englishTranslation = itemData.product_translations.find(
                            translation => translation.language && translation.language.id === languageId.English
                        );
                        if (englishTranslation) {
                            itemData.product_name = englishTranslation.product_name;
                        }
                    }
                    delete itemData.product_translations;
                    return itemData;
                });

                return res.status(200).json({
                    success: true,
                    message: "Products fetched successfully",
                    data: dataWithUrls,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        readOne: async (req, res) => {
            try {
                const mydata = await Product.findByPk(req.params.id, {
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        },
                        {
                            model: ProductTranslation,
                            as: 'product_translations',
                            attributes: ['id', 'product_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name']
                                }
                            ]
                        }
                    ]
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Construct full URL for image dynamically
                const responseData = mydata.toJSON();
                responseData.image = constructImageUrl(responseData.image, 'product');
                // Also construct URL for category image if included
                if (responseData.category && responseData.category.image) {
                    responseData.category.image = constructImageUrl(responseData.category.image, 'categoryMaster');
                }

                return res.status(200).json({
                    success: true,
                    message: "Product fetched successfully",
                    data: responseData,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        update: async (req, res) => {
            const transaction = await sequelize.transaction();
            try {
                const productData = await Product.findByPk(req.params.id, { transaction });
                if (!productData) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Validate required fields
                if (!req.body.category_id || req.body.category_id === "") {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category ID",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category ID",
                    });
                }

                if (!req.body.style_id || req.body.style_id === "") {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Please enter style ID",
                    });
                }

                // Update product translations if product_name_array is provided
                if (req.body.product_name_array && Array.isArray(req.body.product_name_array) && req.body.product_name_array.length > 0) {
                    // Check if any product_name already exists for the same language_id (excluding current product)
                    for (const language of req.body.product_name_array) {
                        if (!language.language_id || !language.product_name) {
                            await transaction.rollback();
                            return res.status(409).json({
                                success: false,
                                message: "Please provide language_id and product_name for all entries",
                            });
                        }

                        const existingTranslation = await ProductTranslation.findOne({
                            where: {
                                language_id: parseInt(language.language_id),
                                product_name: language.product_name.trim(),
                                product_id: { [Op.ne]: parseInt(req.params.id) }, // Exclude current product
                            },
                            transaction
                        });

                        if (existingTranslation) {
                            await transaction.rollback();
                            return res.status(409).json({
                                success: false,
                                message: `Product name "${language.product_name}" already exists`,
                            });
                        }
                    }
                }

                // Handle image - always extract only filename (last part), even from existing data
                let product_image = null;

                // Handle new image upload
                if (req.file && req.file.key) {
                    // Delete old image from S3 if exists
                    if (productData.image) {
                        try {
                            // Extract filename from old value (might be URL, path, or just filename)
                            const oldFilename = extractFilename(productData.image);
                            // Construct full S3 key for deletion - need to determine the route name
                            // For products, the route is typically "product" or similar
                            const fullOldKey = `public/product/image/${oldFilename}`;
                            await deleteFromBucket(fullOldKey);
                        } catch (deleteError) {
                            console.log("Error deleting old image:", deleteError);
                            // Continue even if deletion fails
                        }
                    }

                    // Store only filename (last part)
                    product_image = extractFilename(req.file.key);
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text - extract only filename
                    product_image = extractFilename(req.body.image.trim());
                } else if (productData.image) {
                    // No new image provided, but existing image exists - extract only filename from it (might be URL or path)
                    product_image = extractFilename(productData.image);
                }

                // Get is_display value
                const is_display = req.body.is_display !== undefined ? parseInt(req.body.is_display) : productData.is_display;

                // Fetch category, subcategory, and style to get names for product_name generation
                const category = await Category.findByPk(parseInt(req.body.category_id), { transaction });
                const subCategory = await SubCategory.findByPk(parseInt(req.body.sub_category_id), { transaction });
                const style = await StyleMaster.findByPk(parseInt(req.body.style_id), { transaction });

                // Generate product_name from first letters of category_name, sub_category_name, and style_name
                const categoryFirstLetter = category && category.category_name && category.category_name.trim().length > 0 
                    ? category.category_name.trim().charAt(0).toUpperCase() 
                    : '';
                const subCategoryFirstLetter = subCategory && subCategory.sub_category_name && subCategory.sub_category_name.trim().length > 0 
                    ? subCategory.sub_category_name.trim().charAt(0).toUpperCase() 
                    : '';
                const styleFirstLetter = style && style.style_name && style.style_name.trim().length > 0 
                    ? style.style_name.trim().charAt(0).toUpperCase() 
                    : '';
                const product_name = categoryFirstLetter + subCategoryFirstLetter + styleFirstLetter;

                const data = {
                    category_id: parseInt(req.body.category_id),
                    sub_category_id: parseInt(req.body.sub_category_id),
                    style_id: parseInt(req.body.style_id),
                    image: product_image, // Store only filename/key
                    product_name: product_name,
                    is_display: is_display,
                };

                await Product.update(data, {
                    where: { id: req.params.id },
                    transaction
                });

                // Update product translations if product_name_array is provided
                if (req.body.product_name_array && Array.isArray(req.body.product_name_array) && req.body.product_name_array.length > 0) {
                    // Delete existing translations
                    await ProductTranslation.destroy({
                        where: { product_id: req.params.id },
                        transaction
                    });

                    // Create new translations
                    const product_name_array = [];
                    for (const language of req.body.product_name_array) {
                        product_name_array.push({
                            product_id: parseInt(req.params.id),
                            language_id: language.language_id,
                            product_name: language.product_name,
                        });
                    }
                    await ProductTranslation.bulkCreate(product_name_array, { transaction });
                }

                const updatedData = await Product.findByPk(req.params.id, {
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        },
                        {
                            model: ProductTranslation,
                            as: 'product_translations',
                            attributes: ['id', 'product_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name']
                                }
                            ]
                        }
                    ],
                    transaction
                });

                await transaction.commit();

                // Construct full URL for response
                const responseData = updatedData.toJSON();
                responseData.image = constructImageUrl(responseData.image, 'product');
                // Also construct URL for category image if included
                if (responseData.category && responseData.category.image) {
                    responseData.category.image = constructImageUrl(responseData.category.image, 'categoryMaster');
                }

                return res.status(200).json({
                    success: true,
                    message: "Product updated successfully",
                    data: responseData,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                await transaction.rollback();
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        delete: async (req, res) => {
            try {
                const productData = await Product.findByPk(req.params.id);
                if (!productData) {
                    return res.status(409).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Delete image from S3 if exists
                if (productData.image) {
                    try {
                        // Extract filename from stored value (might be URL, path, or just filename)
                        const filename = extractFilename(productData.image);
                        // Construct full S3 key for deletion: public/product/image/{filename}
                        const fullOldKey = `public/product/image/${filename}`;
                        await deleteFromBucket(fullOldKey);
                    } catch (deleteError) {
                        console.log("Error deleting image from S3:", deleteError);
                        // Continue even if deletion fails
                    }
                }

                await Product.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Product deleted successfully",
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        productDropdown: async (req, res) => {
            try {
                const ProductData = await Product.findAll({
                    // attributes: ['id', 'image'],
                    where: {
                        is_display: 1
                    },
                    include: [
                        {
                            model: ProductTranslation,
                            as: 'product_translations',
                            attributes: ['id', 'product_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name']
                                }
                            ]
                        },
                    ]
                });

                return res.status(200).json({
                    success: true,
                    message: "Product dropdown fetched successfully",
                    data: ProductData,
                });
                
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        productListEcomOldVersion: async (req, res) => {
            try {
                // Build where clause conditionally
                const productWhere = {
                    is_display: 1,
                    category_id: req.query.category_id
                };

                // Only add sub_category_id filter if it's provided
                if (req.query.sub_category_id !== undefined && req.query.sub_category_id !== null && req.query.sub_category_id !== '') {
                    productWhere.sub_category_id = req.query.sub_category_id;
                }

                // Only add style_id filter if it's provided
                if (req.query.style_id !== undefined && req.query.style_id !== null && req.query.style_id !== '') {
                    productWhere.style_id = req.query.style_id;
                }

                // Fetch products first
                const products = await Product.findAll({
                    where: productWhere,
                    attributes: ['id', 'image', "category_id", "sub_category_id", "style_id"]
                });

                // Get all product IDs
                const productIds = products.map(p => p.id);

                if (productIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }

                // Fetch translations for these products
                const translations = await ProductTranslation.findAll({
                    attributes: ['id', 'product_id', 'product_name'],
                    where: {
                        product_id: { [Op.in]: productIds },
                        language_id: req.query.language_id
                    }
                });

                // Create a map of product_id to translation
                const translationMap = new Map();
                translations.forEach(t => {
                    translationMap.set(t.product_id, t);
                });

                // Combine products with translations
                const productData = products.map(product => {
                    const translation = translationMap.get(product.id);
                    return {
                        product: product.toJSON ? product.toJSON() : product,
                        product_name: translation ? translation.product_name : null,
                        translation: translation ? translation.toJSON ? translation.toJSON() : translation : null
                    };
                }).filter(item => item.product_name !== null); // Filter out products without translation

                // Get filtered product IDs (only those with translations)
                const filteredProductIds = productData.map(item => item.product.id);

                if (filteredProductIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }

                // Fetch all designs for these products with full details
                const allDesigns = await Designs.findAll({
                    where: {
                        product_id: { [Op.in]: filteredProductIds },
                        price_flag: { [Op.ne]: 0 }
                    },
                    include: [
                        {
                            model: MetalRateMaster,
                            as: 'metal_rate',
                            attributes: ['id', 'metal_id', 'karat_id', 'rate'],
                            include: [
                                { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
                                { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
                            ]
                        },
                        {
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            // attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'pcs'],
                            include: [
                                { model: CutMaster, as: 'cut_master', attributes: ['id', 'cut_name', 'cut_code'] },
                                {
                                    model: DiamondRate,
                                    as: 'diamond_rate',
                                    attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
                                    include: [
                                        { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
                                    ]
                                }
                            ]
                        },
                        {
                            model: DesignsImages,
                            as: 'images',
                            attributes: ['id', 'image_name', 'order', 'is_product_listing'],
                            separate: true,
                            order: [['order', 'ASC']]
                        },
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                { 
                                    model: Category, 
                                    as: 'category', 
                                    attributes: ['id', 'category_code', 'image'],
                                    include: [
                                        {
                                            model: CategoryTranslation,
                                            as: 'category_translations',
                                            attributes: ['id', 'category_name', 'language_id'],
                                            where: req.query.language_id ? { language_id: req.query.language_id } : undefined,
                                            required: false
                                        }
                                    ]
                                },
                                { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id'] },
                                { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
                            ]
                        },
                        {
                            model: DesignTranslation,
                            as: 'design_translations',
                            attributes: ['id', 'language_id', 'design_variant_name', 'description', 'note'],
                            where: req.query.language_id ? { language_id: req.query.language_id } : undefined,
                            required: false,
                            include: [
                                { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                            ]
                        }
                    ]
                });

                // Calculate price for each design and group by product_id
                const designsByProduct = new Map();
                
                allDesigns.forEach(design => {
                    if (!designsByProduct.has(design.product_id)) {
                        designsByProduct.set(design.product_id, []);
                    }
                    designsByProduct.get(design.product_id).push(design);
                });

                // Process category translations to flatten category_name
                allDesigns.forEach(design => {
                    if (design.product && design.product.category && design.product.category.category_translations) {
                        const translations = design.product.category.category_translations;
                        if (translations && translations.length > 0) {
                            // Use the first translation (should be only one due to where clause)
                            design.product.category.category_name = translations[0].category_name;
                        }
                        // Remove the translations array to keep structure clean
                        delete design.product.category.category_translations;
                    }
                });

                // Calculate total price for each design
                // Formula: TotalPrice = ((MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat)) × Markup
                const designsWithPrice = [];
                
                for (const [productId, designs] of designsByProduct.entries()) {
                    for (const design of designs) {
                        // Metal cost calculation
                        const metalWeight = parseFloat(design.metal_weight) || 0;
                        const ratePerGram = parseFloat(design.metal_rate?.rate) || 0;
                        const metalCost = metalWeight * ratePerGram;

                        // Diamond cost calculation (sum of all diamond details)
                        let diamondCost = 0;
                        if (design.diamond_details && design.diamond_details.length > 0) {
                            design.diamond_details.forEach(diamondDetail => {
                                const diamondPieces = parseInt(diamondDetail.pcs) || 0;
                                const diamondSize = parseFloat(diamondDetail.diamond_rate?.diamond_master?.carat) || 0;
                                const diamondRatePerCarat = parseFloat(diamondDetail.diamond_rate?.rate) || 0;

                                diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
                            });
                        }

                        // Markup - default to 1 if 0, null, or undefined
                        const markUpValue = design.mark_up != null ? parseFloat(design.mark_up) : 1;
                        const markup = markUpValue > 0 ? markUpValue : 1;

                        // Total price calculation
                        const calculatedPrice = (metalCost + diamondCost) * markup;

                        // Determine the actual price to use for comparison based on price_flag
                        // Parse price_flag to handle both string and number types
                        const priceFlagValue = parseInt(design.price_flag) || 0;
                        const designPrice = parseFloat(design.price) || 0;

                        let priceForComparison = calculatedPrice; // Default to calculated price

                        if (priceFlagValue === 2) {
                            if (designPrice !== 0) {
                                // For price_flag == 2 with price > 0, use database price for comparison
                                priceForComparison = designPrice;
                            }
                            // For price_flag == 2 with price == 0, use calculated price (already set as default)
                        } else if (priceFlagValue === 4 && designPrice === 0) {
                            // For price_flag == 4 with price == 0, use a very high number so it's not selected as lowest
                            priceForComparison = Infinity;
                        }
                        // For price_flag == 1 or 0, use calculated price (already set as default)

                        designsWithPrice.push({
                            product_id: productId,
                            design_id: design.id,
                            design: design,
                            totalPrice: priceForComparison,
                            calculatedPrice: calculatedPrice // Keep calculated price for display
                        });
                    }
                }

                // Find lowest priced design for each product, prioritizing Yellow Gold when prices are equal
                const lowestPriceByProduct = new Map();

                // Helper function to check if a design is Yellow Gold
                const isYellowGold = (design) => {
                    const metal = design?.metal_rate?.metal;
                    if (!metal) return false;
                    return metal.metal_name === "Yellow Gold" ||
                        metal.metal_code === "YG" ||
                        metal.id === 1;
                };

                designsWithPrice.forEach(item => {
                    if (!lowestPriceByProduct.has(item.product_id)) {
                        lowestPriceByProduct.set(item.product_id, item);
                    } else {
                        const current = lowestPriceByProduct.get(item.product_id);

                        // If new item has lower price, replace it
                        if (item.totalPrice < current.totalPrice) {
                            lowestPriceByProduct.set(item.product_id, item);
                        }
                        // If prices are equal, prioritize Yellow Gold
                        else if (item.totalPrice === current.totalPrice) {
                            const currentIsYellowGold = isYellowGold(current.design);
                            const newIsYellowGold = isYellowGold(item.design);

                            // If new item is Yellow Gold and current is not, replace it
                            if (newIsYellowGold && !currentIsYellowGold) {
                                lowestPriceByProduct.set(item.product_id, item);
                            }
                            // If current is not Yellow Gold and new is not either, keep current (first one)
                            // If both are Yellow Gold, keep current (first one)
                        }
                    }
                });

                // Build response with lowest priced variant for each product, including all details
                const dataWithUrls = productData.map(item => {
                    const productId = item.product.id;
                    const lowestPriceDesign = lowestPriceByProduct.get(productId);
                    
                    if (!lowestPriceDesign) {
                        return {
                            id: productId,
                            product_name: item.product_name,
                            image: constructImageUrl(item.product.image, 'product'),
                            category_id: item.product.category_id,
                            sub_category_id: item.product.sub_category_id,
                            style_id: item.product.style_id,
                            design: null,
                            total_price: null
                        };
                    }

                    // Convert design to JSON to add computed fields
                    const designData = lowestPriceDesign.design.toJSON ? lowestPriceDesign.design.toJSON() : lowestPriceDesign.design;

                    // Construct full image URLs for all design images
                    if (designData.images && Array.isArray(designData.images)) {
                        designData.images = designData.images.map(img => ({
                            id: img.id,
                            image: img.image_name,
                            image_url: constructImageUrl(img.image_name, 'design'),
                            order: img.order,
                            is_product_listing: img.is_product_listing,
                        }));
                    }

                    // If language_id is provided, return single translation object instead of array
                    if (req.query.language_id && designData.design_translations && Array.isArray(designData.design_translations)) {
                        if (designData.design_translations.length > 0) {
                            designData.design_translation = designData.design_translations[0];
                        } else {
                            designData.design_translation = null;
                        }
                        delete designData.design_translations;
                    }

                    // Get image where is_product_listing is 1, or use product image as fallback
                    let productImage = constructImageUrl(item.product.image, 'product');
                    if (designData.images && designData.images.length > 0) {
                        const listingImage = designData.images.find(img => img.is_product_listing === 1);
                        if (listingImage) {
                            productImage = listingImage.image_url;
                        }
                    }

                    const currentLanguageId = parseInt(req.query.language_id) || languageId.English;
                    const startingFromText =
                        priceMessages.startingFrom[currentLanguageId] ||
                        priceMessages.startingFrom[languageId.English];

                    const enquireText =
                        priceMessages.enquirePrice[currentLanguageId] ||
                        priceMessages.enquirePrice[languageId.English];

                    // Use calculatedPrice for display when needed (price_flag == 1 or fallback)
                    const calculatedPrice = lowestPriceDesign.calculatedPrice || lowestPriceDesign.totalPrice;
                    const calculatedRounded = Math.round(calculatedPrice);
                    const dbPrice = Number(designData.price || 0);
                    const dbPriceRounded = Math.round(dbPrice);

                    // Parse price_flag to handle both string and number types
                    const priceFlagValue = parseInt(designData.price_flag) || 0;

                    // price_flag rules:
                    // 0 => not in query, ignore
                    // 1 => show calculated price
                    // 2 => "Starting From {design.price}" + enquire (if design.price=0 then use calculated)
                    // 4 => "Please enquire"
                    if (priceFlagValue === 1 || priceFlagValue === priceFlag.Set) {
                        designData.total_price = `${priceMessages.currencySymbol}${calculatedRounded}`;
                    }
                    else if (priceFlagValue === 2) {
                        const basePrice = dbPrice > 0 ? dbPriceRounded : calculatedRounded;
                        designData.total_price = `${startingFromText} ${priceMessages.currencySymbol}${basePrice} ${enquireText}`;
                    }
                    else if (priceFlagValue === 4 && dbPrice === 0) {
                        designData.total_price = enquireText;
                    }
                    else {
                        // fallback (for price_flag == 0 or other values)
                        designData.total_price = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded} ${enquireText}`;
                    }


                    return {
                        id: productId,
                        product_name: item.product_name,
                        image: productImage,
                        category_id: item.product.category_id,
                        sub_category_id: item.product.sub_category_id,
                        style_id: item.product.style_id,
                        design: designData,
                        total_price: designData.total_price
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Product list fetched successfully",
                    data: dataWithUrls,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        productListEcom: async (req, res) => {
            try {
                const productWhere = {
                    is_display: 1,
                    category_id: req.query.category_id
                };

                if (req.query.sub_category_id !== undefined && req.query.sub_category_id !== null && req.query.sub_category_id !== '') {
                    productWhere.sub_category_id = req.query.sub_category_id;
                }

                if (req.query.style_id !== undefined && req.query.style_id !== null && req.query.style_id !== '') {
                    productWhere.style_id = req.query.style_id;
                }

                const products = await Product.findAll({
                    where: productWhere,
                    attributes: ['id', 'image', "category_id", "sub_category_id", "style_id"]
                });

                const productIds = products.map(p => p.id);

                if (productIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }

                const translations = await ProductTranslation.findAll({
                    attributes: ['id', 'product_id', 'product_name'],
                    where: {
                        product_id: { [Op.in]: productIds },
                        language_id: req.query.language_id
                    }
                });

                const translationMap = new Map();
                translations.forEach(t => translationMap.set(t.product_id, t));

                const productData = products.map(product => {
                    const translation = translationMap.get(product.id);
                    return {
                        product: product.toJSON ? product.toJSON() : product,
                        product_name: translation ? translation.product_name : null,
                        translation: translation ? (translation.toJSON ? translation.toJSON() : translation) : null
                    };
                }).filter(item => item.product_name !== null);

                const filteredProductIds = productData.map(item => item.product.id);

                if (filteredProductIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }

                // --------------------------
                // Fetch all designs (same as your current)
                // --------------------------
                const allDesigns = await Designs.findAll({
                    where: {
                        product_id: { [Op.in]: filteredProductIds },
                        price_flag: { [Op.ne]: 0 }
                    },
                    include: [
                        {
                            model: MetalRateMaster,
                            as: 'metal_rate',
                            attributes: ['id', 'metal_id', 'karat_id', 'rate'],
                            include: [
                                { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
                                { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
                            ]
                        },
                        {
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            include: [
                                { model: CutMaster, as: 'cut_master', attributes: ['id', 'cut_name', 'cut_code'] },
                                {
                                    model: DiamondRate,
                                    as: 'diamond_rate',
                                    attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
                                    include: [
                                        { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
                                    ]
                                }
                            ]
                        },
                        {
                            model: DesignsImages,
                            as: 'images',
                            attributes: ['id', 'image_name', 'order', 'is_product_listing'],
                            separate: true,
                            order: [['order', 'ASC']]
                        },
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                {
                                    model: Category,
                                    as: 'category',
                                    attributes: ['id', 'category_code', 'image'],
                                    include: [
                                        {
                                            model: CategoryTranslation,
                                            as: 'category_translations',
                                            attributes: ['id', 'category_name', 'language_id'],
                                            where: req.query.language_id ? { language_id: req.query.language_id } : undefined,
                                            required: false
                                        }
                                    ]
                                },
                                { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id', 'order_by'] },
                                { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
                            ]
                        },
                        {
                            model: DesignTranslation,
                            as: 'design_translations',
                            attributes: ['id', 'language_id', 'design_variant_name', 'description', 'note'],
                            // where: req.query.language_id ? { language_id: req.query.language_id } : undefined,
                            required: false,
                            include: [
                                { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                            ]
                        }
                    ]
                });

                // Flatten category_name (same as your current)
                allDesigns.forEach(design => {
                    if (design.product && design.product.category && design.product.category.category_translations) {
                        const translations = design.product.category.category_translations;
                        if (translations && translations.length > 0) {
                            design.product.category.category_name = translations[0].category_name;
                        }
                        delete design.product.category.category_translations;
                    }
                });

                // --------------------------
                // Helpers for variant key
                // --------------------------
                const hasDiamonds = (design) =>
                    Array.isArray(design?.diamond_details) && design.diamond_details.length > 0;

                const getMetalId = (design) =>
                    design?.metal_rate?.metal_id ?? design?.metal_rate?.metal?.id ?? null;

                const getPrimaryCutId = (design) => {
                    const dd = design?.diamond_details || [];
                    if (!dd.length) return null;

                    // 1) If center diamond exists, use that cut
                    const center = dd.find(x => Number(x.is_center) === 1 && x.cut_master_id);
                    if (center?.cut_master_id) return center.cut_master_id;

                    // 2) Otherwise use the lowest cut_master_id
                    const cutIds = dd
                        .map(x => Number(x.cut_master_id))
                        .filter(x => Number.isFinite(x) && x > 0);

                    if (!cutIds.length) return null;

                    return Math.min(...cutIds);
                };


                const getVariantKey = (design) => {
                    const pid = design.product_id;

                    // Plain => group by product_id only (pick lowest price color)
                    if (!hasDiamonds(design)) {
                        return `P_${pid}`;
                    }

                    // Diamond => group by product_id + cut_id only (pick lowest price color for each cut)
                    const cutId = getPrimaryCutId(design);
                    return `D_${pid}_${cutId}`;
                };

                // --------------------------
                // Calculate price per design (same as your current)
                // --------------------------
                const designsWithPrice = [];

                for (const design of allDesigns) {
                    const metalWeight = parseFloat(design.metal_weight) || 0;
                    const ratePerGram = parseFloat(design.metal_rate?.rate) || 0;
                    const metalCost = metalWeight * ratePerGram;

                    let diamondCost = 0;
                    if (hasDiamonds(design)) {
                        design.diamond_details.forEach(diamondDetail => {
                            const diamondPieces = parseInt(diamondDetail.pcs) || 0;
                            const diamondSize = parseFloat(diamondDetail.diamond_rate?.diamond_master?.carat) || 0;
                            const diamondRatePerCarat = parseFloat(diamondDetail.diamond_rate?.rate) || 0;
                            diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
                        });
                    }

                    const markUpValue = design.mark_up != null ? parseFloat(design.mark_up) : 1;
                    const markup = markUpValue > 0 ? markUpValue : 1;

                    // Total price calculation
                    const calculatedPrice = (metalCost + diamondCost) * markup;

                    // Determine the actual price to use for comparison based on price_flag
                    // Parse price_flag to handle both string and number types
                    const priceFlagValue = parseInt(design.price_flag) || 0;
                    const designPrice = parseFloat(design.price) || 0;

                    let priceForComparison = calculatedPrice; // Default to calculated price

                    if (priceFlagValue === 2) {
                        if (designPrice !== 0) {
                            // For price_flag == 2 with price > 0, use database price for comparison
                            priceForComparison = designPrice;
                        }
                        // For price_flag == 2 with price == 0, use calculated price (already set as default)
                    } else if (priceFlagValue === 4 && designPrice === 0) {
                        // For price_flag == 4 with price == 0, use a very high number so it's not selected as lowest
                        priceForComparison = Infinity;
                    }
                    // For price_flag == 1 or 0, use calculated price (already set as default)

                    designsWithPrice.push({
                        product_id: design.product_id,
                        design_id: design.id,
                        design,
                        totalPriceNumber: priceForComparison,
                        calculatedPrice: calculatedPrice // Keep calculated price for display
                    });
                }

                // --------------------------
                // Pick 1 design per variant key (lowest price)
                // When prices are equal: prefer White Gold if prefer_white=1 in query, else Yellow Gold
                // --------------------------
                const preferWhite = req.query.prefer_white == '1' || req.query.prefer_white == 1;
                const bestByVariantKey = new Map();

                const isPreferredMetal = (design, preferWhiteMetal) => {
                    const metal = design?.metal_rate?.metal;
                    if (!metal) return false;
                    if (preferWhiteMetal) {
                        return metal.metal_name === "White Gold" ||
                            metal.metal_code === "WG" ||
                            metal.id === 3;
                    }
                    return metal.metal_name === "Yellow Gold" ||
                        metal.metal_code === "YG" ||
                        metal.id === 1;
                };

                designsWithPrice.forEach(item => {
                    const key = getVariantKey(item.design);

                    if (!bestByVariantKey.has(key)) {
                        bestByVariantKey.set(key, item);
                        return;
                    }

                    const current = bestByVariantKey.get(key);
                    if (item.totalPriceNumber < current.totalPriceNumber) {
                        bestByVariantKey.set(key, item);
                    } else if (item.totalPriceNumber === current.totalPriceNumber) {
                        const currentIsPreferred = isPreferredMetal(current.design, preferWhite);
                        const newIsPreferred = isPreferredMetal(item.design, preferWhite);
                        if (newIsPreferred && !currentIsPreferred) {
                            bestByVariantKey.set(key, item);
                        }
                    }
                });

                // Group selected variants back by product_id
                const selectedByProduct = new Map();
                for (const [, item] of bestByVariantKey.entries()) {
                    const pid = item.product_id;
                    if (!selectedByProduct.has(pid)) selectedByProduct.set(pid, []);
                    selectedByProduct.get(pid).push(item);
                }

                // --------------------------
                // Build response (SAME FORMAT as before)
                // -> duplicates product row per variant
                // --------------------------
                const dataWithUrls = [];

                for (const item of productData) {
                    const productId = item.product.id;
                    const selectedVariants = selectedByProduct.get(productId) || [];

                    // If no design, keep 1 row with design null (same style as you had)
                    // if (!selectedVariants.length) {
                    //     dataWithUrls.push({
                    //         id: productId,
                    //         product_name: item.product_name,
                    //         image: constructImageUrl(item.product.image, 'product'),
                    //         category_id: item.product.category_id,
                    //         sub_category_id: item.product.sub_category_id,
                    //         style_id: item.product.style_id,
                    //         design: null,
                    //         total_price: null
                    //     });
                    //     continue;
                    // }
                    function getMainListingImage({ designImages, productImage, constructImageUrl }) {
                        const fallbackProductUrl = constructImageUrl(productImage, "product");

                        if (!Array.isArray(designImages) || designImages.length === 0) {
                            return fallbackProductUrl;
                        }

                        // 1. is_product_listing = 1
                        const listing = designImages.find(img => Number(img.is_product_listing) === 1);
                        if (listing?.image_url) {
                            return listing.image_url;
                        }

                        // 2. order = 3
                        const orderThree = designImages.find(img => Number(img.order) === 3);
                        if (orderThree?.image_url) {
                            return orderThree.image_url;
                        }

                        // 3. first image
                        if (designImages[0]?.image_url) {
                            return designImages[0].image_url;
                        }

                        // 4. product image fallback
                        return fallbackProductUrl;
                    }


                    // For each variant -> push one record (duplicate product info)
                    for (const v of selectedVariants) {
                        const designData = v.design.toJSON ? v.design.toJSON() : v.design;

                        // Construct full image URLs for all design images
                        // Construct full image URLs for all design images
                        if (designData.images && Array.isArray(designData.images)) {
                            designData.images = designData.images.map(img => ({
                                id: img.id,
                                image: img.image_name,
                                image_url: constructImageUrl(img.image_name, 'design'),
                                order: img.order,
                                is_product_listing: img.is_product_listing,
                            }));
                        }

                        // ✅ Main object image as per rules
                        const productImage = getMainListingImage({
                            designImages: designData.images,
                            productImage: item.product.image,
                            constructImageUrl
                        });

                        // Add total_price to design data based on price_flag
                        // Support for two languages: English (1) and Finnish (2)
                        const currentLanguageId = parseInt(req.query.language_id) || languageId.English; // Default to English (1) if not specified
                        const startingFromText = priceMessages.startingFrom[currentLanguageId] || priceMessages.startingFrom[languageId.English];
                        const enquirePriceText = priceMessages.enquirePrice[currentLanguageId] || priceMessages.enquirePrice[languageId.English];

                        // Use calculatedPrice for display when needed (price_flag == 1 or fallback)
                        const calculatedPrice = v.calculatedPrice || v.totalPriceNumber;
                        const calculatedRounded = Math.round(calculatedPrice);
                        const dbPrice = Number(designData.price || 0);
                        const dbPriceRounded = Math.round(dbPrice);

                        // Parse price_flag to handle both string and number types
                        const priceFlagValue = parseInt(designData.price_flag) || 0;

                        // Initialize total_price - ensure it's always set fresh, never append
                        let totalPriceValue = null;
                        let totalPriceValueOutside = null;
                        // Only ONE condition should execute per design
                        if (priceFlagValue === 1 || priceFlagValue === priceFlag.Set) {
                            // Condition 1: price_flag == 1: Show calculated price
                            totalPriceValue = `${priceMessages.currencySymbol}${calculatedRounded}`;
                            totalPriceValueOutside = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded}`;
                        } else if (priceFlagValue === 2) {
                            // Condition 2: price_flag == 2: Show "Starting From {price from database}" and "Please enquire" (or calculated if price == 0)
                            const basePrice = dbPrice > 0 ? dbPriceRounded : calculatedRounded;
                            totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${basePrice} ${enquirePriceText}`;
                            totalPriceValueOutside = `${startingFromText} ${priceMessages.currencySymbol}${basePrice}`;
                        } else if (priceFlagValue === 4 && dbPrice === 0) {
                            // Condition 3: price_flag == 4 AND designs.price == 0: Show "Please enquire" message only
                            totalPriceValue = enquirePriceText;
                            totalPriceValueOutside = `${enquirePriceText}`;
                        } else {
                            // Fallback: Show calculated price (for price_flag == 0 or other values)
                            // totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded} ${enquirePriceText}`;
                            totalPriceValue = `${enquirePriceText}`;
                            totalPriceValueOutside = `${enquirePriceText}`;
                            // totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded} ${enquirePriceText}`;
                            // totalPriceValueOutside = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded}`;
                        }

                        // Set total_price only once, ensuring no duplication
                        designData.total_price = totalPriceValue;
                        dataWithUrls.push({
                            id: productId,
                            product_name: item.product_name,
                            image: productImage,
                            category_id: item.product.category_id,
                            sub_category_id: item.product.sub_category_id,
                            style_id: item.product.style_id,
                            design: designData,
                            total_price: totalPriceValueOutside
                        });
                    }
                }

                // Sort by sub_category order_by in ascending order
                dataWithUrls.sort((a, b) => {
                    const orderA = a.design?.product?.subCategory?.order_by ?? null;
                    const orderB = b.design?.product?.subCategory?.order_by ?? null;

                    // Handle null values - put them at the end
                    if (orderA === null && orderB === null) return 0;
                    if (orderA === null) return 1;
                    if (orderB === null) return -1;

                    // Sort in ascending order
                    return orderA - orderB;
                });

                return res.status(200).json({
                    success: true,
                    message: "Product list fetched successfully",
                    data: dataWithUrls,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        }
    };
};

module.exports = productController;

