const logError = require("../../logger/log");
const Designs = require("../../Models/Designs");
const DesignsDiamondDetails = require("../../Models/DesignsDiamondDetails");
const DesignsImages = require("../../Models/DesignsImages");
const CategoryMaster = require("../../Models/Category");
const StyleMaster = require("../../Models/StyleMaster");
const CutMaster = require("../../Models/CutMaster");
const Karat = require("../../Models/Karat");
const DiamondMaster = require("../../Models/DiamondMaster");
const sequelize = require("../../config/dbconfig");
const Metal = require("../../Models/Metal");
const Product = require("../../Models/Product");
const MetalRateMaster = require("../../Models/MetalRateMaster");
const DiamondRate = require("../../Models/DiamondRate");
const SubCategory = require("../../Models/SubCategory");
const DiamondType = require("../../Models/DiamondType");
const DiamondClarity = require("../../Models/DiamondClarity");
const Category = require("../../Models/Category");
const ProductTranslation = require("../../Models/ProductTranslation");
const DiamondTypeTranslation = require("../../Models/DiamondTypeTranslation");
const MetalTranslation = require("../../Models/MetalTranslation");
const DesignTranslation = require("../../Models/DesignTranslation");
const { Op } = require("sequelize");
const { extractFilename, constructImageUrl } = require("../../helpers/imageHelper");
const Language = require("../../Models/Language");

const designController = () => {
    return {
        read: async (req, res) => {
            try {
                const { Op } = require("sequelize");

                // Fetch all designs
                const designs = await Designs.findAll({
                    order: [['id', 'DESC']]
                });

                if (designs.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Designs fetched successfully",
                        data: [],
                    });
                }

                // Get all related data in parallel
                const designIds = designs.map(d => d.id);

                // First, fetch diamond details to get all diamond_rate_ids and cut_master_ids
                const diamondDetailsList = await DesignsDiamondDetails.findAll({
                    where: { design_id: { [Op.in]: designIds } },
                    include: [
                        {
                            model: DiamondRate, as: 'diamond_rate', attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
                            include: [
                                { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] },
                                { model: DiamondType, as: 'diamond_type', attributes: ['id', 'type_name'] },
                                { model: DiamondClarity, as: 'clarity', attributes: ['id', 'clarity'] }
                            ]
                        },
                    ],
                    order: [['id', 'DESC']]
                });

                // Collect all IDs needed for queries
                const productIds = [...new Set(designs.map(d => d.product_id).filter(Boolean))];
                const categoryIds = [...new Set(designs.map(d => d.category_id).filter(Boolean))];
                const subCategoryIds = [...new Set(designs.map(d => d.sub_category_id).filter(Boolean))];
                const metalRateIds = [...new Set(designs.map(d => d.metal_rate_id).filter(Boolean))];
                const diamondRateIdsFromDesigns = [...new Set(designs.map(d => d.diamond_rate_id).filter(Boolean))];
                const diamondRateIdsFromDetails = [...new Set(diamondDetailsList.map(dd => dd.diamond_rate_id).filter(Boolean))];
                const allDiamondRateIds = [...new Set([...diamondRateIdsFromDesigns, ...diamondRateIdsFromDetails])];
                const cutMasterIds = [...new Set(diamondDetailsList.map(dd => dd.cut_master_id).filter(Boolean))];

                // Fetch all related data in parallel
                const [
                    imagesList,
                    productsList,
                    categoriesList,
                    subCategoriesList,
                    metalRatesList,
                    diamondRatesList,
                    cutMastersList
                ] = await Promise.all([
                    DesignsImages.findAll({
                        where: { design_id: { [Op.in]: designIds } }
                    }),
                    Product.findAll({
                        where: { id: { [Op.in]: productIds } }
                    }),
                    CategoryMaster.findAll({
                        where: { id: { [Op.in]: categoryIds } }
                    }),
                    SubCategory.findAll({
                        where: { id: { [Op.in]: subCategoryIds } }
                    }),
                    MetalRateMaster.findAll({
                        where: { id: { [Op.in]: metalRateIds } },
                        include: [
                            { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
                            { model: Metal, as: 'metal', attributes: ['id', 'metal_name'] }
                        ]
                    }),
                    DiamondRate.findAll({
                        where: { id: { [Op.in]: allDiamondRateIds } },
                        include: [
                            { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] },
                            { model: DiamondType, as: 'diamond_type', attributes: ['id', 'type_name'] },
                            { model: DiamondClarity, as: 'clarity', attributes: ['id', 'clarity'] }
                        ]
                    }),
                    CutMaster.findAll({
                        where: { id: { [Op.in]: cutMasterIds } }
                    })
                ]);

                // Create lookup maps for efficient data retrieval
                const productsMap = new Map(productsList.map(p => [p.id, p]));
                const categoriesMap = new Map(categoriesList.map(c => [c.id, c]));
                const subCategoriesMap = new Map(subCategoriesList.map(sc => [sc.id, sc]));
                const metalRatesMap = new Map(metalRatesList.map(mr => [mr.id, mr]));
                const diamondRatesMap = new Map(diamondRatesList.map(dr => [dr.id, dr]));
                const cutMastersMap = new Map(cutMastersList.map(cm => [cm.id, cm]));
                const diamondDetailsMap = new Map();
                const imagesMap = new Map();

                // Group diamond details by design_id
                diamondDetailsList.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd);
                });

                // Group images by design_id
                imagesList.forEach(img => {
                    if (!imagesMap.has(img.design_id)) {
                        imagesMap.set(img.design_id, []);
                    }
                    imagesMap.get(img.design_id).push(img);
                });

                // Build response data
                const responseData = designs.map(design => {
                    const category = categoriesMap.get(design.category_id);
                    const subCategory = subCategoriesMap.get(design.sub_category_id);
                    const metalRate = metalRatesMap.get(design.metal_rate_id);
                    const diamondDetails = diamondDetailsMap.get(design.id) || [];
                    const images = imagesMap.get(design.id) || [];

                    // Format diamond design details
                    const formattedDiamondDetails = diamondDetails.map(dd => {
                        const cut = cutMastersMap.get(dd.cut_master_id);
                        const diamondRate = diamondRatesMap.get(dd.diamond_rate_id);
                        return {
                            id: dd.id,
                            cut_id: dd.cut_master_id,
                            cut_name: cut?.cut_name || "",
                            diamond_rate_id: dd.diamond_rate_id,
                            diamond_rate_name: dd.diamond_rate?.diamond_master?.carat + " " +
                                dd.diamond_rate?.diamond_type?.type_name + " " +
                                dd.diamond_rate?.clarity?.clarity,
                            pcs: dd.pcs,
                        };
                    });

                    return {
                        id: design.id,
                        product_id: design.product_id,
                        product_name: design.design_variant_name,
                        metal_rate_id: design.metal_rate_id,
                        metal_rate_name: metalRate ? `${metalRate.metal?.metal_name || ""} - ${metalRate.karat?.karat || ""}` : "",
                        weight: design.metal_weight,
                        mark_up: design.mark_up,
                        diamond_rate_id: design.diamond_rate_id,
                        diamond_design_detail: formattedDiamondDetails,
                        images: images.map(img => ({
                            id: img.id,
                            image_name: img.image_name,
                            image_url: constructImageUrl(img.image_name, 'design')
                        }))
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Designs fetched successfully",
                    data: responseData,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        readOne: async (req, res) => {
            try {
                // Validate design ID
                if (!req.params.id) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide design ID",
                    });
                }

                // Fetch design by ID
                const design = await Designs.findByPk(req.params.id);

                if (!design) {
                    return res.status(404).json({
                        success: false,
                        message: "Design not found",
                    });
                }

                // Fetch all related data in parallel
                const [
                    diamondDetailsList,
                    imagesList,
                    product,
                    category,
                    subCategory,
                    metalRate,
                    translations
                ] = await Promise.all([
                    DesignsDiamondDetails.findAll({
                        where: { design_id: design.id },
                        include: [
                            {
                                model: DiamondRate, as: 'diamond_rate', attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
                                include: [
                                    { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] },
                                    { model: DiamondType, as: 'diamond_type', attributes: ['id', 'type_name'] },
                                    { model: DiamondClarity, as: 'clarity', attributes: ['id', 'clarity'] }
                                ]
                            },
                        ],
                        order: [['id', 'DESC']]
                    }),
                    DesignsImages.findAll({
                        where: { design_id: design.id }
                    }),
                    Product.findByPk(design.product_id),
                    CategoryMaster.findByPk(design.category_id),
                    SubCategory.findByPk(design.sub_category_id),
                    MetalRateMaster.findByPk(design.metal_rate_id, {
                        include: [
                            { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
                            { model: Metal, as: 'metal', attributes: ['id', 'metal_name'] }
                        ]
                    }),
                    DesignTranslation.findAll({
                        where: { design_id: design.id }
                    })
                ]);

                // Get cut master IDs from diamond details
                const cutMasterIds = [...new Set(diamondDetailsList.map(dd => dd.cut_master_id).filter(Boolean))];

                // Fetch cut masters
                const cutMastersList = cutMasterIds.length > 0 ? await CutMaster.findAll({
                    where: { id: { [Op.in]: cutMasterIds } }
                }) : [];

                // Create lookup maps
                const cutMastersMap = new Map(cutMastersList.map(cm => [cm.id, cm]));

                // Format diamond design details
                const formattedDiamondDetails = diamondDetailsList.map(dd => {
                    const cut = cutMastersMap.get(dd.cut_master_id);
                    const diamondRate = dd.diamond_rate;
                    return {
                        id: dd.id,
                        cut_id: dd.cut_master_id,
                        cut_name: cut?.cut_name || "",
                        diamond_rate_id: dd.diamond_rate_id,
                        diamond_rate_name: diamondRate?.diamond_master?.carat + " " +
                            diamondRate?.diamond_type?.type_name + " " +
                            diamondRate?.clarity?.clarity,
                        pcs: dd.pcs,
                    };
                });

                // Format response data
                const responseData = {
                    id: design.id,
                    product_id: design.product_id,
                    product_name: design.design_variant_name,
                    metal_rate_id: design.metal_rate_id,
                    metal_rate_name: metalRate ? `${metalRate.metal?.metal_name || ""} - ${metalRate.karat?.karat || ""}` : "",
                    weight: design.metal_weight,
                    mark_up: design.mark_up,
                    diamond_rate_id: design.diamond_rate_id,
                    diamond_design_detail: formattedDiamondDetails,
                    images: imagesList.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    })),
                    translations: translations.map(trans => ({
                        id: trans.id,
                        language_id: trans.language_id,
                        design_variant_name: trans.design_variant_name,
                        description: trans.description,
                    })),
                };

                return res.status(200).json({
                    success: true,
                    message: "Design fetched successfully",
                    data: responseData,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        create: async (req, res) => {
            const transaction = req.transaction || null;
            try {
                // Validate required fields
                if (!req.body.product_id || req.body.product_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter product ID",
                    });
                }

                if (!req.body.product_name || req.body.product_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter product name",
                    });
                }

                if (!req.body.metal_rate_id || req.body.metal_rate_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter metal rate ID",
                    });
                }

                if (!req.body.weight || req.body.weight === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter weight",
                    });
                }

                // Parse diamond_design_detail if it's a JSON string (when sent as form-data)
                if (req.body.diamond_design_detail && typeof req.body.diamond_design_detail === 'string') {
                    try {
                        req.body.diamond_design_detail = JSON.parse(req.body.diamond_design_detail);
                    } catch (error) {
                        return res.status(401).json({
                            success: false,
                            message: "Invalid diamond design details format",
                        });
                    }
                }

                if (!req.body.diamond_design_detail || !Array.isArray(req.body.diamond_design_detail) || req.body.diamond_design_detail.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide diamond design details",
                    });
                }

                // Fetch product to get category_id and sub_category_id
                const product = await Product.findByPk(req.body.product_id, { transaction });
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Product not found",
                    });
                }

                // Get first diamond_rate_id from diamond_design_detail for the Designs table (required field)
                const firstDiamondRateId = req.body.diamond_design_detail[0]?.diamond_rate_id;
                if (!firstDiamondRateId) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide diamond rate ID in diamond design details",
                    });
                }

                // Prepare design data
                const designData = {
                    product_id: parseInt(req.body.product_id),
                    design_variant_name: req.body.product_name.trim(),
                    category_id: product.category_id,
                    sub_category_id: product.sub_category_id,
                    metal_rate_id: parseInt(req.body.metal_rate_id),
                    metal_weight: parseFloat(req.body.weight),
                    mark_up: req.body.mark_up && req.body.mark_up !== "" ? parseFloat(req.body.mark_up) : 0,
                    is_filter_available: req.body.diamond_design_detail.length > 1 ? 0 : 1,
                };

                // Check for duplicate design with same parameters
                const existingDesigns = await Designs.findAll({
                    where: {
                        product_id: designData.product_id,
                        design_variant_name: designData.design_variant_name,
                        metal_rate_id: designData.metal_rate_id,
                        metal_weight: designData.metal_weight,
                        mark_up: designData.mark_up,
                    },
                    include: [{
                        model: DesignsDiamondDetails,
                        as: 'diamond_details',
                        attributes: ['cut_master_id', 'diamond_rate_id', 'pcs']
                    }],
                    transaction
                });

                // Check if any existing design has matching diamond details
                for (const existingDesign of existingDesigns) {
                    const existingDiamondDetails = existingDesign.diamond_details || [];

                    // Check if the number of diamond details matches
                    if (existingDiamondDetails.length !== req.body.diamond_design_detail.length) {
                        continue;
                    }

                    // Sort both arrays for comparison
                    const sortedExisting = existingDiamondDetails
                        .map(d => ({
                            cut_id: d.cut_master_id,
                            diamond_rate_id: d.diamond_rate_id,
                            pcs: d.pcs
                        }))
                        .sort((a, b) => {
                            if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                            if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                            return a.pcs - b.pcs;
                        });

                    const sortedNew = req.body.diamond_design_detail
                        .map(d => ({
                            cut_id: parseInt(d.cut_id),
                            diamond_rate_id: parseInt(d.diamond_rate_id),
                            pcs: parseInt(d.pcs) || 0
                        }))
                        .sort((a, b) => {
                            if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                            if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                            return a.pcs - b.pcs;
                        });

                    // Compare each diamond detail
                    let allMatch = true;
                    for (let i = 0; i < sortedExisting.length; i++) {
                        if (
                            sortedExisting[i].cut_id !== sortedNew[i].cut_id ||
                            sortedExisting[i].diamond_rate_id !== sortedNew[i].diamond_rate_id ||
                            sortedExisting[i].pcs !== sortedNew[i].pcs
                        ) {
                            allMatch = false;
                            break;
                        }
                    }

                    // If all parameters match, return error
                    if (allMatch) {
                        return res.status(409).json({
                            success: false,
                            message: "A design with the same parameters already exists",
                        });
                    }
                }

                // Create design
                const design = await Designs.create(designData, { transaction });

                // Create diamond design details
                const diamondDetails = req.body.diamond_design_detail.map(detail => ({
                    design_id: design.id,
                    cut_master_id: parseInt(detail.cut_id),
                    diamond_rate_id: parseInt(detail.diamond_rate_id),
                    pcs: parseInt(detail.pcs) || 0,
                }));

                await DesignsDiamondDetails.bulkCreate(diamondDetails, { transaction });

                // Handle translations - create design translations if design_name_array is provided
                let designTranslations = [];
                if (req.body.design_name_array) {
                    let designNameArray = req.body.design_name_array;

                    // Parse design_name_array if it's a JSON string (when sent as form-data)
                    if (typeof designNameArray === 'string') {
                        try {
                            designNameArray = JSON.parse(designNameArray);
                        } catch (error) {
                            return res.status(401).json({
                                success: false,
                                message: "Invalid design name array format",
                            });
                        }
                    }

                    // Handle both array format and object format (from form-data bracket notation)
                    if (!Array.isArray(designNameArray) && typeof designNameArray === 'object') {
                        // Convert object with numeric keys to array
                        designNameArray = Object.keys(designNameArray)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(key => designNameArray[key]);
                    }

                    if (Array.isArray(designNameArray) && designNameArray.length > 0) {
                        const translationRecords = designNameArray.map(item => ({
                            design_id: design.id,
                            language_id: parseInt(item.language_id),
                            design_variant_name: item.design_variant_name ? item.design_variant_name.trim() : "",
                            description: item.description ? item.description.trim() : null,
                        }));

                        designTranslations = await DesignTranslation.bulkCreate(translationRecords, { transaction });
                    }
                }

                // Handle file uploads - save to DesignsImages table
                const uploadedImages = [];
                if (req.files && req.files.length > 0) {
                    const imageRecords = req.files.map(file => {
                        // Extract filename from S3 key (file.key contains the full S3 path)
                        const imageName = extractFilename(file.key) || file.originalname;
                        return {
                            design_id: design.id,
                            image_name: imageName,
                        };
                    });

                    const createdImages = await DesignsImages.bulkCreate(imageRecords, { transaction });
                    uploadedImages.push(...createdImages.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    })));
                }

                // Prepare response data
                const responseData = {
                    id: design.id,
                    product_id: design.product_id,
                    product_name: design.design_variant_name,
                    metal_rate_id: design.metal_rate_id,
                    metal_rate_name: req.body.metal_rate_name || "",
                    weight: design.metal_weight,
                    mark_up: design.mark_up,
                    diamond_design_detail: req.body.diamond_design_detail.map(detail => ({
                        cut_id: detail.cut_id,
                        cut_code: detail.cut_code || "",
                        diamond_rate_id: detail.diamond_rate_id,
                        diamond_rate_name: detail.diamond_rate_name || "",
                        pcs: detail.pcs,
                    })),
                    images: uploadedImages,
                    translations: designTranslations.map(trans => ({
                        id: trans.id,
                        language_id: trans.language_id,
                        design_variant_name: trans.design_variant_name,
                        description: trans.description,
                    })),
                };

                return res.status(200).json({
                    success: true,
                    message: "Design created successfully",
                    data: responseData,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        update: async (req, res) => {
            const transaction = req.transaction || null;
            try {
                // Validate design ID
                if (!req.params.id) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide design ID",
                    });
                }

                // Find existing design
                const existingDesign = await Designs.findByPk(req.params.id, {
                    include: [{
                        model: DesignsDiamondDetails,
                        as: 'diamond_details',
                        attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'pcs']
                    }],
                    transaction
                });

                if (!existingDesign) {
                    return res.status(404).json({
                        success: false,
                        message: "Design not found",
                    });
                }

                // Validate required fields
                if (!req.body.product_id || req.body.product_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter product ID",
                    });
                }

                if (!req.body.product_name || req.body.product_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter product name",
                    });
                }

                if (!req.body.metal_rate_id || req.body.metal_rate_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter metal rate ID",
                    });
                }

                if (!req.body.weight || req.body.weight === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter weight",
                    });
                }

                // Parse diamond_design_detail if it's a JSON string (when sent as form-data)
                if (req.body.diamond_design_detail && typeof req.body.diamond_design_detail === 'string') {
                    try {
                        req.body.diamond_design_detail = JSON.parse(req.body.diamond_design_detail);
                    } catch (error) {
                        return res.status(401).json({
                            success: false,
                            message: "Invalid diamond design details format",
                        });
                    }
                }

                if (!req.body.diamond_design_detail || !Array.isArray(req.body.diamond_design_detail) || req.body.diamond_design_detail.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide diamond design details",
                    });
                }

                // Fetch product to get category_id and sub_category_id
                const product = await Product.findByPk(req.body.product_id, { transaction });
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Product not found",
                    });
                }

                // Get first diamond_rate_id from diamond_design_detail for the Designs table (required field)
                const firstDiamondRateId = req.body.diamond_design_detail[0]?.diamond_rate_id;
                if (!firstDiamondRateId) {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide diamond rate ID in diamond design details",
                    });
                }

                // Prepare design data
                const designData = {
                    product_id: parseInt(req.body.product_id),
                    design_variant_name: req.body.product_name.trim(),
                    category_id: product.category_id,
                    sub_category_id: product.sub_category_id,
                    metal_rate_id: parseInt(req.body.metal_rate_id),
                    metal_weight: parseFloat(req.body.weight),
                    mark_up: req.body.mark_up && req.body.mark_up !== "" ? parseFloat(req.body.mark_up) : 0,
                    is_filter_available: req.body.diamond_design_detail.length > 1 ? 0 : 1,
                };

                // Check if incoming data is the same as current design (to avoid false duplicate detection)
                const currentDiamondDetails = existingDesign.diamond_details || [];
                const isSameDesignData =
                    existingDesign.product_id === designData.product_id &&
                    existingDesign.design_variant_name === designData.design_variant_name &&
                    existingDesign.metal_rate_id === designData.metal_rate_id &&
                    existingDesign.metal_weight === designData.metal_weight &&
                    existingDesign.mark_up === designData.mark_up;

                // Check if diamond details are the same
                let isSameDiamondDetails = false;
                if (isSameDesignData && currentDiamondDetails.length === req.body.diamond_design_detail.length) {
                    // Sort both arrays for comparison
                    const sortedCurrent = currentDiamondDetails
                        .map(d => ({
                            cut_id: d.cut_master_id,
                            diamond_rate_id: d.diamond_rate_id,
                            pcs: d.pcs
                        }))
                        .sort((a, b) => {
                            if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                            if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                            return a.pcs - b.pcs;
                        });

                    const sortedNew = req.body.diamond_design_detail
                        .map(d => ({
                            cut_id: parseInt(d.cut_id),
                            diamond_rate_id: parseInt(d.diamond_rate_id),
                            pcs: parseInt(d.pcs) || 0
                        }))
                        .sort((a, b) => {
                            if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                            if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                            return a.pcs - b.pcs;
                        });

                    // Compare each diamond detail
                    isSameDiamondDetails = true;
                    for (let i = 0; i < sortedCurrent.length; i++) {
                        if (
                            sortedCurrent[i].cut_id !== sortedNew[i].cut_id ||
                            sortedCurrent[i].diamond_rate_id !== sortedNew[i].diamond_rate_id ||
                            sortedCurrent[i].pcs !== sortedNew[i].pcs
                        ) {
                            isSameDiamondDetails = false;
                            break;
                        }
                    }
                }

                // If all data is the same, skip duplicate check and proceed with update
                const skipDuplicateCheck = isSameDesignData && isSameDiamondDetails;

                // Check for duplicate design with same parameters (excluding current design)
                // Only check if the data has actually changed
                if (!skipDuplicateCheck) {
                    const existingDesigns = await Designs.findAll({
                        where: {
                            product_id: designData.product_id,
                            design_variant_name: designData.design_variant_name,
                            metal_rate_id: designData.metal_rate_id,
                            metal_weight: designData.metal_weight,
                            mark_up: designData.mark_up,
                            id: { [Op.ne]: parseInt(req.params.id) },
                        },
                        include: [{
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            attributes: ['cut_master_id', 'diamond_rate_id', 'pcs']
                        }],
                        transaction
                    });

                    // Check if any existing design has matching diamond details
                    for (const existingDesignCheck of existingDesigns) {
                        const existingDiamondDetails = existingDesignCheck.diamond_details || [];

                        // Check if the number of diamond details matches
                        if (existingDiamondDetails.length !== req.body.diamond_design_detail.length) {
                            continue;
                        }

                        // Sort both arrays for comparison
                        const sortedExisting = existingDiamondDetails
                            .map(d => ({
                                cut_id: d.cut_master_id,
                                diamond_rate_id: d.diamond_rate_id,
                                pcs: d.pcs
                            }))
                            .sort((a, b) => {
                                if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                                if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                                return a.pcs - b.pcs;
                            });

                        const sortedNew = req.body.diamond_design_detail
                            .map(d => ({
                                cut_id: parseInt(d.cut_id),
                                diamond_rate_id: parseInt(d.diamond_rate_id),
                                pcs: parseInt(d.pcs) || 0
                            }))
                            .sort((a, b) => {
                                if (a.cut_id !== b.cut_id) return a.cut_id - b.cut_id;
                                if (a.diamond_rate_id !== b.diamond_rate_id) return a.diamond_rate_id - b.diamond_rate_id;
                                return a.pcs - b.pcs;
                            });

                        // Compare each diamond detail
                        let allMatch = true;
                        for (let i = 0; i < sortedExisting.length; i++) {
                            if (
                                sortedExisting[i].cut_id !== sortedNew[i].cut_id ||
                                sortedExisting[i].diamond_rate_id !== sortedNew[i].diamond_rate_id ||
                                sortedExisting[i].pcs !== sortedNew[i].pcs
                            ) {
                                allMatch = false;
                                break;
                            }
                        }

                        // If all parameters match, return error
                        if (allMatch) {
                            return res.status(409).json({
                                success: false,
                                message: "A design with the same parameters already exists",
                            });
                        }
                    }
                }

                // Update design
                await Designs.update(designData, {
                    where: { id: req.params.id },
                    transaction
                });

                // Delete existing diamond design details
                await DesignsDiamondDetails.destroy({
                    where: { design_id: req.params.id },
                    transaction
                });

                // Create new diamond design details
                const diamondDetails = req.body.diamond_design_detail.map(detail => ({
                    design_id: parseInt(req.params.id),
                    cut_master_id: parseInt(detail.cut_id),
                    diamond_rate_id: parseInt(detail.diamond_rate_id),
                    pcs: parseInt(detail.pcs) || 0,
                }));

                await DesignsDiamondDetails.bulkCreate(diamondDetails, { transaction });

                // Handle translations - delete existing and create new if design_name_array is provided
                let designTranslations = [];
                if (req.body.design_name_array) {
                    // Delete existing translations
                    await DesignTranslation.destroy({
                        where: { design_id: req.params.id },
                        transaction
                    });

                    let designNameArray = req.body.design_name_array;

                    // Parse design_name_array if it's a JSON string (when sent as form-data)
                    if (typeof designNameArray === 'string') {
                        try {
                            designNameArray = JSON.parse(designNameArray);
                        } catch (error) {
                            return res.status(401).json({
                                success: false,
                                message: "Invalid design name array format",
                            });
                        }
                    }

                    // Handle both array format and object format (from form-data bracket notation)
                    if (!Array.isArray(designNameArray) && typeof designNameArray === 'object') {
                        // Convert object with numeric keys to array
                        designNameArray = Object.keys(designNameArray)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(key => designNameArray[key]);
                    }

                    if (Array.isArray(designNameArray) && designNameArray.length > 0) {
                        const translationRecords = designNameArray.map(item => ({
                            design_id: parseInt(req.params.id),
                            language_id: parseInt(item.language_id),
                            design_variant_name: item.design_variant_name ? item.design_variant_name.trim() : "",
                            description: item.description ? item.description.trim() : null,
                        }));

                        designTranslations = await DesignTranslation.bulkCreate(translationRecords, { transaction });
                    }
                } else {
                    // If design_name_array is not provided, keep existing translations
                    designTranslations = await DesignTranslation.findAll({
                        where: { design_id: req.params.id },
                        transaction
                    });
                }

                // Handle file uploads - add new images to DesignsImages table
                const uploadedImages = [];
                if (req.files && req.files.length > 0) {
                    const imageRecords = req.files.map(file => {
                        // Extract filename from S3 key (file.key contains the full S3 path)
                        const imageName = extractFilename(file.key) || file.originalname;
                        return {
                            design_id: parseInt(req.params.id),
                            image_name: imageName,
                        };
                    });

                    const createdImages = await DesignsImages.bulkCreate(imageRecords, { transaction });
                    uploadedImages.push(...createdImages.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    })));
                }

                // Fetch existing images if no new images were uploaded
                let allImages = uploadedImages;
                if (uploadedImages.length === 0) {
                    const existingImages = await DesignsImages.findAll({
                        where: { design_id: req.params.id },
                        transaction
                    });
                    allImages = existingImages.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    }));
                } else {
                    // Combine existing images with new ones
                    const existingImages = await DesignsImages.findAll({
                        where: { design_id: req.params.id },
                        transaction
                    });
                    const existingImagesFormatted = existingImages.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    }));
                    allImages = [...existingImagesFormatted, ...uploadedImages];
                }

                // Fetch updated design
                const updatedDesign = await Designs.findByPk(req.params.id, { transaction });

                // Prepare response data
                const responseData = {
                    id: updatedDesign.id,
                    product_id: updatedDesign.product_id,
                    product_name: updatedDesign.design_variant_name,
                    metal_rate_id: updatedDesign.metal_rate_id,
                    metal_rate_name: req.body.metal_rate_name || "",
                    weight: updatedDesign.metal_weight,
                    mark_up: updatedDesign.mark_up,
                    diamond_design_detail: req.body.diamond_design_detail.map(detail => ({
                        cut_id: detail.cut_id,
                        cut_code: detail.cut_code || "",
                        diamond_rate_id: detail.diamond_rate_id,
                        diamond_rate_name: detail.diamond_rate_name || "",
                        pcs: detail.pcs,
                    })),
                    images: allImages,
                    translations: designTranslations.map(trans => ({
                        id: trans.id,
                        language_id: trans.language_id,
                        design_variant_name: trans.design_variant_name,
                        description: trans.description,
                    })),
                };

                return res.status(200).json({
                    success: true,
                    message: "Design updated successfully",
                    data: responseData,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        // variantDetailsForEcom: async (req, res) => {
        //     try {
        //         // Validate product_id
        //         const productId = req.query.product_id || req.body.product_id;
        //         const metalId = req.query.metal_id || req.body.metal_id;
        //         const karatId = req.query.karat_id || req.body.karat_id;
        //         const diamondTypeId = req.query.diamond_type_id || req.body.diamond_type_id;
        //         const clarityId = req.query.clarity_id || req.body.clarity_id;
        //         const carat = req.query.carat || req.body.carat;

        //         if (!productId) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: "Please provide product_id"
        //             });
        //         }

        //         // Fetch all designs for the product
        //         let designs = await Designs.findAll({
        //             where: { product_id: parseInt(productId) }
        //         });

        //         if (designs.length === 0) {
        //             return res.status(404).json({
        //                 success: false,
        //                 message: "No designs found for this product"
        //             });
        //         }

        //         // Get all metal rate IDs from designs
        //         const metalRateIds = [...new Set(designs.map(d => d.metal_rate_id).filter(Boolean))];

        //         // Fetch metal rates with metal and karat info
        //         const allMetalRates = await MetalRateMaster.findAll({
        //             where: { id: { [Op.in]: metalRateIds } },
        //             include: [
        //                 { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
        //                 { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
        //             ],
        //             order: [['date', 'DESC'], ['id', 'DESC']]
        //         });

        //         // Filter designs by metal_id and karat_id if provided
        //         if (metalId || karatId) {
        //             // Find metal_rate_ids that match the filter
        //             const matchingMetalRateIds = allMetalRates
        //                 .filter(mr => {
        //                     const matchesMetal = !metalId || mr.metal_id === parseInt(metalId);
        //                     const matchesKarat = !karatId || mr.karat_id === parseInt(karatId);
        //                     return matchesMetal && matchesKarat;
        //                 })
        //                 .map(mr => mr.id);

        //             if (matchingMetalRateIds.length === 0) {
        //                 return res.status(404).json({
        //                     success: false,
        //                     message: "No designs found matching the specified metal and karat combination"
        //                 });
        //             }

        //             // Filter designs to only those with matching metal_rate_id
        //             designs = designs.filter(d => matchingMetalRateIds.includes(d.metal_rate_id));
        //         }

        //         if (designs.length === 0) {
        //             return res.status(404).json({
        //                 success: false,
        //                 message: "No designs found matching the specified filters"
        //             });
        //         }

        //         // Get all related IDs for bulk fetching
        //         const designIds = designs.map(d => d.id);
        //         const filteredMetalRateIds = [...new Set(designs.map(d => d.metal_rate_id).filter(Boolean))];

        //         // Fetch diamond details for filtered designs
        //         const diamondDetailsList = await DesignsDiamondDetails.findAll({
        //             where: { design_id: { [Op.in]: designIds } }
        //         });

        //         // Get all diamond rate IDs from diamond details
        //         const diamondRateIds = [...new Set(diamondDetailsList.map(dd => dd.diamond_rate_id).filter(Boolean))];

        //         // Fetch diamond rates with type and clarity info
        //         const diamondRatesList = await DiamondRate.findAll({
        //             where: {
        //                 id: { [Op.in]: diamondRateIds },
        //                 deleted_at: null
        //             },
        //             include: [
        //                 { model: DiamondType, as: 'diamond_type', attributes: ['id', 'type_name', 'type_code'] },
        //                 { model: DiamondClarity, as: 'clarity', attributes: ['id', 'clarity'] }
        //             ]
        //         });

        //         // Get diamond master IDs from diamond rates
        //         const diamondMasterIds = [...new Set(diamondRatesList.map(dr => dr.diamond_master_id).filter(Boolean))];
        //         const cutMasterIds = [...new Set(diamondDetailsList.map(dd => dd.cut_master_id).filter(Boolean))];

        //         // Fetch diamond masters first (needed for carat filtering)
        //         const allDiamondMasters = await DiamondMaster.findAll({
        //             where: {
        //                 id: { [Op.in]: diamondMasterIds },
        //                 deleted_at: null
        //             }
        //         });

        //         // If carat filter is provided, filter diamond masters by carat value
        //         let filteredDiamondMasterIds = diamondMasterIds;
        //         if (carat !== undefined && carat !== null && carat !== '') {
        //             const caratValue = parseFloat(carat);
        //             const matchingDiamondMasters = allDiamondMasters.filter(dm => {
        //                 const masterCarat = parseFloat(dm.carat);
        //                 // Match exact carat value (you can modify this to support ranges if needed)
        //                 return masterCarat === caratValue;
        //             });

        //             if (matchingDiamondMasters.length === 0) {
        //                 return res.status(404).json({
        //                     success: false,
        //                     message: "No diamond rates found matching the specified carat value"
        //                 });
        //             }

        //             filteredDiamondMasterIds = matchingDiamondMasters.map(dm => dm.id);
        //         }

        //         // If diamond filters are provided, fetch all possible diamond rates for those filters
        //         let filteredDiamondRatesMap = new Map();
        //         if (diamondTypeId || clarityId || carat !== undefined && carat !== null && carat !== '') {
        //             const whereClause = { deleted_at: null };
        //             if (diamondTypeId) whereClause.diamond_type_id = parseInt(diamondTypeId);
        //             if (clarityId) whereClause.clarity_id = parseInt(clarityId);
        //             // If carat filter is active, filter by diamond_master_id
        //             if (carat !== undefined && carat !== null && carat !== '' && filteredDiamondMasterIds.length > 0) {
        //                 whereClause.diamond_master_id = { [Op.in]: filteredDiamondMasterIds };
        //             }

        //             // Fetch all diamond rates matching the filters (not just those in current designs)
        //             const allMatchingDiamondRates = await DiamondRate.findAll({
        //                 where: whereClause,
        //                 include: [
        //                     { model: DiamondType, as: 'diamond_type', attributes: ['id', 'type_name', 'type_code'] },
        //                     { model: DiamondClarity, as: 'clarity', attributes: ['id', 'clarity'] }
        //                 ]
        //             });

        //             // Create a map: diamond_master_id -> diamond_rate (for filtering)
        //             // If multiple rates match, keep the first one
        //             filteredDiamondRatesMap = new Map();
        //             allMatchingDiamondRates.forEach(dr => {
        //                 const key = dr.diamond_master_id;
        //                 if (!filteredDiamondRatesMap.has(key)) {
        //                     filteredDiamondRatesMap.set(key, dr);
        //                 }
        //             });
        //         }

        //         // Fetch all remaining related data in parallel
        //         const [
        //             metalRatesList,
        //             diamondMastersList,
        //             imagesList,
        //             cutMastersList
        //         ] = await Promise.all([
        //             MetalRateMaster.findAll({
        //                 where: { id: { [Op.in]: filteredMetalRateIds } },
        //                 include: [
        //                     { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
        //                     { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
        //                 ],
        //                 order: [['date', 'DESC'], ['id', 'DESC']]
        //             }),
        //             DiamondMaster.findAll({
        //                 where: {
        //                     id: { [Op.in]: carat !== undefined && carat !== null && carat !== '' ? filteredDiamondMasterIds : diamondMasterIds },
        //                     deleted_at: null
        //                 }
        //             }),
        //             DesignsImages.findAll({
        //                 where: { design_id: { [Op.in]: designIds } }
        //             }),
        //             CutMaster.findAll({
        //                 where: {
        //                     id: { [Op.in]: cutMasterIds }
        //                 }
        //             })
        //         ]);

        //         // Create lookup maps
        //         // For metal rates, get the latest one per metal_rate_id
        //         const metalRatesMap = new Map();
        //         metalRatesList.forEach(mr => {
        //             if (!metalRatesMap.has(mr.id)) {
        //                 metalRatesMap.set(mr.id, mr);
        //             }
        //         });

        //         const diamondRatesMap = new Map(diamondRatesList.map(dr => [dr.id, dr]));
        //         const diamondMastersMap = new Map(diamondMastersList.map(dm => [dm.id, dm]));
        //         const imagesMap = new Map();
        //         const cutMastersMap = new Map(cutMastersList.map(cm => [cm.id, cm]));
        //         const diamondDetailsMap = new Map();

        //         // Group diamond details by design_id
        //         diamondDetailsList.forEach(dd => {
        //             if (!diamondDetailsMap.has(dd.design_id)) {
        //                 diamondDetailsMap.set(dd.design_id, []);
        //             }
        //             diamondDetailsMap.get(dd.design_id).push(dd);
        //         });

        //         // Group images by design_id
        //         imagesList.forEach(img => {
        //             if (!imagesMap.has(img.design_id)) {
        //                 imagesMap.set(img.design_id, []);
        //             }
        //             imagesMap.get(img.design_id).push(img);
        //         });

        //         // Calculate price for each design
        //         const designsWithPrice = designs.map(design => {
        //             const metalRate = metalRatesMap.get(design.metal_rate_id);
        //             const metalWeight = parseFloat(design.metal_weight) || 0;
        //             const ratePerGram = parseFloat(metalRate?.rate) || 0;
        //             // Markup defaults to 1 (no markup) if 0, null, or undefined
        //             const markUpValue = design.mark_up != null ? parseFloat(design.mark_up) : 1;
        //             const markup = markUpValue > 0 ? markUpValue : 1;

        //             // Calculate metal cost
        //             const metalCost = metalWeight * ratePerGram;

        //             // Calculate diamond cost (sum of all diamond details)
        //             const diamondDetails = diamondDetailsMap.get(design.id) || [];
        //             let diamondCost = 0;
        //             const filteredDiamondDetails = [];

        //             diamondDetails.forEach(dd => {
        //                 let diamondRate = diamondRatesMap.get(dd.diamond_rate_id);
        //                 let usedInPriceCalculation = true;

        //                 // If diamond filters are provided, try to use the filtered rate instead
        //                 if (diamondRate) {
        //                     const diamondMaster = diamondMastersMap.get(diamondRate.diamond_master_id);

        //                     // Check if carat filter is provided and if this diamond master matches
        //                     if (carat !== undefined && carat !== null && carat !== '') {
        //                         if (!diamondMaster || !filteredDiamondMasterIds.includes(diamondMaster.id)) {
        //                             // Diamond master doesn't match carat filter
        //                             diamondRate = null;
        //                             usedInPriceCalculation = false;
        //                         }
        //                     }

        //                     // If type/clarity filters are provided or if we're still processing and have filtered rates map
        //                     if (usedInPriceCalculation && (diamondTypeId || clarityId) && filteredDiamondRatesMap.has(diamondMaster?.id)) {
        //                         // Use the filtered rate that matches type/clarity (and optionally carat)
        //                         diamondRate = filteredDiamondRatesMap.get(diamondMaster.id);
        //                     } else if (usedInPriceCalculation && (diamondTypeId || clarityId) && !filteredDiamondRatesMap.has(diamondMaster?.id)) {
        //                         // Filters are active but no matching rate found
        //                         diamondRate = null;
        //                         usedInPriceCalculation = false;
        //                     }
        //                 }

        //                 if (diamondRate && usedInPriceCalculation) {
        //                     const diamondMaster = diamondMastersMap.get(diamondRate.diamond_master_id);
        //                     const diamondSize = parseFloat(diamondMaster?.carat) || 0;
        //                     const diamondRatePerCarat = parseFloat(diamondRate.rate) || 0;
        //                     const diamondPieces = parseInt(dd.pcs) || 0;

        //                     diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
        //                 }

        //                 // Store the diamond detail with the rate used for calculation (always include in response)
        //                 // If no filtered rate found, use original rate for display
        //                 const displayRate = diamondRate || diamondRatesMap.get(dd.diamond_rate_id);
        //                 filteredDiamondDetails.push({
        //                     ...dd,
        //                     calculatedDiamondRate: diamondRate || null,
        //                     displayDiamondRate: displayRate || null,
        //                     usedInPriceCalculation: usedInPriceCalculation && !!diamondRate
        //                 });
        //             });

        //             // Calculate total price using the formula:
        //             // TotalPrice = ((MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat)) × Markup
        //             const totalPrice = (metalCost + diamondCost) * markup;

        //             return {
        //                 design,
        //                 totalPrice,
        //                 metalRate,
        //                 diamondDetails: filteredDiamondDetails,
        //                 images: imagesMap.get(design.id) || []
        //             };
        //         });

        //         // Find design with lowest price
        //         const lowestPriceDesign = designsWithPrice.reduce((min, current) => {
        //             return current.totalPrice < min.totalPrice ? current : min;
        //         });

        //         // Format diamond details for response
        //         const formattedDiamondDetails = lowestPriceDesign.diamondDetails.map(dd => {
        //             const cut = cutMastersMap.get(dd.cut_master_id);
        //             // Use displayDiamondRate if available (shows filtered rate or original), otherwise use calculated or original
        //             const diamondRate = dd.displayDiamondRate || dd.calculatedDiamondRate || diamondRatesMap.get(dd.diamond_rate_id);
        //             const diamondMaster = diamondMastersMap.get(diamondRate?.diamond_master_id);

        //             return {
        //                 id: dd.id,
        //                 cut_id: dd.cut_master_id,
        //                 cut_name: cut?.cut_name || "",
        //                 cut_code: cut?.cut_code || "",
        //                 diamond_rate_id: diamondRate?.id || dd.diamond_rate_id,
        //                 diamond_rate: diamondRate?.rate || 0,
        //                 diamond_carat: diamondMaster?.carat || 0,
        //                 diamond_type_id: diamondRate?.diamond_type_id || null,
        //                 clarity_id: diamondRate?.clarity_id || null,
        //                 pcs: dd.pcs
        //             };
        //         });

        //         // Format response
        //         const responseData = {
        //             id: lowestPriceDesign.design.id,
        //             product_id: lowestPriceDesign.design.product_id,
        //             design_variant_name: lowestPriceDesign.design.design_variant_name,
        //             metal_rate_id: lowestPriceDesign.design.metal_rate_id,
        //             metal_id: lowestPriceDesign.metalRate?.metal_id || null,
        //             karat_id: lowestPriceDesign.metalRate?.karat_id || null,
        //             metal_rate_name: lowestPriceDesign.metalRate ?
        //                 `${lowestPriceDesign.metalRate.metal?.metal_code || ""} - ${lowestPriceDesign.metalRate.karat?.karat || ""}` : "",
        //             metal_rate: lowestPriceDesign.metalRate?.rate || 0,
        //             weight: lowestPriceDesign.design.metal_weight,
        //             mark_up: lowestPriceDesign.design.mark_up,
        //             description: lowestPriceDesign.design.description,
        //             total_price: parseFloat(lowestPriceDesign.totalPrice.toFixed(2)),
        //             diamond_design_detail: formattedDiamondDetails,
        //             images: lowestPriceDesign.images.map(img => ({
        //                 id: img.id,
        //                 image_name: img.image_name
        //             }))
        //         };

        //         return res.status(200).json({
        //             success: true,
        //             message: "Design variant details fetched successfully",
        //             data: responseData
        //         });

        //     } catch (error) {
        //         console.log(error);
        //         logError(error, req);
        //         return res.status(500).json({
        //             success: false,
        //             message: "Internal server error"
        //         });
        //     }
        // },
        variantDetailsForEcom: async (req, res) => {
            try {
                // Validate product_id
                const productId = req.query.product_id || req.body.product_id;
                const designId = req.query.design_id || req.body.design_id;
                const metalId = req.query.metal_id || req.body.metal_id;
                const karatId = req.query.karat_id || req.body.karat_id;
                const diamondTypeId = req.query.diamond_type_id || req.body.diamond_type_id;
                const clarityId = req.query.clarity_id || req.body.clarity_id;
                const carat = req.query.carat || req.body.carat;
                const cutId = req.query.cut_id || req.body.cut_id;

                if (!productId) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide product_id"
                    });
                }

                // Build where clause for design filtering
                const designWhere = { product_id: parseInt(productId) };

                // If design_id is provided, use that specific design
                if (designId) {
                    designWhere.id = parseInt(designId);
                }

                // If metal filters are provided, find matching metal_rate_id first
                let filteredMetalRateId = null;
                let filteredMetalRate = null;
                if (metalId || karatId) {
                    const metalRateWhere = {};
                    if (metalId) metalRateWhere.metal_id = parseInt(metalId);
                    if (karatId) metalRateWhere.karat_id = parseInt(karatId);

                    // Get the latest metal rate matching the filters
                    filteredMetalRate = await MetalRateMaster.findOne({
                        where: metalRateWhere,
                        order: [['date', 'DESC'], ['id', 'DESC']],
                        include: [
                            { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
                            { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
                        ]
                    });

                    if (!filteredMetalRate) {
                        return res.status(404).json({
                            success: false,
                            message: "No metal rate found matching the specified metal and karat combination"
                        });
                    }

                    filteredMetalRateId = filteredMetalRate.id;
                    // Find a design with this metal_rate_id
                    const designWithMetal = await Designs.findOne({
                        where: {
                            product_id: parseInt(productId),
                            metal_rate_id: filteredMetalRateId
                        }
                    });

                    if (designWithMetal) {
                        designWhere.metal_rate_id = filteredMetalRateId;
                    }
                }

                // Fetch design for the product
                let design = null;

                if (designId) {
                    // Fetch specific design by design_id
                    design = await Designs.findOne({
                        where: designWhere,
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
                                attributes: ['id', 'image_name'],
                            },
                            {
                                model: Product,
                                as: 'product',
                                include: [
                                    { model: Category, as: 'category', attributes: ['id', 'category_name', 'category_code', 'image'] },
                                    { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id'] },
                                    { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
                                ]
                            },
                            {
                                model: DesignTranslation,
                                as: 'design_translations',
                                attributes: ['id', 'language_id', 'design_variant_name', 'description'],
                                include: [
                                    { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                                ]
                            }
                        ]
                    });
                } else {
                    // Find all designs for the product and select the one with lowest price
                    const allDesigns = await Designs.findAll({
                        where: { product_id: parseInt(productId) },
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
                                attributes: ['id', 'image_name'],
                            },
                            {
                                model: Product,
                                as: 'product',
                                include: [
                                    { model: Category, as: 'category', attributes: ['id', 'category_name', 'category_code', 'image'] },
                                    { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id'] },
                                    { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
                                ]
                            },
                            {
                                model: DesignTranslation,
                                as: 'design_translations',
                                attributes: ['id', 'language_id', 'design_variant_name', 'description'],
                                include: [
                                    { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                                ]
                            }
                        ]
                    });

                    // Calculate price for each design and find the lowest
                    let lowestPriceDesign = null;
                    let lowestPrice = Infinity;

                    for (const d of allDesigns) {
                        // Metal cost calculation
                        const metalWeight = parseFloat(d.metal_weight) || 0;
                        const ratePerGram = parseFloat(d.metal_rate?.rate) || 0;
                        const metalCost = metalWeight * ratePerGram;

                        // Diamond cost calculation
                        let diamondCost = 0;
                        if (d.diamond_details && d.diamond_details.length > 0) {
                            d.diamond_details.forEach(diamondDetail => {
                                const diamondPieces = parseInt(diamondDetail.pcs) || 0;
                                const diamondSize = parseFloat(diamondDetail.diamond_rate?.diamond_master?.carat) || 0;
                                const diamondRatePerCarat = parseFloat(diamondDetail.diamond_rate?.rate) || 0;
                                diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
                            });
                        }

                        // Markup
                        const markUpValue = d.mark_up != null ? parseFloat(d.mark_up) : 1;
                        const markup = markUpValue > 0 ? markUpValue : 1;

                        // Total price
                        const totalPrice = (metalCost + diamondCost) * markup;

                        if (totalPrice < lowestPrice) {
                            lowestPrice = totalPrice;
                            lowestPriceDesign = d;
                        }
                    }

                    design = lowestPriceDesign;
                }

                if (!design) {
                    return res.status(404).json({
                        success: false,
                        message: "No design found for this product"
                    });
                }

                // Get the metal rate to use for calculation (use filtered one if available, otherwise use design's default)
                let metalRateForCalculation = design.metal_rate;

                // If metal filters are provided, use the filtered metal rate for calculation
                if (filteredMetalRate) {
                    metalRateForCalculation = filteredMetalRate;
                }

                // Calculate total price
                // Formula: TotalPrice = ((MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat)) × Markup

                // Metal cost calculation
                const metalWeight = parseFloat(design.metal_weight) || 0;
                const ratePerGram = parseFloat(metalRateForCalculation?.rate) || 0;
                const metalCost = metalWeight * ratePerGram;

                // Diamond cost calculation (sum of all diamond details)
                // If diamond filters are provided, use filtered rates; otherwise use default rates
                let diamondCost = 0;
                const updatedDiamondDetails = [];

                if (design.diamond_details && design.diamond_details.length > 0) {
                    for (const diamondDetail of design.diamond_details) {
                        // Filter by cut_id if provided
                        if (cutId && parseInt(cutId) !== diamondDetail.cut_master_id) {
                            // Skip this diamond detail if cut doesn't match
                            continue;
                        }

                        let diamondRateToUse = diamondDetail.diamond_rate;
                        let diamondMasterToUse = diamondDetail.diamond_rate?.diamond_master;

                        // If diamond filters are provided, find matching diamond rate
                        if (diamondTypeId || clarityId || carat) {
                            const diamondRateWhere = {
                                deleted_at: null,
                                diamond_master_id: diamondDetail.diamond_rate?.diamond_master_id
                            };

                            if (diamondTypeId) diamondRateWhere.diamond_type_id = parseInt(diamondTypeId);
                            if (clarityId) diamondRateWhere.clarity_id = parseInt(clarityId);

                            // If carat filter is provided, find matching diamond master first
                            if (carat) {
                                const caratValue = parseFloat(carat);
                                const matchingDiamondMaster = await DiamondMaster.findOne({
                                    where: {
                                        carat: caratValue,
                                        deleted_at: null
                                    }
                                });

                                if (matchingDiamondMaster) {
                                    diamondRateWhere.diamond_master_id = matchingDiamondMaster.id;
                                    diamondMasterToUse = matchingDiamondMaster;
                                }
                            }

                            // Find matching diamond rate
                            const matchingDiamondRate = await DiamondRate.findOne({
                                where: diamondRateWhere,
                                include: [
                                    { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
                                ]
                            });

                            if (matchingDiamondRate) {
                                diamondRateToUse = matchingDiamondRate;
                                diamondMasterToUse = matchingDiamondRate.diamond_master || diamondMasterToUse;
                            }
                        }

                        // Calculate diamond cost for this detail
                        if (diamondRateToUse && diamondMasterToUse) {
                            const diamondPieces = parseInt(diamondDetail.pcs) || 0;
                            const diamondSize = parseFloat(diamondMasterToUse.carat) || 0;
                            const diamondRatePerCarat = parseFloat(diamondRateToUse.rate) || 0;

                            diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;

                            // Store updated diamond detail with filtered rate
                            const detailJson = diamondDetail.toJSON ? diamondDetail.toJSON() : diamondDetail;
                            const rateJson = diamondRateToUse.toJSON ? diamondRateToUse.toJSON() : diamondRateToUse;
                            const masterJson = diamondMasterToUse.toJSON ? diamondMasterToUse.toJSON() : diamondMasterToUse;

                            updatedDiamondDetails.push({
                                ...detailJson,
                                diamond_rate: {
                                    ...rateJson,
                                    diamond_master: masterJson
                                }
                            });
                        } else {
                            // Keep original if no filtered rate found
                            updatedDiamondDetails.push(diamondDetail.toJSON ? diamondDetail.toJSON() : diamondDetail);
                        }
                    }
                }

                // Markup - default to 1 if 0, null, or undefined
                const markUpValue = design.mark_up != null ? parseFloat(design.mark_up) : 1;
                const markup = markUpValue > 0 ? markUpValue : 1;

                // Total price calculation
                const totalPrice = (metalCost + diamondCost) * markup;

                // Convert design to JSON to add computed field
                const designData = design.toJSON ? design.toJSON() : design;

                // Update metal_rate if filtered one was used
                if (filteredMetalRate) {
                    designData.metal_rate = metalRateForCalculation.toJSON ? metalRateForCalculation.toJSON() : metalRateForCalculation;
                    designData.metal_rate_id = filteredMetalRateId;
                }

                // Update diamond_details if filtered
                if (updatedDiamondDetails.length > 0) {
                    designData.diamond_details = updatedDiamondDetails;
                }

                // Construct full image URLs for images
                if (designData.images && Array.isArray(designData.images)) {
                    designData.images = designData.images.map(img => ({
                        id: img.id,
                        image_name: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design')
                    }));
                }

                designData.total_price = "€ " + parseFloat(totalPrice.toFixed(2));

                return res.status(200).json({
                    success: true,
                    message: "Design variant details fetched successfully",
                    data: designData
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        filterDropdownsEcom: async (req, res) => {
            try {
                const languageId = req.query.language_id || req.body.language_id;
                const productId = req.query.product_id || req.body.product_id;

                // Build product filter - only active products (is_display = 1)
                const productWhere = {
                    is_display: 1
                };

                // If product_id is provided, filter by specific product
                if (productId) {
                    productWhere.id = parseInt(productId);
                }

                // First, fetch active products
                const products = await Product.findAll({
                    where: productWhere,
                    attributes: ['id']
                });

                if (products.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Filter dropdowns fetched successfully",
                        data: {
                            cuts: [],
                            diamond_types: [],
                            clarities: [],
                            carats: [],
                            metals: [],
                            karats: [],
                            ring_sizes: []
                        }
                    });
                }

                const productIds = products.map(p => p.id);

                // Fetch all designs for these products with their related data
                const designs = await Designs.findAll({
                    where: {
                        product_id: { [Op.in]: productIds }
                    },
                    include: [
                        {
                            model: MetalRateMaster,
                            as: 'metal_rate',
                            attributes: ['id', 'metal_id', 'karat_id'],
                            include: [
                                { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] },
                                { model: Karat, as: 'karat', attributes: ['id', 'karat'] }
                            ]
                        },
                        {
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            attributes: ['id', 'cut_master_id', 'diamond_rate_id'],
                            include: [
                                {
                                    model: DiamondRate,
                                    as: 'diamond_rate',
                                    attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id'],
                                    where: {
                                        deleted_at: null
                                    },
                                    required: false,
                                    include: [
                                        {
                                            model: DiamondMaster,
                                            as: 'diamond_master',
                                            attributes: ['id', 'carat'],
                                            where: {
                                                deleted_at: null
                                            },
                                            required: false
                                        },
                                        {
                                            model: DiamondType,
                                            as: 'diamond_type',
                                            attributes: ['id', 'type_name', 'type_code']
                                        },
                                        {
                                            model: DiamondClarity,
                                            as: 'clarity',
                                            attributes: ['id', 'clarity']
                                        }
                                    ]
                                },
                                {
                                    model: CutMaster,
                                    as: 'cut_master',
                                    attributes: ['id', 'cut_name', 'cut_code', 'cut_image']
                                }
                            ]
                        }
                    ]
                });

                // Extract unique IDs from available designs
                const cutIds = new Set();
                const diamondTypeIds = new Set();
                const clarityIds = new Set();
                const diamondMasterIds = new Set();
                const metalIds = new Set();
                const karatIds = new Set();

                // Store actual objects for quick lookup
                const cutMap = new Map();
                const diamondTypeMap = new Map();
                const clarityMap = new Map();
                const diamondMasterMap = new Map();
                const metalMap = new Map();
                const karatMap = new Map();

                designs.forEach(design => {
                    // Extract metal and karat from metal_rate
                    if (design.metal_rate) {
                        if (design.metal_rate.metal_id) {
                            metalIds.add(design.metal_rate.metal_id);
                            if (design.metal_rate.metal) {
                                metalMap.set(design.metal_rate.metal.id, design.metal_rate.metal);
                            }
                        }
                        if (design.metal_rate.karat_id) {
                            karatIds.add(design.metal_rate.karat_id);
                            if (design.metal_rate.karat) {
                                karatMap.set(design.metal_rate.karat.id, design.metal_rate.karat);
                            }
                        }
                    }

                    // Extract diamond-related data from diamond_details
                    if (design.diamond_details && design.diamond_details.length > 0) {
                        design.diamond_details.forEach(detail => {
                            // Extract cut
                            if (detail.cut_master_id) {
                                cutIds.add(detail.cut_master_id);
                                if (detail.cut_master) {
                                    cutMap.set(detail.cut_master.id, detail.cut_master);
                                }
                            }

                            // Extract diamond rate data
                            if (detail.diamond_rate) {
                                if (detail.diamond_rate.diamond_type_id) {
                                    diamondTypeIds.add(detail.diamond_rate.diamond_type_id);
                                    if (detail.diamond_rate.diamond_type) {
                                        diamondTypeMap.set(detail.diamond_rate.diamond_type.id, detail.diamond_rate.diamond_type);
                                    }
                                }
                                if (detail.diamond_rate.clarity_id) {
                                    clarityIds.add(detail.diamond_rate.clarity_id);
                                    if (detail.diamond_rate.clarity) {
                                        clarityMap.set(detail.diamond_rate.clarity.id, detail.diamond_rate.clarity);
                                    }
                                }
                                if (detail.diamond_rate.diamond_master_id) {
                                    diamondMasterIds.add(detail.diamond_rate.diamond_master_id);
                                    if (detail.diamond_rate.diamond_master) {
                                        diamondMasterMap.set(detail.diamond_rate.diamond_master.id, detail.diamond_rate.diamond_master);
                                    }
                                }
                            }
                        });
                    }
                });

                // Fetch master data only for IDs that exist in designs
                const [
                    cutMasters,
                    diamondTypes,
                    diamondClarities,
                    diamondCarats,
                    metals,
                    karats
                ] = await Promise.all([
                    // Diamond Cut options - only those used in designs
                    cutIds.size > 0 ? CutMaster.findAll({
                        where: { id: { [Op.in]: Array.from(cutIds) } },
                        attributes: ['id', 'cut_name', 'cut_code', 'cut_image'],
                        order: [['id', 'ASC']]
                    }) : [],
                    // Diamond Type/Quality - only those used in designs
                    diamondTypeIds.size > 0 ? DiamondType.findAll({
                        where: { id: { [Op.in]: Array.from(diamondTypeIds) } },
                        attributes: ['id', 'type_name', 'type_code'],
                        order: [['id', 'ASC']]
                    }) : [],
                    // Diamond Clarity - only those used in designs
                    clarityIds.size > 0 ? DiamondClarity.findAll({
                        where: { id: { [Op.in]: Array.from(clarityIds) } },
                        attributes: ['id', 'clarity'],
                        order: [['id', 'ASC']]
                    }) : [],
                    // Diamond Carat weights - only those used in designs
                    diamondMasterIds.size > 0 ? DiamondMaster.findAll({
                        where: { 
                            id: { [Op.in]: Array.from(diamondMasterIds) },
                            deleted_at: null
                        },
                        attributes: ['id', 'carat'],
                        order: [['carat', 'ASC']]
                    }) : [],
                    // Metal Colors - only those used in designs
                    metalIds.size > 0 ? Metal.findAll({
                        where: { 
                            id: { [Op.in]: Array.from(metalIds) },
                            deleted_at: null
                        },
                        attributes: ['id', 'metal_name', 'metal_code'],
                        order: [['id', 'ASC']]
                    }) : [],
                    // Metal Karat types - only those used in designs
                    karatIds.size > 0 ? Karat.findAll({
                        where: { id: { [Op.in]: Array.from(karatIds) } },
                        attributes: ['id', 'karat'],
                        order: [['id', 'ASC']]
                    }) : []
                ]);

                // Fetch translations if language_id is provided
                let diamondTypeTranslationsMap = new Map();
                let metalTranslationsMap = new Map();

                if (languageId) {
                    const translationPromises = [];

                    if (diamondTypeIds.size > 0) {
                        translationPromises.push(
                            DiamondTypeTranslation.findAll({
                                where: {
                                    language_id: parseInt(languageId),
                                    diamond_type_id: { [Op.in]: Array.from(diamondTypeIds) }
                                },
                                attributes: ['diamond_type_id', 'diamond_type_name']
                            })
                        );
                    } else {
                        translationPromises.push(Promise.resolve([]));
                    }

                    if (metalIds.size > 0) {
                        translationPromises.push(
                            MetalTranslation.findAll({
                                where: {
                                    language_id: parseInt(languageId),
                                    metal_id: { [Op.in]: Array.from(metalIds) }
                                },
                                attributes: ['metal_id', 'metal_name']
                            })
                        );
                    } else {
                        translationPromises.push(Promise.resolve([]));
                    }

                    const [
                        diamondTypeTranslations,
                        metalTranslations
                    ] = await Promise.all(translationPromises);

                    // Create maps for quick lookup
                    diamondTypeTranslations.forEach(trans => {
                        diamondTypeTranslationsMap.set(trans.diamond_type_id, trans.diamond_type_name);
                    });

                    metalTranslations.forEach(trans => {
                        metalTranslationsMap.set(trans.metal_id, trans.metal_name);
                    });
                }

                // Standard ring sizes (since there's no model for this)
                const ringSizes = [
                    { id: 1, size: "US 4", value: "4" },
                    { id: 2, size: "US 4.5", value: "4.5" },
                    { id: 3, size: "US 5", value: "5" },
                    { id: 4, size: "US 5.5", value: "5.5" },
                    { id: 5, size: "US 6", value: "6" },
                    { id: 6, size: "US 6.5", value: "6.5" },
                    { id: 7, size: "US 7", value: "7" },
                    { id: 8, size: "US 7.5", value: "7.5" },
                    { id: 9, size: "US 8", value: "8" },
                    { id: 10, size: "US 8.5", value: "8.5" },
                    { id: 11, size: "US 9", value: "9" },
                    { id: 12, size: "US 9.5", value: "9.5" },
                    { id: 13, size: "US 10", value: "10" },
                    { id: 14, size: "US 10.5", value: "10.5" },
                    { id: 15, size: "US 11", value: "11" },
                    { id: 16, size: "US 11.5", value: "11.5" },
                    { id: 17, size: "US 12", value: "12" }
                ];

                // Format response with translations (fallback to default if translation not available)
                const responseData = {
                    cuts: cutMasters.map(cut => ({
                        id: cut.id,
                        name: cut.cut_name,
                        code: cut.cut_code,
                        image: cut.cut_image
                    })),
                    diamond_types: diamondTypes.map(type => ({
                        id: type.id,
                        name: diamondTypeTranslationsMap.has(type.id)
                            ? diamondTypeTranslationsMap.get(type.id)
                            : type.type_name,
                        code: type.type_code
                    })),
                    clarities: diamondClarities.map(clarity => ({
                        id: clarity.id,
                        name: clarity.clarity
                    })),
                    carats: diamondCarats.map(carat => ({
                        id: carat.id,
                        carat: parseFloat(carat.carat) || 0
                    })),
                    metals: metals.map(metal => ({
                        id: metal.id,
                        name: metalTranslationsMap.has(metal.id)
                            ? metalTranslationsMap.get(metal.id)
                            : metal.metal_name,
                        code: metal.metal_code
                    })),
                    karats: karats.map(karat => ({
                        id: karat.id,
                        karat: karat.karat
                    })),
                    ring_sizes: ringSizes
                };

                return res.status(200).json({
                    success: true,
                    message: "Filter dropdowns fetched successfully",
                    data: responseData
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
    };
};
module.exports = designController;
