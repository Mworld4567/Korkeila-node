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

                // Check if product with same category_id, sub_category_id, and style_id already exists
                const existingProduct = await Product.findOne({
                    where: {
                        category_id: parseInt(req.body.category_id),
                        sub_category_id: parseInt(req.body.sub_category_id),
                        style_id: parseInt(req.body.style_id),
                    },
                    transaction
                });

                if (existingProduct) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: "Product with this category, sub-category, and style combination already exists",
                    });
                }

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
        productListEcom: async (req, res) => {
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
                        product_id: { [Op.in]: filteredProductIds }
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
                            attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'pcs'],
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
                        const totalPrice = (metalCost + diamondCost) * markup;

                        designsWithPrice.push({
                            product_id: productId,
                            design_id: design.id,
                            design: design,
                            totalPrice: totalPrice
                        });
                    }
                }

                // Find lowest priced design for each product
                const lowestPriceByProduct = new Map();
                designsWithPrice.forEach(item => {
                    if (!lowestPriceByProduct.has(item.product_id)) {
                        lowestPriceByProduct.set(item.product_id, item);
                    } else {
                        const current = lowestPriceByProduct.get(item.product_id);
                        if (item.totalPrice < current.totalPrice) {
                            lowestPriceByProduct.set(item.product_id, item);
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

                    // Add total_price to design data
                    designData.total_price = "€ " + Math.round(lowestPriceDesign.totalPrice);

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
        }
    };
};

module.exports = productController;

