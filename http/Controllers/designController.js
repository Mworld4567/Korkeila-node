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
const GoldColor = require("../../Models/GoldColor");
const Product = require("../../Models/Product");
const MetalRateMaster = require("../../Models/MetalRateMaster");
const DiamondRate = require("../../Models/DiamondRate");
const SubCategory = require("../../Models/SubCategory");

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
                    where: { design_id: { [Op.in]: designIds } }
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
                        where: { id: { [Op.in]: allDiamondRateIds } }
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
                        return {
                            id: dd.id,
                            cut_id: dd.cut_master_id,
                            cut_name: cut?.cut_name || "",
                            diamond_rate_id: dd.diamond_rate_id,
                            pcs: dd.pcs,
                        };
                    });

                    return {
                        id: design.id,
                        product_id: design.product_id,
                        product_name: design.design_variant_name,
                        metal_rate_id: design.metal_rate_id,
                        metal_rate_name: metalRate ? `${metalRate.metal?.metal_code || ""} - ${metalRate.karat?.karat || ""}` : "",
                        weight: design.metal_weight,
                        mark_up: design.mark_up,
                        description: design.description,
                        diamond_rate_id: design.diamond_rate_id,
                        diamond_design_detail: formattedDiamondDetails,
                        images: images.map(img => ({
                            id: img.id,
                            image_name: img.image_name
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
                    diamond_rate_id: parseInt(firstDiamondRateId), // Use first diamond_rate_id as required field
                    metal_weight: parseFloat(req.body.weight),
                    mark_up: req.body.mark_up && req.body.mark_up !== "" ? parseFloat(req.body.mark_up) : 0,
                    description: req.body.description || null,
                };

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

                // Prepare response data
                const responseData = {
                    id: design.id,
                    product_id: design.product_id,
                    product_name: design.design_variant_name,
                    metal_rate_id: design.metal_rate_id,
                    metal_rate_name: req.body.metal_rate_name || "",
                    weight: design.metal_weight,
                    mark_up: design.mark_up,
                    description: design.description,
                    diamond_design_detail: req.body.diamond_design_detail.map(detail => ({
                        cut_id: detail.cut_id,
                        cut_code: detail.cut_code || "",
                        diamond_rate_id: detail.diamond_rate_id,
                        diamond_rate_name: detail.diamond_rate_name || "",
                        pcs: detail.pcs,
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
    };
};
module.exports = designController;
