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
const { Op } = require("sequelize");

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

                designData.total_price = parseFloat(totalPrice.toFixed(2)) + " €";

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
    };
};
module.exports = designController;
