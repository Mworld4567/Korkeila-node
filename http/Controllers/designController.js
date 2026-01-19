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
const csvtojson = require("csvtojson");
const fs = require("fs");
const { getS3Object, deleteFromBucket, saveToBucket, getPresignedUrl } = require("../middlewares/awsS3Middleware");
const { priceFlag, filterAvailable, languageId, priceMessages, categoryId } = require("../../config/globalVariable");
const converter = require("json-2-csv");
const CategoryTranslation = require("../../Models/CategoryTranslation");

const designController = () => {
    return {
        read: async (req, res) => {
            try {
                const { Op } = require("sequelize");

                // Get pagination parameters from query
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 1000;
                const offset = (page - 1) * limit;

                // Get search parameter from query
                const searchTerm = req.query.search ? req.query.search.trim() : null;

                // Build search conditions
                let whereCondition = {};
                let matchingDesignIds = null;

                if (searchTerm) {
                    const searchPattern = `%${searchTerm}%`;
                    const numericSearch = parseFloat(searchTerm);
                    const isNumeric = !isNaN(numericSearch);

                    // Collect all design IDs that match the search criteria
                    const matchingIds = new Set();

                    // Search in direct fields on Designs table
                    const directMatches = await Designs.findAll({
                        where: {
                            [Op.or]: [
                                { design_variant_name: { [Op.like]: searchPattern } },
                                { metal_weight: isNumeric ? { [Op.eq]: numericSearch } : { [Op.like]: searchPattern } },
                                { mark_up: isNumeric ? { [Op.eq]: numericSearch } : { [Op.like]: searchPattern } }
                            ]
                        },
                        attributes: ['id']
                    });
                    directMatches.forEach(d => matchingIds.add(d.id));

                    // Search in DesignTranslation for design_variant_name
                    const translationMatches = await DesignTranslation.findAll({
                        where: {
                            design_variant_name: { [Op.like]: searchPattern },
                            language_id: languageId.English
                        },
                        attributes: ['design_id']
                    });
                    translationMatches.forEach(t => matchingIds.add(t.design_id));

                    // Search in MetalRateMaster for metal_rate_name
                    // First, find matching metals and karats
                    const matchingMetals = await Metal.findAll({
                        where: { metal_name: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    const matchingKarats = await Karat.findAll({
                        where: { karat: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    
                    const metalIds = matchingMetals.map(m => m.id);
                    const karatIds = matchingKarats.map(k => k.id);
                    
                    // Find metal rates that match
                    const metalRateWhere = {};
                    if (metalIds.length > 0 || karatIds.length > 0) {
                        metalRateWhere[Op.or] = [];
                        if (metalIds.length > 0) {
                            metalRateWhere[Op.or].push({ metal_id: { [Op.in]: metalIds } });
                        }
                        if (karatIds.length > 0) {
                            metalRateWhere[Op.or].push({ karat_id: { [Op.in]: karatIds } });
                        }
                    }
                    
                    if (metalIds.length > 0 || karatIds.length > 0) {
                        const metalRateMatches = await MetalRateMaster.findAll({
                            where: metalRateWhere,
                            attributes: ['id']
                        });
                        const metalRateIds = metalRateMatches.map(mr => mr.id);
                        if (metalRateIds.length > 0) {
                            const designsWithMetalRate = await Designs.findAll({
                                where: { metal_rate_id: { [Op.in]: metalRateIds } },
                                attributes: ['id']
                            });
                            designsWithMetalRate.forEach(d => matchingIds.add(d.id));
                        }
                    }

                    // Search in DesignsDiamondDetails for diamond_design_detail
                    // First, find matching cut masters, diamond masters, diamond types, and clarities
                    const matchingCuts = await CutMaster.findAll({
                        where: { cut_name: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    const matchingDiamondMasters = await DiamondMaster.findAll({
                        where: isNumeric ? { carat: numericSearch } : { carat: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    const matchingDiamondTypes = await DiamondType.findAll({
                        where: { type_name: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    const matchingClarities = await DiamondClarity.findAll({
                        where: { clarity: { [Op.like]: searchPattern } },
                        attributes: ['id']
                    });
                    
                    const cutIds = matchingCuts.map(c => c.id);
                    const diamondMasterIds = matchingDiamondMasters.map(dm => dm.id);
                    const diamondTypeIds = matchingDiamondTypes.map(dt => dt.id);
                    const clarityIds = matchingClarities.map(c => c.id);
                    
                    // Find diamond rates that match
                    const diamondRateWhere = {};
                    if (diamondMasterIds.length > 0 || diamondTypeIds.length > 0 || clarityIds.length > 0) {
                        diamondRateWhere[Op.or] = [];
                        if (diamondMasterIds.length > 0) {
                            diamondRateWhere[Op.or].push({ diamond_master_id: { [Op.in]: diamondMasterIds } });
                        }
                        if (diamondTypeIds.length > 0) {
                            diamondRateWhere[Op.or].push({ diamond_type_id: { [Op.in]: diamondTypeIds } });
                        }
                        if (clarityIds.length > 0) {
                            diamondRateWhere[Op.or].push({ clarity_id: { [Op.in]: clarityIds } });
                        }
                    }
                    
                    const diamondRateIds = [];
                    if (diamondMasterIds.length > 0 || diamondTypeIds.length > 0 || clarityIds.length > 0) {
                        const matchingDiamondRates = await DiamondRate.findAll({
                            where: diamondRateWhere,
                            attributes: ['id']
                        });
                        matchingDiamondRates.forEach(dr => diamondRateIds.push(dr.id));
                    }
                    
                    // Find diamond details that match
                    const diamondDetailWhere = {};
                    if (cutIds.length > 0 || diamondRateIds.length > 0) {
                        diamondDetailWhere[Op.or] = [];
                        if (cutIds.length > 0) {
                            diamondDetailWhere[Op.or].push({ cut_master_id: { [Op.in]: cutIds } });
                        }
                        if (diamondRateIds.length > 0) {
                            diamondDetailWhere[Op.or].push({ diamond_rate_id: { [Op.in]: diamondRateIds } });
                        }
                    }
                    
                    if (cutIds.length > 0 || diamondRateIds.length > 0) {
                        const diamondDetailsMatches = await DesignsDiamondDetails.findAll({
                            where: diamondDetailWhere,
                            attributes: ['design_id']
                        });
                        diamondDetailsMatches.forEach(dd => matchingIds.add(dd.design_id));
                    }

                    matchingDesignIds = Array.from(matchingIds);
                    
                    if (matchingDesignIds.length === 0) {
                        return res.status(200).json({
                            success: true,
                            message: "Designs fetched successfully",
                            data: [],
                            total_count: 0,
                            total_pages: 0,
                            current_page: page,
                            limit: limit,
                        });
                    }

                    whereCondition = {
                        id: { [Op.in]: matchingDesignIds }
                    };
                }

                // For search, we need to fetch all matching designs first, then filter and paginate
                // This ensures correct pagination when filtering by calculated fields
                let allMatchingDesigns = [];
                let totalMatchingCount = 0;
                let usePostFilterPagination = false;

                if (searchTerm && matchingDesignIds) {
                    // Fetch all matching designs (without pagination limit)
                    // We'll filter and paginate after building response data
                    allMatchingDesigns = await Designs.findAll({
                        where: whereCondition,
                        order: [['id', 'DESC']]
                    });
                    totalMatchingCount = allMatchingDesigns.length;
                    usePostFilterPagination = true;
                } else {
                    // No search - use normal pagination
                    const result = await Designs.findAndCountAll({
                        where: whereCondition,
                        order: [['id', 'DESC']],
                        limit: limit,
                        offset: offset
                    });
                    allMatchingDesigns = result.rows;
                    totalMatchingCount = result.count;
                    usePostFilterPagination = false;
                }

                // If no designs found, return early
                if (allMatchingDesigns.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Designs fetched successfully",
                        data: [],
                        total_count: 0,
                        total_pages: 0,
                        current_page: page,
                        limit: limit,
                    });
                }

                // Use all matching designs for building response
                const designs = allMatchingDesigns;

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
                    cutMastersList,
                    designTranslationsList
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
                    }),
                    DesignTranslation.findAll({
                        where: { 
                            design_id: { [Op.in]: designIds },
                            language_id: languageId.English
                        },
                        include: [
                            { model: Language, as: 'language', attributes: ['id', 'language_name'] }
                        ]
                    })
                ]);

                // Create lookup maps for efficient data retrieval
                const productsMap = new Map(productsList.map(p => [p.id, p]));
                const categoriesMap = new Map(categoriesList.map(c => [c.id, c]));
                const subCategoriesMap = new Map(subCategoriesList.map(sc => [sc.id, sc]));
                const metalRatesMap = new Map(metalRatesList.map(mr => [mr.id, mr]));
                const diamondRatesMap = new Map(diamondRatesList.map(dr => [dr.id, dr]));
                const cutMastersMap = new Map(cutMastersList.map(cm => [cm.id, cm]));
                const designTranslationsMap = new Map(designTranslationsList.map(dt => [dt.design_id, dt]));
                const diamondDetailsMap = new Map();
                const imagesMap = new Map();

                // Group diamond details by design_id
                diamondDetailsList.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd);
                });

                    // Group images by design_id and sort by order
                imagesList.forEach(img => {
                    if (!imagesMap.has(img.design_id)) {
                        imagesMap.set(img.design_id, []);
                    }
                    imagesMap.get(img.design_id).push(img);
                });
                
                // Sort images by order within each design
                imagesMap.forEach((images, designId) => {
                    images.sort((a, b) => (a.order || 0) - (b.order || 0));
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
                            is_center: dd.is_center || 0,
                        };
                    });

                    // Calculate total price
                    // Formula: TotalPrice = (MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat) × Markup
                    const metalWeight = parseFloat(design.metal_weight) || 0;
                    const ratePerGram = parseFloat(metalRate?.rate) || 0;
                    const metalCost = metalWeight * ratePerGram;

                    // Diamond cost calculation (sum of all diamond details)
                    let diamondCost = 0;
                    if (diamondDetails && diamondDetails.length > 0) {
                        diamondDetails.forEach(diamondDetail => {
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

                    // For admin side: Use database price for price_flag == 2 or 4, otherwise use calculated price
                    // Parse price_flag to handle both string and number types
                    const priceFlagValue = parseInt(design.price_flag) || 0;
                    const designPrice = parseFloat(design.price) || 0;

                    let displayPrice = calculatedPrice; // Default to calculated price
                    if (priceFlagValue === 2 || priceFlagValue === 4) {
                        // For price_flag == 2 or 4, use database price field (no formatted messages for admin)
                        displayPrice = designPrice;
                    }

                    // Get English design translation
                    const englishTranslation = designTranslationsMap.get(design.id);

                    // Count images (order 1-4) and video (order 5)
                    const imageCount = images.filter(img => img.order >= 1 && img.order <= 4).length;
                    const videoCount = images.filter(img => img.order === 5).length;
                    const imageText = imageCount === 1 ? "image" : "images";
                    const image_count = `${imageCount} ${imageText}, ${videoCount} video`;

                    return {
                        id: design.id,
                        product_id: design.product_id,
                        product_name: design.design_variant_name,
                        design_variant_name: englishTranslation?.design_variant_name || null,
                        metal_rate_id: design.metal_rate_id,
                        metal_rate_name: metalRate ? `${metalRate.metal?.metal_name || ""} - ${metalRate.karat?.karat || ""}` : "",
                        weight: design.metal_weight,
                        mark_up: design.mark_up,
                        diamond_rate_id: design.diamond_rate_id,
                        diamond_design_detail: formattedDiamondDetails,
                        images: images.map(img => ({
                            id: img.id,
                            image: img.image_name,
                            image_url: constructImageUrl(img.image_name, 'design'),
                            order: img.order,
                            is_product_listing: img.is_product_listing,
                        })),
                        image_count: image_count,
                        total_price: "€ " + Math.round(displayPrice),
                        _total_price_numeric: Math.round(displayPrice) // Store numeric value for filtering
                    };
                });

                // Filter by calculated fields and verify search matches
                let filteredResponseData = responseData;
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const numericSearch = parseFloat(searchTerm);
                    const isNumeric = !isNaN(numericSearch);

                    filteredResponseData = responseData.filter(item => {
                        // Check design_variant_name
                        const matchesDesignVariantName = item.design_variant_name && 
                            item.design_variant_name.toLowerCase().includes(searchLower);
                        
                        // Check product_name
                        const matchesProductName = item.product_name && 
                            item.product_name.toLowerCase().includes(searchLower);
                        
                        // Check metal_rate_name
                        const matchesMetalRateName = item.metal_rate_name && 
                            item.metal_rate_name.toLowerCase().includes(searchLower);
                        
                        // Check weight
                        const matchesWeight = isNumeric ? 
                            parseFloat(item.weight) === numericSearch : 
                            String(item.weight).toLowerCase().includes(searchLower);
                        
                        // Check mark_up
                        const matchesMarkUp = isNumeric ? 
                            parseFloat(item.mark_up) === numericSearch : 
                            String(item.mark_up).toLowerCase().includes(searchLower);
                        
                        // Check total_price (numeric value)
                        const matchesTotalPrice = isNumeric && 
                            item._total_price_numeric === numericSearch;
                        
                        // Check diamond_design_detail
                        const matchesDiamondDetail = item.diamond_design_detail && 
                            item.diamond_design_detail.some(dd => {
                                const cutNameMatch = dd.cut_name && 
                                    dd.cut_name.toLowerCase().includes(searchLower);
                                const diamondRateNameMatch = dd.diamond_rate_name && 
                                    dd.diamond_rate_name.toLowerCase().includes(searchLower);
                                return cutNameMatch || diamondRateNameMatch;
                            });

                        return matchesDesignVariantName || matchesProductName || 
                               matchesMetalRateName || matchesWeight || 
                               matchesMarkUp || matchesTotalPrice || matchesDiamondDetail;
                    });
                }

                // Remove the temporary _total_price_numeric field
                filteredResponseData = filteredResponseData.map(item => {
                    const { _total_price_numeric, ...rest } = item;
                    return rest;
                });

                // Apply pagination to filtered results (only if search was used)
                let finalCount, paginatedData, finalTotalPages;
                if (usePostFilterPagination) {
                    // Search was used - apply pagination to filtered results
                    finalCount = filteredResponseData.length;
                    paginatedData = filteredResponseData.slice(offset, offset + limit);
                    finalTotalPages = Math.ceil(finalCount / limit);
                } else {
                    // No search - data is already paginated from database
                    finalCount = totalMatchingCount;
                    paginatedData = filteredResponseData;
                    finalTotalPages = Math.ceil(finalCount / limit);
                }

                return res.status(200).json({
                    success: true,
                    message: "Designs fetched successfully",
                    data: paginatedData,
                    total_count: finalCount,
                    total_pages: finalTotalPages,
                    current_page: page,
                    limit: limit,
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
                    return res.status(409).json({
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
                        where: { design_id: design.id },
                        separate: true,
                        order: [['order', 'ASC']]
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
                        is_center: dd.is_center || 0,
                        position_visible: dd.position_visible || 0,
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
                    is_filter_available: design.is_filter_available,
                    price_flag: design.price_flag,
                    // price: design.price,
                    // pricing_message: design.pricing_message,
                    sku_number: design.sku_number,
                    images: imagesList.map(img => ({
                        id: img.id,
                        image: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design'),
                        order: img.order,
                        is_product_listing: img.is_product_listing,
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
        getRelatedVariantImages: async (req, res) => {
            try {
                // Validate required query parameters
                if (!req.query.product_id || req.query.product_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please provide product ID",
                    });
                }

                if (!req.query.metal_rate_id || req.query.metal_rate_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please provide metal rate ID",
                    });
                }

                const productId = parseInt(req.query.product_id);
                const metalRateId = parseInt(req.query.metal_rate_id);

                // Fetch metal_rate_masters to get metal_id and karat_id
                const currentMetalRate = await MetalRateMaster.findByPk(metalRateId);

                if (!currentMetalRate) {
                    return res.status(404).json({
                        success: false,
                        message: "Metal rate not found",
                    });
                }

                const currentMetalId = currentMetalRate.metal_id;
                const currentKaratId = currentMetalRate.karat_id;

                // Find all other metal_rate_ids with same metal_id but different karat_id
                const relatedMetalRates = await MetalRateMaster.findAll({
                    where: {
                        metal_id: currentMetalId,
                        karat_id: { [Op.ne]: currentKaratId }
                    },
                    attributes: ['id'],
                });

                if (relatedMetalRates.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "No related variants found",
                        data: {
                            images: [],
                            hasExistingImages: false
                        },
                    });
                }

                const relatedMetalRateIds = relatedMetalRates.map(mr => mr.id);

                // Parse optional cut_ids from query (for diamond designs)
                let cutIds = null;
                if (req.query.cut_ids) {
                    try {
                        cutIds = JSON.parse(req.query.cut_ids);
                        if (!Array.isArray(cutIds)) cutIds = null;
                    } catch (e) {
                        cutIds = null;
                    }
                }

                // Find designs with same product_id and related metal_rate_ids
                let relatedDesigns = await Designs.findAll({
                    where: {
                        product_id: productId,
                        metal_rate_id: { [Op.in]: relatedMetalRateIds }
                    },
                    attributes: ['id'],
                    order: [['id', 'DESC']]
                });

                // If cut_ids are provided, filter designs by matching cut_master_id(s)
                // Cut must match, but diamond_rate_id (clarity/type/carat) doesn't matter
                if (cutIds && cutIds.length > 0 && relatedDesigns.length > 0) {
                    const relatedDesignIds = relatedDesigns.map(d => d.id);

                    // Get diamond details for all related designs
                    const allDiamondDetails = await DesignsDiamondDetails.findAll({
                        where: {
                            design_id: { [Op.in]: relatedDesignIds }
                        },
                        attributes: ['design_id', 'cut_master_id'],
                    });

                    // Group by design_id and get unique cut_master_ids
                    const designCutsMap = new Map();
                    allDiamondDetails.forEach(detail => {
                        if (!designCutsMap.has(detail.design_id)) {
                            designCutsMap.set(detail.design_id, new Set());
                        }
                        designCutsMap.get(detail.design_id).add(detail.cut_master_id);
                    });

                    // Sort current cut_ids for comparison
                    const currentCutIds = [...new Set(cutIds.map(id => parseInt(id)))].sort((a, b) => a - b);

                    // Filter designs that have matching cut_master_id(s)
                    const matchingDesignIds = [];
                    designCutsMap.forEach((cutSet, designId) => {
                        const designCutIds = Array.from(cutSet).sort((a, b) => a - b);
                        // Check if cuts match (same set of cut_ids)
                        if (currentCutIds.length === designCutIds.length &&
                            currentCutIds.every((id, idx) => id === designCutIds[idx])) {
                            matchingDesignIds.push(designId);
                        }
                    });

                    if (matchingDesignIds.length > 0) {
                        relatedDesigns = relatedDesigns.filter(d => matchingDesignIds.includes(d.id));
                    } else {
                        relatedDesigns = [];
                    }
                }

                if (relatedDesigns.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "No related variants found",
                        data: {
                            images: [],
                            hasExistingImages: false
                        },
                    });
                }

                // Get images from the first related design
                const relatedDesignId = relatedDesigns[0].id;
                const relatedImages = await DesignsImages.findAll({
                    where: { design_id: relatedDesignId },
                    order: [['order', 'ASC']]
                });

                const formattedImages = relatedImages.map(img => ({
                    id: img.id,
                    image: img.image_name,
                    image_url: constructImageUrl(img.image_name, 'design'),
                    order: img.order,
                    is_product_listing: img.is_product_listing,
                }));

                return res.status(200).json({
                    success: true,
                    message: "Related variant images fetched successfully",
                    data: {
                        images: formattedImages,
                        hasExistingImages: formattedImages.length > 0
                    },
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
                    return res.status(500).json({
                        success: false,
                        message: "Please enter product ID",
                    });
                }

                if (!req.body.product_name || req.body.product_name === "") {
                    return res.status(500).json({
                        success: false,
                        message: "Please enter product name",
                    });
                }

                if (!req.body.metal_rate_id || req.body.metal_rate_id === "") {
                    return res.status(500).json({
                        success: false,
                        message: "Please enter metal rate ID",
                    });
                }

                if (!req.body.weight || req.body.weight === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter weight",
                    });
                }

                // Parse diamond_design_detail if it's a JSON string (when sent as form-data)
                if (req.body.diamond_design_detail && typeof req.body.diamond_design_detail === 'string') {
                        req.body.diamond_design_detail = JSON.parse(req.body.diamond_design_detail);
                }

                // if (!req.body.diamond_design_detail || !Array.isArray(req.body.diamond_design_detail) || req.body.diamond_design_detail.length === 0) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please provide diamond design details",
                //     });
                // }

                // Fetch product to get category_id and sub_category_id
                const product = await Product.findByPk(req.body.product_id, { transaction });
                if (!product) {
                    return res.status(500).json({
                        success: false,
                        message: "Product not found",
                    });
                }

                // Get first diamond_rate_id from diamond_design_detail for the Designs table (required field)
                const firstDiamondRateId = req.body.diamond_design_detail[0]?.diamond_rate_id;
                // if (firstDiamondRateId) {
                    
                // }

                // Prepare design data
                const productId = parseInt(req.body.product_id);

                // Validate: If design has only 1 diamond detail, position_visible must be 1
                if (req.body.diamond_design_detail && req.body.diamond_design_detail.length === 1) {
                    req.body.diamond_design_detail[0].position_visible = 1;
                }

                // Determine is_filter_available based on diamond details count (matching CSV update logic)
                let isFilterAvailable;
                if (productId === 55) {
                    isFilterAvailable = filterAvailable.TheFlowerType; // 4
                } else if (categoryId.Bracelets === product.category_id) {
                    isFilterAvailable = filterAvailable.PendantsAndNecklacesAndBraceletsAndEarrings; // 3
                } else if (req.body.diamond_design_detail.length === 0) {
                    isFilterAvailable = filterAvailable.NoDiamond;
                } else if (req.body.diamond_design_detail.length === 1) {
                    isFilterAvailable = filterAvailable.SingleDiamond;
                } else {
                    // Check if any diamond has is_center = 1 for multiple diamonds
                    const hasCenterDiamond = req.body.diamond_design_detail.some(
                        (diamondDetail) => diamondDetail.is_center === 1
                    );
                    if (hasCenterDiamond) {
                        isFilterAvailable = filterAvailable.CenterDiamondWithMultipleDiamond; // 1
                    } else {
                        isFilterAvailable = filterAvailable.MultipleDiamond; // 2
                    }
                }

                const designData = {
                    product_id: productId,
                    design_variant_name: req.body.product_name.trim(),
                    category_id: product.category_id,
                    sub_category_id: product.sub_category_id,
                    metal_rate_id: parseInt(req.body.metal_rate_id),
                    metal_weight: parseFloat(req.body.weight),
                    mark_up: req.body.mark_up && req.body.mark_up !== "" ? parseFloat(req.body.mark_up) : 0,
                    is_filter_available: isFilterAvailable,
                    price_flag: req.body.price_flag || priceFlag.NotSet,
                    // price: req.body.price || 0,
                    // pricing_message: req.body.pricing_message || null,
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
                    is_center: detail.is_center || 0,
                    position_visible: detail.position_visible || 0,
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
                            return res.status(409).json({
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
                            note: item.note ? item.note : null,
                        }));

                        designTranslations = await DesignTranslation.bulkCreate(translationRecords, { transaction });
                    }
                }

                // Handle file uploads - save to DesignsImages table
                // Expected format: [{image: "image_1.jpg", order: 1, is_product_listing: 1}, ...]
                const uploadedImages = [];
                let designImagesArray = [];
                
                // Parse design_images from req.body if provided
                if (req.body.design_images) {
                    let designImages = req.body.design_images;

                    // Parse design_images if it's a JSON string (when sent as form-data)
                    if (typeof designImages === 'string') {
                        try {
                            designImages = designImages.trim();
                            designImages = JSON.parse(designImages);
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid design images format. Please ensure it's valid JSON array, e.g., [{\"image\": \"image_1.jpg\", \"order\": 1, \"is_product_listing\": 1}]",
                            });
                        }
                    }

                    // Validate that design_images is an array
                    if (!Array.isArray(designImages)) {
                        return res.status(409).json({
                            success: false,
                            message: "design_images must be an array",
                        });
                    }

                    // Validate each item in the array
                    for (const item of designImages) {
                        if (typeof item !== 'object' || item === null) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must be an object with 'image', 'order', and 'is_product_listing' properties",
                            });
                        }

                        if (!item.image || typeof item.image !== 'string') {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'image' property (string)",
                            });
                        }

                        if (item.order === undefined || item.order === null || isNaN(parseInt(item.order))) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'order' property (number)",
                            });
                        }

                        if (item.is_product_listing === undefined || item.is_product_listing === null) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'is_product_listing' property (0 or 1)",
                            });
                        }
                    }

                    designImagesArray = designImages;
                }

                // Create image records
                if (designImagesArray.length > 0) {
                    // Map uploaded files to design_images array by matching original filename
                    // If item.image is an existing image name (from related variant), use it directly without uploading
                    const imageRecords = designImagesArray.map((item) => {
                        let imageName = item.image;
                        
                        // Check if this is an existing image name (already in S3, from related variant)
                        // If item.image contains a path or is already a stored image name, use it directly
                        const isExistingImage = item.is_existing === true || item.image_name ||
                            (item.image && (item.image.includes('/') || item.image.startsWith('design/')));

                        if (!isExistingImage && req.files && req.files.length > 0) {
                            // If files are uploaded, find the file that matches the original filename
                            // Try to find file by matching originalname with item.image
                            const matchingFile = req.files.find(file => {
                                const originalName = file.originalname || '';
                                return originalName === item.image || originalName.endsWith(item.image);
                            });
                            
                            if (matchingFile) {
                                // New file uploaded, use the S3 key
                                imageName = extractFilename(matchingFile.key) || matchingFile.originalname || item.image;
                            }
                        } else if (isExistingImage) {
                            // Use existing image name directly (from related variant)
                            imageName = item.image_name || item.image;
                        }
                        
                        return {
                            design_id: design.id,
                            image_name: imageName,
                            order: parseInt(item.order),
                            is_product_listing: parseInt(item.is_product_listing) || 0,
                        };
                    });

                    // Sort by order before creating
                    imageRecords.sort((a, b) => a.order - b.order);

                    const createdImages = await DesignsImages.bulkCreate(imageRecords, { transaction });
                    uploadedImages.push(...createdImages.map(img => ({
                        id: img.id,
                        image: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design'),
                        order: img.order,
                        is_product_listing: img.is_product_listing,
                    })));

                    // Map images to designs with same metal but different karat
                    // Get the metal_rate_id from the new design
                    const currentMetalRateId = parseInt(req.body.metal_rate_id);

                    // Fetch metal_rate_masters to get metal_id and karat_id
                    const currentMetalRate = await MetalRateMaster.findByPk(currentMetalRateId, { transaction });

                    if (currentMetalRate) {
                        const currentMetalId = currentMetalRate.metal_id;
                        const currentKaratId = currentMetalRate.karat_id;
                        const currentProductId = parseInt(req.body.product_id);

                        // Find all other designs with same product_id, same metal_id, but different karat_id
                        const relatedMetalRates = await MetalRateMaster.findAll({
                            where: {
                                metal_id: currentMetalId,
                                karat_id: { [Op.ne]: currentKaratId }
                            },
                            attributes: ['id'],
                            transaction
                        });

                        if (relatedMetalRates.length > 0) {
                            const relatedMetalRateIds = relatedMetalRates.map(mr => mr.id);

                            // Find designs with same product_id and related metal_rate_ids
                            let relatedDesigns = await Designs.findAll({
                                where: {
                                    product_id: currentProductId,
                                    metal_rate_id: { [Op.in]: relatedMetalRateIds }
                                },
                                attributes: ['id'],
                                transaction
                            });

                            // If diamond details exist, also filter by cut_master_id(s)
                            // Cut must match, but diamond_rate_id (clarity/type/carat) doesn't matter
                            if (req.body.diamond_design_detail && Array.isArray(req.body.diamond_design_detail) && req.body.diamond_design_detail.length > 0) {
                                const currentCutIds = [...new Set(req.body.diamond_design_detail.map(d => parseInt(d.cut_id)).filter(Boolean))].sort((a, b) => a - b);

                                if (currentCutIds.length > 0 && relatedDesigns.length > 0) {
                                    const relatedDesignIds = relatedDesigns.map(d => d.id);

                                    // Get diamond details for all related designs
                                    const allDiamondDetails = await DesignsDiamondDetails.findAll({
                                        where: {
                                            design_id: { [Op.in]: relatedDesignIds }
                                        },
                                        attributes: ['design_id', 'cut_master_id'],
                                        transaction
                                    });

                                    // Group by design_id and get unique cut_master_ids
                                    const designCutsMap = new Map();
                                    allDiamondDetails.forEach(detail => {
                                        if (!designCutsMap.has(detail.design_id)) {
                                            designCutsMap.set(detail.design_id, new Set());
                                        }
                                        designCutsMap.get(detail.design_id).add(detail.cut_master_id);
                                    });

                                    // Filter designs that have matching cut_master_id(s)
                                    const matchingDesignIds = [];
                                    designCutsMap.forEach((cutSet, designId) => {
                                        const designCutIds = Array.from(cutSet).sort((a, b) => a - b);
                                        // Check if cuts match (same set of cut_ids)
                                        if (currentCutIds.length === designCutIds.length &&
                                            currentCutIds.every((id, idx) => id === designCutIds[idx])) {
                                            matchingDesignIds.push(designId);
                                        }
                                    });

                                    if (matchingDesignIds.length > 0) {
                                        relatedDesigns = relatedDesigns.filter(d => matchingDesignIds.includes(d.id));
                                    } else {
                                        relatedDesigns = [];
                                    }
                                }
                            }

                            // Copy images to related designs
                            if (relatedDesigns.length > 0) {
                                const relatedDesignIds = relatedDesigns.map(d => d.id);

                                // First, delete existing images for related designs
                                await DesignsImages.destroy({
                                    where: {
                                        design_id: { [Op.in]: relatedDesignIds }
                                    },
                                    transaction
                                });

                                // Then, prepare new image records
                                const imagesToCopy = [];

                                for (const relatedDesign of relatedDesigns) {
                                    for (const imageRecord of imageRecords) {
                                        imagesToCopy.push({
                                            design_id: relatedDesign.id,
                                            image_name: imageRecord.image_name,
                                            order: imageRecord.order,
                                            is_product_listing: imageRecord.is_product_listing,
                                        });
                                    }
                                }

                                // Bulk create images for related designs
                                if (imagesToCopy.length > 0) {
                                    await DesignsImages.bulkCreate(imagesToCopy, { transaction });
                                }
                            }
                        }
                    }
                } else if (req.files && req.files.length > 0) {
                    // Fallback: if no design_images array provided but files are uploaded, create records with default order
                    const imageRecords = req.files.map((file, index) => {
                        const imageName = extractFilename(file.key) || file.originalname;
                        return {
                            design_id: design.id,
                            image_name: imageName,
                            order: index + 1,
                            is_product_listing: 0,
                        };
                    });

                    const createdImages = await DesignsImages.bulkCreate(imageRecords, { transaction });
                    uploadedImages.push(...createdImages.map(img => ({
                        id: img.id,
                        image: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design'),
                        order: img.order,
                        is_product_listing: img.is_product_listing,
                    })));

                    // Map images to designs with same metal but different karat
                    // Get the metal_rate_id from the new design
                    const currentMetalRateId = parseInt(req.body.metal_rate_id);

                    // Fetch metal_rate_masters to get metal_id and karat_id
                    const currentMetalRate = await MetalRateMaster.findByPk(currentMetalRateId, { transaction });

                    if (currentMetalRate) {
                        const currentMetalId = currentMetalRate.metal_id;
                        const currentKaratId = currentMetalRate.karat_id;
                        const currentProductId = parseInt(req.body.product_id);

                        // Find all other designs with same product_id, same metal_id, but different karat_id
                        const relatedMetalRates = await MetalRateMaster.findAll({
                            where: {
                                metal_id: currentMetalId,
                                karat_id: { [Op.ne]: currentKaratId }
                            },
                            attributes: ['id'],
                            transaction
                        });

                        if (relatedMetalRates.length > 0) {
                            const relatedMetalRateIds = relatedMetalRates.map(mr => mr.id);

                            // Find designs with same product_id and related metal_rate_ids
                            let relatedDesigns = await Designs.findAll({
                                where: {
                                    product_id: currentProductId,
                                    metal_rate_id: { [Op.in]: relatedMetalRateIds }
                                },
                                attributes: ['id'],
                                transaction
                            });

                            // If diamond details exist, also filter by cut_master_id(s)
                            // Cut must match, but diamond_rate_id (clarity/type/carat) doesn't matter
                            if (req.body.diamond_design_detail && Array.isArray(req.body.diamond_design_detail) && req.body.diamond_design_detail.length > 0) {
                                const currentCutIds = [...new Set(req.body.diamond_design_detail.map(d => parseInt(d.cut_id)).filter(Boolean))].sort((a, b) => a - b);

                                if (currentCutIds.length > 0 && relatedDesigns.length > 0) {
                                    const relatedDesignIds = relatedDesigns.map(d => d.id);

                                    // Get diamond details for all related designs
                                    const allDiamondDetails = await DesignsDiamondDetails.findAll({
                                        where: {
                                            design_id: { [Op.in]: relatedDesignIds }
                                        },
                                        attributes: ['design_id', 'cut_master_id'],
                                        transaction
                                    });

                                    // Group by design_id and get unique cut_master_ids
                                    const designCutsMap = new Map();
                                    allDiamondDetails.forEach(detail => {
                                        if (!designCutsMap.has(detail.design_id)) {
                                            designCutsMap.set(detail.design_id, new Set());
                                        }
                                        designCutsMap.get(detail.design_id).add(detail.cut_master_id);
                                    });

                                    // Filter designs that have matching cut_master_id(s)
                                    const matchingDesignIds = [];
                                    designCutsMap.forEach((cutSet, designId) => {
                                        const designCutIds = Array.from(cutSet).sort((a, b) => a - b);
                                        // Check if cuts match (same set of cut_ids)
                                        if (currentCutIds.length === designCutIds.length &&
                                            currentCutIds.every((id, idx) => id === designCutIds[idx])) {
                                            matchingDesignIds.push(designId);
                                        }
                                    });

                                    if (matchingDesignIds.length > 0) {
                                        relatedDesigns = relatedDesigns.filter(d => matchingDesignIds.includes(d.id));
                                    } else {
                                        relatedDesigns = [];
                                    }
                                }
                            }

                            // Copy images to related designs
                            if (relatedDesigns.length > 0) {
                                const relatedDesignIds = relatedDesigns.map(d => d.id);

                                // First, delete existing images for related designs
                                await DesignsImages.destroy({
                                    where: {
                                        design_id: { [Op.in]: relatedDesignIds }
                                    },
                                    transaction
                                });

                                // Then, prepare new image records
                                const imagesToCopy = [];

                                for (const relatedDesign of relatedDesigns) {
                                    for (const imageRecord of imageRecords) {
                                        imagesToCopy.push({
                                            design_id: relatedDesign.id,
                                            image_name: imageRecord.image_name,
                                            order: imageRecord.order,
                                            is_product_listing: imageRecord.is_product_listing,
                                        });
                                    }
                                }

                                // Bulk create images for related designs
                                if (imagesToCopy.length > 0) {
                                    await DesignsImages.bulkCreate(imagesToCopy, { transaction });
                                }
                            }
                        }
                    }
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
                        is_center: detail.is_center || 0,
                    })),
                    images: uploadedImages,
                    translations: designTranslations.map(trans => ({
                        id: trans.id,
                        language_id: trans.language_id,
                        design_variant_name: trans.design_variant_name,
                        description: trans.description,
                        note: trans.note,
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
                    return res.status(409).json({
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
                    return res.status(409).json({
                        success: false,
                        message: "Please enter product ID",
                    });
                }

                if (!req.body.product_name || req.body.product_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter product name",
                    });
                }

                if (!req.body.metal_rate_id || req.body.metal_rate_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter metal rate ID",
                    });
                }

                if (!req.body.weight || req.body.weight === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter weight",
                    });
                }

                // Parse diamond_design_detail if it's a JSON string (when sent as form-data)
                if (req.body.diamond_design_detail && typeof req.body.diamond_design_detail === 'string') {
                    try {
                        req.body.diamond_design_detail = JSON.parse(req.body.diamond_design_detail);
                    } catch (error) {
                        return res.status(409).json({
                            success: false,
                            message: "Invalid diamond design details format",
                        });
                    }
                }

                // if (!req.body.diamond_design_detail || !Array.isArray(req.body.diamond_design_detail) || req.body.diamond_design_detail.length === 0) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please provide diamond design details",
                //     });
                // }

                // Fetch product to get category_id and sub_category_id
                const product = await Product.findByPk(req.body.product_id, { transaction });
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Product not found",
                    });
                }

                // // Get first diamond_rate_id from diamond_design_detail for the Designs table (required field)
                // const firstDiamondRateId = req.body.diamond_design_detail[0]?.diamond_rate_id;
                // if (!firstDiamondRateId) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please provide diamond rate ID in diamond design details",
                //     });
                // }

                // Prepare design data
                const productId = parseInt(req.body.product_id);

                // Determine is_filter_available based on diamond details count (matching CSV update logic)
                let isFilterAvailable;
                if (productId === 55) {
                    isFilterAvailable = filterAvailable.TheFlowerType; // 4
                } else if (categoryId.Bracelets === product.category_id) {
                    isFilterAvailable = filterAvailable.PendantsAndNecklacesAndBraceletsAndEarrings; // 3
                } else if (req.body.diamond_design_detail.length === 0) {
                    isFilterAvailable = filterAvailable.NoDiamond;
                } else if (req.body.diamond_design_detail.length === 1) {
                    isFilterAvailable = filterAvailable.SingleDiamond;
                } else {
                    // Check if any diamond has is_center = 1 for multiple diamonds
                    const hasCenterDiamond = req.body.diamond_design_detail.some(
                        (diamondDetail) => diamondDetail.is_center === 1
                    );
                    if (hasCenterDiamond) {
                        isFilterAvailable = filterAvailable.CenterDiamondWithMultipleDiamond; // 1
                    } else {
                        isFilterAvailable = filterAvailable.MultipleDiamond; // 2
                    }
                }
                if (req.body.diamond_design_detail && req.body.diamond_design_detail.length === 1) {
                    req.body.diamond_design_detail[0].position_visible = 1;
                }

                const designData = {
                    product_id: productId,
                    design_variant_name: req.body.product_name.trim(),
                    category_id: product.category_id,
                    sub_category_id: product.sub_category_id,
                    metal_rate_id: parseInt(req.body.metal_rate_id),
                    metal_weight: parseFloat(req.body.weight),
                    mark_up: req.body.mark_up && req.body.mark_up !== "" ? parseFloat(req.body.mark_up) : 0,
                    // is_filter_available: isFilterAvailable,
                    // price_flag: req.body.price_flag || priceFlag.NotSet,
                    // price: req.body.price || 0,
                    // pricing_message: req.body.pricing_message || null,
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
                    is_center: detail.is_center || 0,
                    position_visible: detail.position_visible || 0,
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
                            return res.status(409).json({
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
                            note: item.note ? item.note : null,
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

                // Handle file uploads - update DesignsImages table with new format
                // Expected format: [{image: "image_1.jpg", order: 1, is_product_listing: 1}, ...]
                let designImagesArray = [];
                
                // Parse design_images from req.body if provided
                if (req.body.design_images) {
                    let designImages = req.body.design_images;

                    // Parse design_images if it's a JSON string (when sent as form-data)
                    if (typeof designImages === 'string') {
                        try {
                            // Trim the string first
                            designImages = designImages.trim();
                            designImages = JSON.parse(designImages);
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid design images format. Please ensure it's valid JSON array, e.g., [{\"image\": \"image_1.jpg\", \"order\": 1, \"is_product_listing\": 1}]",
                            });
                        }
                    }

                    // Validate that design_images is an array
                    if (!Array.isArray(designImages)) {
                        return res.status(409).json({
                            success: false,
                            message: "design_images must be an array",
                        });
                    }

                    // Validate each item in the array
                    for (const item of designImages) {
                        if (typeof item !== 'object' || item === null) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must be an object with 'image', 'order', and 'is_product_listing' properties",
                            });
                        }

                        if (!item.image || typeof item.image !== 'string') {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'image' property (string)",
                            });
                        }

                        if (item.order === undefined || item.order === null || isNaN(parseInt(item.order))) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'order' property (number)",
                            });
                        }

                        if (item.is_product_listing === undefined || item.is_product_listing === null) {
                            return res.status(409).json({
                                success: false,
                                message: "Each item in design_images must have a valid 'is_product_listing' property (0 or 1)",
                            });
                        }
                    }

                    designImagesArray = designImages;
                }

                // Fetch existing images for this design
                const existingImages = await DesignsImages.findAll({
                    where: { design_id: req.params.id },
                    transaction
                });

                // Handle image updates - only update images provided in payload, keep others
                const allImages = [];
                const matchedExistingImageIds = []; // Track which existing images were updated
                
                if (designImagesArray.length > 0) {
                    // Identify which existing images should be updated/deleted (matched by image name)
                    const imageNamesToDelete = [];
                    
                    for (const payloadItem of designImagesArray) {
                        const payloadImageName = payloadItem.image;
                        
                        // Find existing image that matches this payload image
                        // Match by exact name or by checking if one contains the other
                        const existingImage = existingImages.find(img => {
                            if (!img.image_name) return false;
                            // Exact match
                            if (img.image_name === payloadImageName) return true;
                            // Check if stored name contains payload name or vice versa
                            if (img.image_name.includes(payloadImageName) || payloadImageName.includes(img.image_name)) {
                                return true;
                            }
                            // Check if they match by filename (ignoring path)
                            const existingFileName = img.image_name.split('/').pop() || img.image_name;
                            const payloadFileName = payloadImageName.split('/').pop() || payloadImageName;
                            if (existingFileName === payloadFileName) return true;
                            return false;
                        });
                        
                        if (existingImage) {
                            imageNamesToDelete.push(existingImage.image_name);
                            matchedExistingImageIds.push(existingImage.id);
                        }
                    }

                    // Delete only the images that are being updated
                    if (imageNamesToDelete.length > 0) {
                        await DesignsImages.destroy({
                            where: { 
                                design_id: req.params.id,
                                image_name: { [Op.in]: imageNamesToDelete }
                            },
                            transaction
                        });
                    }

                    // Map uploaded files to design_images array by matching original filename
                    const imageRecords = designImagesArray.map((item) => {
                        let imageName = item.image;
                        
                        // If files are uploaded, find the file that matches the original filename
                        if (req.files && req.files.length > 0) {
                            // Try to find file by matching originalname with item.image
                            const matchingFile = req.files.find(file => {
                                const originalName = file.originalname || '';
                                return originalName === item.image || originalName.endsWith(item.image);
                            });
                            
                            if (matchingFile) {
                                imageName = extractFilename(matchingFile.key) || matchingFile.originalname || item.image;
                            }
                        }
                        
                        return {
                            design_id: parseInt(req.params.id),
                            image_name: imageName,
                            order: parseInt(item.order),
                            is_product_listing: parseInt(item.is_product_listing) || 0,
                        };
                    });

                    // Sort by order before creating
                    imageRecords.sort((a, b) => a.order - b.order);

                    // Bulk create image records for updated/new images
                    const createdImages = await DesignsImages.bulkCreate(imageRecords, { transaction });

                    // Format updated images for response
                    allImages.push(...createdImages.map(img => ({
                        id: img.id,
                        image: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design'),
                        order: img.order,
                        is_product_listing: img.is_product_listing,
                    })));

                    // Map images to designs with same metal (all karats) and same cut (if diamonds)
                    // Get the metal_rate_id from the updated design
                    const currentMetalRateId = parseInt(req.body.metal_rate_id);

                    // Fetch metal_rate_masters to get metal_id and karat_id
                    const currentMetalRate = await MetalRateMaster.findByPk(currentMetalRateId, { transaction });

                    if (currentMetalRate) {
                        const currentMetalId = currentMetalRate.metal_id;
                        const currentProductId = parseInt(req.body.product_id);

                        // Find ALL metal_rate_ids with same metal_id (including same and different karat)
                        const relatedMetalRates = await MetalRateMaster.findAll({
                            where: {
                                metal_id: currentMetalId
                            },
                            attributes: ['id'],
                            transaction
                        });

                        if (relatedMetalRates.length > 0) {
                            const relatedMetalRateIds = relatedMetalRates.map(mr => mr.id);

                            // Find designs with same product_id and related metal_rate_ids (exclude current design)
                            let relatedDesigns = await Designs.findAll({
                                where: {
                                    product_id: currentProductId,
                                    metal_rate_id: { [Op.in]: relatedMetalRateIds },
                                    id: { [Op.ne]: parseInt(req.params.id) } // Exclude current design
                                },
                                attributes: ['id'],
                                transaction
                            });

                            // If diamond details exist, also filter by cut_master_id(s)
                            // Cut must match, but diamond_rate_id (clarity/type/carat) doesn't matter
                            if (req.body.diamond_design_detail && Array.isArray(req.body.diamond_design_detail) && req.body.diamond_design_detail.length > 0) {
                                const currentCutIds = [...new Set(req.body.diamond_design_detail.map(d => parseInt(d.cut_id)).filter(Boolean))].sort((a, b) => a - b);

                                if (currentCutIds.length > 0 && relatedDesigns.length > 0) {
                                    const relatedDesignIds = relatedDesigns.map(d => d.id);

                                    // Get diamond details for all related designs
                                    const allDiamondDetails = await DesignsDiamondDetails.findAll({
                                        where: {
                                            design_id: { [Op.in]: relatedDesignIds }
                                        },
                                        attributes: ['design_id', 'cut_master_id'],
                                        transaction
                                    });

                                    // Group by design_id and get unique cut_master_ids
                                    const designCutsMap = new Map();
                                    allDiamondDetails.forEach(detail => {
                                        if (!designCutsMap.has(detail.design_id)) {
                                            designCutsMap.set(detail.design_id, new Set());
                                        }
                                        designCutsMap.get(detail.design_id).add(detail.cut_master_id);
                                    });

                                    // Filter designs that have matching cut_master_id(s)
                                    const matchingDesignIds = [];
                                    designCutsMap.forEach((cutSet, designId) => {
                                        const designCutIds = Array.from(cutSet).sort((a, b) => a - b);
                                        // Check if cuts match (same set of cut_ids)
                                        if (currentCutIds.length === designCutIds.length &&
                                            currentCutIds.every((id, idx) => id === designCutIds[idx])) {
                                            matchingDesignIds.push(designId);
                                        }
                                    });

                                    if (matchingDesignIds.length > 0) {
                                        relatedDesigns = relatedDesigns.filter(d => matchingDesignIds.includes(d.id));
                                    } else {
                                        relatedDesigns = [];
                                    }
                                }
                            }

                            // Copy images to related designs
                            if (relatedDesigns.length > 0) {
                                const relatedDesignIds = relatedDesigns.map(d => d.id);

                                // First, delete existing images for related designs
                                await DesignsImages.destroy({
                                    where: {
                                        design_id: { [Op.in]: relatedDesignIds }
                                    },
                                    transaction
                                });

                                // Then, prepare new image records
                                const imagesToCopy = [];

                                for (const relatedDesign of relatedDesigns) {
                                    for (const imageRecord of imageRecords) {
                                        imagesToCopy.push({
                                            design_id: relatedDesign.id,
                                            image_name: imageRecord.image_name,
                                            order: imageRecord.order,
                                            is_product_listing: imageRecord.is_product_listing,
                                        });
                                    }
                                }

                                // Bulk create images for related designs
                                if (imagesToCopy.length > 0) {
                                    await DesignsImages.bulkCreate(imagesToCopy, { transaction });
                                }
                            }
                        }
                    }
                }

                // Keep existing images that were not in the payload (not updated)
                const imagesToKeep = existingImages.filter(img => {
                    // Check if this image was matched and updated
                    const wasUpdated = matchedExistingImageIds.includes(img.id);
                    return !wasUpdated;
                });

                // Add kept images to response
                allImages.push(...imagesToKeep.map(img => ({
                    id: img.id,
                    image: img.image_name,
                    image_url: constructImageUrl(img.image_name, 'design'),
                    order: img.order,
                    is_product_listing: img.is_product_listing,
                })));

                // Sort all images by order for consistent response
                allImages.sort((a, b) => a.order - b.order);

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
                        is_center: detail.is_center || 0,
                        position_visible: detail.position_visible || 0,
                    })),
                    images: allImages,
                    translations: designTranslations.map(trans => ({
                        id: trans.id,
                        language_id: trans.language_id,
                        design_variant_name: trans.design_variant_name,
                        description: trans.description,
                        note: trans.note,
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
        // variantDetailsForEcom: async (req, res) => {
        //     try {
        //         // Validate product_id
        //         const productId = req.query.product_id || req.body.product_id;
        //         const designId = req.query.design_id || req.body.design_id;
        //         const metalId = req.query.metal_id || req.body.metal_id;
        //         const karatId = req.query.karat_id || req.body.karat_id;
        //         const diamondTypeId = req.query.diamond_type_id || req.body.diamond_type_id;
        //         const clarityId = req.query.clarity_id || req.body.clarity_id;
        //         const carat = req.query.carat || req.body.carat;
        //         const cutId = req.query.cut_id || req.body.cut_id;

        //         if (!productId) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: "Please provide product_id"
        //             });
        //         }

        //         // Build where clause for design filtering
        //         const designWhere = { product_id: parseInt(productId) };

        //         // If design_id is provided, use that specific design
        //         if (designId) {
        //             designWhere.id = parseInt(designId);
        //         }

        //         // If metal filters are provided, find matching metal_rate_id first
        //         let filteredMetalRateId = null;
        //         let filteredMetalRate = null;
        //         if (metalId || karatId) {
        //             const metalRateWhere = {};
        //             if (metalId) metalRateWhere.metal_id = parseInt(metalId);
        //             if (karatId) metalRateWhere.karat_id = parseInt(karatId);

        //             // Get the latest metal rate matching the filters
        //             filteredMetalRate = await MetalRateMaster.findOne({
        //                 where: metalRateWhere,
        //                 order: [['date', 'DESC'], ['id', 'DESC']],
        //                 include: [
        //                     { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
        //                     { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
        //                 ]
        //             });

        //             if (!filteredMetalRate) {
        //                 return res.status(404).json({
        //                     success: false,
        //                     message: "No metal rate found matching the specified metal and karat combination"
        //                 });
        //             }

        //             filteredMetalRateId = filteredMetalRate.id;
        //             // Find a design with this metal_rate_id
        //             const designWithMetal = await Designs.findOne({
        //                 where: {
        //                     product_id: parseInt(productId),
        //                     metal_rate_id: filteredMetalRateId
        //                 }
        //             });

        //             if (designWithMetal) {
        //                 designWhere.metal_rate_id = filteredMetalRateId;
        //             }
        //         }

        //         // Fetch design for the product
        //         let design = null;

        //         if (designId) {
        //             // Fetch specific design by design_id
        //             design = await Designs.findOne({
        //                 where: designWhere,
        //                 include: [
        //                     {
        //                         model: MetalRateMaster,
        //                         as: 'metal_rate',
        //                         attributes: ['id', 'metal_id', 'karat_id', 'rate'],
        //                         include: [
        //                             { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
        //                             { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignsDiamondDetails,
        //                         as: 'diamond_details',
        //                         attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'pcs'],
        //                         include: [
        //                             { model: CutMaster, as: 'cut_master', attributes: ['id', 'cut_name', 'cut_code'] },
        //                             {
        //                                 model: DiamondRate,
        //                                 as: 'diamond_rate',
        //                                 attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
        //                                 include: [
        //                                     { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
        //                                 ]
        //                             }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignsImages,
        //                         as: 'images',
        //                         attributes: ['id', 'image_name'],
        //                     },
        //                     {
        //                         model: Product,
        //                         as: 'product',
        //                         include: [
        //                             { model: Category, as: 'category', attributes: ['id', 'category_name', 'category_code', 'image'] },
        //                             { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id'] },
        //                             { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignTranslation,
        //                         as: 'design_translations',
        //                         attributes: ['id', 'language_id', 'design_variant_name', 'description'],
        //                         include: [
        //                             { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
        //                         ]
        //                     }
        //                 ]
        //             });
        //         } else {
        //             // Find all designs for the product and select the one with lowest price
        //             const allDesigns = await Designs.findAll({
        //                 where: { product_id: parseInt(productId) },
        //                 include: [
        //                     {
        //                         model: MetalRateMaster,
        //                         as: 'metal_rate',
        //                         attributes: ['id', 'metal_id', 'karat_id', 'rate'],
        //                         include: [
        //                             { model: Karat, as: 'karat', attributes: ['id', 'karat'] },
        //                             { model: Metal, as: 'metal', attributes: ['id', 'metal_name', 'metal_code'] }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignsDiamondDetails,
        //                         as: 'diamond_details',
        //                         attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'pcs'],
        //                         include: [
        //                             { model: CutMaster, as: 'cut_master', attributes: ['id', 'cut_name', 'cut_code'] },
        //                             {
        //                                 model: DiamondRate,
        //                                 as: 'diamond_rate',
        //                                 attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id', 'rate'],
        //                                 include: [
        //                                     { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
        //                                 ]
        //                             }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignsImages,
        //                         as: 'images',
        //                         attributes: ['id', 'image_name'],
        //                     },
        //                     {
        //                         model: Product,
        //                         as: 'product',
        //                         include: [
        //                             { model: Category, as: 'category', attributes: ['id', 'category_name', 'category_code', 'image'] },
        //                             { model: SubCategory, as: 'subCategory', attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id'] },
        //                             { model: StyleMaster, as: 'style', attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id'] }
        //                         ]
        //                     },
        //                     {
        //                         model: DesignTranslation,
        //                         as: 'design_translations',
        //                         attributes: ['id', 'language_id', 'design_variant_name', 'description'],
        //                         include: [
        //                             { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
        //                         ]
        //                     }
        //                 ]
        //             });

        //             // Calculate price for each design and find the lowest
        //             let lowestPriceDesign = null;
        //             let lowestPrice = Infinity;

        //             for (const d of allDesigns) {
        //                 // Metal cost calculation
        //                 const metalWeight = parseFloat(d.metal_weight) || 0;
        //                 const ratePerGram = parseFloat(d.metal_rate?.rate) || 0;
        //                 const metalCost = metalWeight * ratePerGram;

        //                 // Diamond cost calculation
        //                 let diamondCost = 0;
        //                 if (d.diamond_details && d.diamond_details.length > 0) {
        //                     d.diamond_details.forEach(diamondDetail => {
        //                         const diamondPieces = parseInt(diamondDetail.pcs) || 0;
        //                         const diamondSize = parseFloat(diamondDetail.diamond_rate?.diamond_master?.carat) || 0;
        //                         const diamondRatePerCarat = parseFloat(diamondDetail.diamond_rate?.rate) || 0;
        //                         diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
        //                     });
        //                 }

        //                 // Markup
        //                 const markUpValue = d.mark_up != null ? parseFloat(d.mark_up) : 1;
        //                 const markup = markUpValue > 0 ? markUpValue : 1;

        //                 // Total price
        //                 const totalPrice = (metalCost + diamondCost) * markup;

        //                 if (totalPrice < lowestPrice) {
        //                     lowestPrice = totalPrice;
        //                     lowestPriceDesign = d;
        //                 }
        //             }

        //             design = lowestPriceDesign;
        //         }

        //         if (!design) {
        //             return res.status(404).json({
        //                 success: false,
        //                 message: "No design found for this product"
        //             });
        //         }

        //         // Get the metal rate to use for calculation (use filtered one if available, otherwise use design's default)
        //         let metalRateForCalculation = design.metal_rate;

        //         // If metal filters are provided, use the filtered metal rate for calculation
        //         if (filteredMetalRate) {
        //             metalRateForCalculation = filteredMetalRate;
        //         }

        //         // Calculate total price
        //         // Formula: TotalPrice = ((MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat)) × Markup

        //         // Metal cost calculation
        //         const metalWeight = parseFloat(design.metal_weight) || 0;
        //         const ratePerGram = parseFloat(metalRateForCalculation?.rate) || 0;
        //         const metalCost = metalWeight * ratePerGram;

        //         // Diamond cost calculation (sum of all diamond details)
        //         // If diamond filters are provided, use filtered rates; otherwise use default rates
        //         let diamondCost = 0;
        //         const updatedDiamondDetails = [];

        //         if (design.diamond_details && design.diamond_details.length > 0) {
        //             for (const diamondDetail of design.diamond_details) {
        //                 // Filter by cut_id if provided
        //                 if (cutId && parseInt(cutId) !== diamondDetail.cut_master_id) {
        //                     // Skip this diamond detail if cut doesn't match
        //                     continue;
        //                 }

        //                 let diamondRateToUse = diamondDetail.diamond_rate;
        //                 let diamondMasterToUse = diamondDetail.diamond_rate?.diamond_master;

        //                 // If diamond filters are provided, find matching diamond rate
        //                 if (diamondTypeId || clarityId || carat) {
        //                     const diamondRateWhere = {
        //                         deleted_at: null,
        //                         diamond_master_id: diamondDetail.diamond_rate?.diamond_master_id
        //                     };

        //                     if (diamondTypeId) diamondRateWhere.diamond_type_id = parseInt(diamondTypeId);
        //                     if (clarityId) diamondRateWhere.clarity_id = parseInt(clarityId);

        //                     // If carat filter is provided, find matching diamond master first
        //                     if (carat) {
        //                         const caratValue = parseFloat(carat);
        //                         const matchingDiamondMaster = await DiamondMaster.findOne({
        //                             where: {
        //                                 carat: caratValue,
        //                                 deleted_at: null
        //                             }
        //                         });

        //                         if (matchingDiamondMaster) {
        //                             diamondRateWhere.diamond_master_id = matchingDiamondMaster.id;
        //                             diamondMasterToUse = matchingDiamondMaster;
        //                         }
        //                     }

        //                     // Find matching diamond rate
        //                     const matchingDiamondRate = await DiamondRate.findOne({
        //                         where: diamondRateWhere,
        //                         include: [
        //                             { model: DiamondMaster, as: 'diamond_master', attributes: ['id', 'carat'] }
        //                         ]
        //                     });

        //                     if (matchingDiamondRate) {
        //                         diamondRateToUse = matchingDiamondRate;
        //                         diamondMasterToUse = matchingDiamondRate.diamond_master || diamondMasterToUse;
        //                     }
        //                 }

        //                 // Calculate diamond cost for this detail
        //                 if (diamondRateToUse && diamondMasterToUse) {
        //                     const diamondPieces = parseInt(diamondDetail.pcs) || 0;
        //                     const diamondSize = parseFloat(diamondMasterToUse.carat) || 0;
        //                     const diamondRatePerCarat = parseFloat(diamondRateToUse.rate) || 0;

        //                     diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;

        //                     // Store updated diamond detail with filtered rate
        //                     const detailJson = diamondDetail.toJSON ? diamondDetail.toJSON() : diamondDetail;
        //                     const rateJson = diamondRateToUse.toJSON ? diamondRateToUse.toJSON() : diamondRateToUse;
        //                     const masterJson = diamondMasterToUse.toJSON ? diamondMasterToUse.toJSON() : diamondMasterToUse;

        //                     updatedDiamondDetails.push({
        //                         ...detailJson,
        //                         diamond_rate: {
        //                             ...rateJson,
        //                             diamond_master: masterJson
        //                         }
        //                     });
        //                 } else {
        //                     // Keep original if no filtered rate found
        //                     updatedDiamondDetails.push(diamondDetail.toJSON ? diamondDetail.toJSON() : diamondDetail);
        //                 }
        //             }
        //         }

        //         // Markup - default to 1 if 0, null, or undefined
        //         const markUpValue = design.mark_up != null ? parseFloat(design.mark_up) : 1;
        //         const markup = markUpValue > 0 ? markUpValue : 1;

        //         // Total price calculation
        //         const totalPrice = (metalCost + diamondCost) * markup;

        //         // Convert design to JSON to add computed field
        //         const designData = design.toJSON ? design.toJSON() : design;

        //         // Update metal_rate if filtered one was used
        //         if (filteredMetalRate) {
        //             designData.metal_rate = metalRateForCalculation.toJSON ? metalRateForCalculation.toJSON() : metalRateForCalculation;
        //             designData.metal_rate_id = filteredMetalRateId;
        //         }

        //         // Update diamond_details if filtered
        //         if (updatedDiamondDetails.length > 0) {
        //             designData.diamond_details = updatedDiamondDetails;
        //         }

        //         // Construct full image URLs for images
        //         if (designData.images && Array.isArray(designData.images)) {
        //             designData.images = designData.images.map(img => ({
        //                 id: img.id,
        //                 image_name: img.image_name,
        //                 image_url: constructImageUrl(img.image_name, 'design')
        //             }));
        //         }

        //         designData.total_price = "€ " + parseFloat(totalPrice.toFixed(2));

        //         return res.status(200).json({
        //             success: true,
        //             message: "Design variant details fetched successfully",
        //             data: designData
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
        filterDropdownsEcom: async (req, res) => {
            try {
                const languageId = req.query.language_id || req.body.language_id;
                const productId = req.query.product_id || req.body.product_id;
                const cutId = req.query.cut_id || req.body.cut_id;
                const diamondTypeId = req.query.diamond_type_id || req.body.diamond_type_id;

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
                            // where: {
                            //     is_center: 1
                            // },
                            attributes: ['id', 'cut_master_id', 'diamond_rate_id', 'position_visible'],
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

                // First pass: Extract all cuts and diamond_types (always show all available options)
                designs.forEach(design => {
                    if (design.diamond_details && design.diamond_details.length > 0) {
                        design.diamond_details.forEach(detail => {
                            // Extract cut (only extract cuts where position_visible == 1)
                            const positionVisible = detail.position_visible;
                            const isPositionVisible = positionVisible === 1 || positionVisible === '1' || parseInt(positionVisible) === 1;

                            if (isPositionVisible && detail.cut_master_id) {
                                cutIds.add(detail.cut_master_id);
                                if (detail.cut_master) {
                                    cutMap.set(detail.cut_master.id, detail.cut_master);
                                }
                            }

                            // Extract diamond_type (always extract all diamond_types)
                            if (detail.diamond_rate && detail.diamond_rate.diamond_type_id) {
                                diamondTypeIds.add(detail.diamond_rate.diamond_type_id);
                                if (detail.diamond_rate.diamond_type) {
                                    diamondTypeMap.set(detail.diamond_rate.diamond_type.id, detail.diamond_rate.diamond_type);
                                }
                            }
                        });
                    }
                });

                // Second pass: Extract dependent options (carats, clarities, metals, karats)
                // If cut_id and diamond_type_id are provided, only extract from matching designs
                designs.forEach(design => {
                    let shouldIncludeDesign = true;
                    let matchingDiamondDetails = [];

                    // Filter diamond_details if cut_id and diamond_type_id are provided
                    if (cutId && diamondTypeId && design.diamond_details && design.diamond_details.length > 0) {
                        matchingDiamondDetails = design.diamond_details.filter(detail => {
                            const matchesCut = parseInt(detail.cut_master_id) === parseInt(cutId);
                            const matchesType = detail.diamond_rate && parseInt(detail.diamond_rate.diamond_type_id) === parseInt(diamondTypeId);
                            return matchesCut && matchesType;
                        });
                        // Only include design if it has matching diamond details
                        shouldIncludeDesign = matchingDiamondDetails.length > 0;
                    } else {
                        matchingDiamondDetails = design.diamond_details || [];
                    }

                    // Extract metal and karat from metal_rate (only if matching criteria or if filters not provided)
                    if (shouldIncludeDesign && design.metal_rate) {
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

                    // Extract diamond-related dependent data from matching diamond_details only
                    if (shouldIncludeDesign && matchingDiamondDetails.length > 0) {
                        matchingDiamondDetails.forEach(detail => {
                            // Only process diamonds with position_visible == 1 for carats
                            const positionVisible = detail.position_visible;
                            const isPositionVisible = positionVisible === 1 || positionVisible === '1' || parseInt(positionVisible) === 1;

                            // Extract diamond rate data (carats, clarities)
                            if (detail.diamond_rate) {
                                if (detail.diamond_rate.clarity_id) {
                                    clarityIds.add(detail.diamond_rate.clarity_id);
                                    if (detail.diamond_rate.clarity) {
                                        clarityMap.set(detail.diamond_rate.clarity.id, detail.diamond_rate.clarity);
                                    }
                                }
                                // Only add carat to diamondMasterIds if position_visible == 1
                                if (isPositionVisible && detail.diamond_rate.diamond_master_id) {
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
                    { id: 1, size: "14", value: "14" },
                    { id: 2, size: "14.25", value: "14.25" },
                    { id: 3, size: "14.5", value: "14.5" },
                    { id: 4, size: "14.75", value: "14.75" },
                    { id: 5, size: "15", value: "15" },
                    { id: 6, size: "15.25", value: "15.25" },
                    { id: 7, size: "15.5", value: "15.5" },
                    { id: 8, size: "15.75", value: "15.75" },
                    { id: 9, size: "16", value: "16" },
                    { id: 10, size: "16.5", value: "16.5" },
                    { id: 11, size: "17", value: "17" },
                    { id: 12, size: "17.25", value: "17.25" },
                    { id: 13, size: "17.5", value: "17.5" },
                    { id: 14, size: "17.75", value: "17.75" },
                    { id: 15, size: "18", value: "18" },
                    { id: 16, size: "18.25", value: "18.25" },
                    { id: 17, size: "18.5", value: "18.5" },
                    { id: 18, size: "18.75", value: "18.75" },
                    { id: 19, size: "19", value: "19" },
                    { id: 20, size: "19.25", value: "19.25" },
                    { id: 21, size: "19.5", value: "19.5" },
                    { id: 22, size: "19.75", value: "19.75" },
                    { id: 23, size: "20", value: "20" },
                    { id: 24, size: "20.25", value: "20.25" },
                    { id: 25, size: "20.5", value: "20.5" },
                    { id: 26, size: "20.75", value: "20.75" },
                    { id: 27, size: "21", value: "21" },
                    { id: 28, size: "21.25", value: "21.25" },
                    { id: 29, size: "21.5", value: "21.5" },
                    { id: 30, size: "21.75", value: "21.75" },
                    { id: 31, size: "22", value: "22" },
                    { id: 32, size: "22.25", value: "22.25" },
                    { id: 33, size: "22.5", value: "22.5" },
                    { id: 34, size: "22.75", value: "22.75" },
                    { id: 35, size: "23", value: "23" },
                    { id: 36, size: "23.25", value: "23.25" },
                    { id: 37, size: "23.5", value: "23.5" },
                    { id: 38, size: "23.75", value: "23.75" },
                    { id: 39, size: "24", value: "24" },
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
                        code: type.type_code,
                        is_lab: (type.type_code === 'LBS' || (type.type_code && type.type_code.toLowerCase().includes('lab'))) ? 1 : 0
                    })),
                    clarities: diamondClarities.map(clarity => ({
                        id: clarity.id,
                        name: clarity.clarity,
                        is_lab: (clarity.clarity && clarity.clarity.toLowerCase() === 'fvvs') ? 1 : 0
                    })),
                    carats: diamondCarats.map(carat => ({
                        id: carat.id,
                        carat: parseFloat(carat.carat) || 0
                    })),
                    metals: metals.map(metal => {
                        let metalName = metalTranslationsMap.has(metal.id)
                            ? metalTranslationsMap.get(metal.id)
                            : metal.metal_name;

                        return {
                            id: metal.id,
                            name: metalName,
                            code: metal.metal_code,
                            is_platinum: metalName && metalName.toLowerCase().includes('platinum') ? 1 : 0
                        };
                    }),
                    karats: karats.map(karat => ({
                        id: karat.id,
                        karat: karat.karat,
                        is_platinum: karat.karat && karat.karat.includes('950PT') ? 1 : 0
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
        delete: async (req, res) => {
            const transaction = req.transaction || null;
            try {
                // Validate design ID
                if (!req.params.id) {
                    return res.status(409).json({
                        success: false,
                        message: "Please provide design ID",
                    });
                }

                // Find existing design
                const design = await Designs.findByPk(req.params.id, { transaction });

                if (!design) {
                    return res.status(404).json({
                        success: false,
                        message: "Design not found",
                    });
                }

                // Delete related records in parallel
                await Promise.all([
                    // Delete diamond details
                    DesignsDiamondDetails.destroy({
                        where: { design_id: req.params.id },
                        transaction
                    }),
                    // Delete images
                    DesignsImages.destroy({
                        where: { design_id: req.params.id },
                        transaction
                    }),
                    // Delete translations
                    DesignTranslation.destroy({
                        where: { design_id: req.params.id },
                        transaction
                    })
                ]);

                // Delete the design
                await Designs.destroy({
                    where: { id: req.params.id },
                    transaction
                });

                return res.status(200).json({
                    success: true,
                    message: "Design deleted successfully",
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
                const lastChangedFilter = req.query.last_changed_filter || req.body.last_changed_filter; // Track which filter was changed last
                const languageId = (req.query.language_id || req.body.language_id) ? parseInt(req.query.language_id || req.body.language_id) : null; // Language ID for translation filtering

                if (!productId) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide product_id"
                    });
                }

                // Helper function to build includes array
                const buildIncludes = (useDiamondFilters, diamondRateFilter, useCutId, useLanguageId, useDiamondTypeId, useClarityId, diamondRateIds) => {
                    const includes = [
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
                            model: DesignsImages,
                            as: 'images',
                            attributes: ['id', 'image_name', 'order', 'is_product_listing'],
                            separate: true,
                            order: [['id', 'ASC']]
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
                            // where: useLanguageId ? { language_id: useLanguageId } : undefined,
                            required: false,
                            include: [
                                { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                            ]
                        }
                    ];

                    // Add diamond details include conditionally
                    if (useDiamondFilters && diamondRateFilter && useCutId) {
                        // If carat is provided, filter by specific diamond_rate_id
                        includes.push({
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            where: {
                                diamond_rate_id: diamondRateFilter.id,
                                cut_master_id: useCutId
                            },
                            required: true,
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
                        });
                    } else if (useDiamondFilters && !diamondRateFilter && useCutId && diamondRateIds && diamondRateIds.length > 0) {
                        // If diamond_type_id and clarity_id are provided but carat is not, filter by those only (with cut)
                        includes.push({
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            where: {
                                cut_master_id: useCutId,
                                diamond_rate_id: { [Op.in]: diamondRateIds }
                            },
                            required: true,
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
                        });
                    } else if (useDiamondFilters && !diamondRateFilter && !useCutId && diamondRateIds && diamondRateIds.length > 0) {
                        // If only diamond_type_id and clarity_id are provided (no carat, no cut)
                        includes.push({
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            where: {
                                diamond_rate_id: { [Op.in]: diamondRateIds }
                            },
                            required: true,
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
                        });
                    } else {
                        // Include all diamond details if no filter is provided (for plain designs)
                        includes.push({
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            required: false,
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
                        });
                    }

                    return includes;
                };

                // Helper function to try finding a design with given filters
                const tryFindDesign = async (filters) => {
                    const {
                        useMetalId,
                        useKaratId,
                        useDiamondTypeId,
                        useClarityId,
                        useCarat,
                        useCutId
                    } = filters;

                    // Find metal rate
                    let metalRateFilter = null;
                    let useMetalRateFilter = true;
                    if (useMetalId && useKaratId) {
                        metalRateFilter = await MetalRateMaster.findOne({
                            where: {
                                metal_id: parseInt(useMetalId),
                                karat_id: parseInt(useKaratId)
                            }
                        });
                        if (!metalRateFilter) {
                            return null;
                        }
                    } else {
                        // If metal filters not provided, don't filter by metal_rate_id
                        useMetalRateFilter = false;
                    }

                    // Find diamond rate if diamond filters are provided
                    // Carat is now optional - only require diamond_type_id and clarity_id
                    let diamondRateFilter = null;
                    let diamondRateIds = null;
                    const hasDiamondFilters = useDiamondTypeId && useClarityId; // Carat is optional

                    if (hasDiamondFilters) {
                        // If carat is provided, find specific diamond rate
                        if (useCarat) {
                            const caratValue = parseFloat(useCarat);
                            const tolerance = 0.000001;
                            const diamondMasterFilter = await DiamondMaster.findOne({
                                where: {
                                    carat: {
                                        [Op.between]: [caratValue - tolerance, caratValue + tolerance]
                                    },
                                    deleted_at: null
                                }
                            });
                            if (!diamondMasterFilter) {
                                return null;
                            }
                            diamondRateFilter = await DiamondRate.findOne({
                                where: {
                                    diamond_type_id: parseInt(useDiamondTypeId),
                                    clarity_id: parseInt(useClarityId),
                                    diamond_master_id: diamondMasterFilter.id
                                }
                            });
                            if (!diamondRateFilter) {
                                return null;
                            }
                        } else {
                            // If carat is not provided, find all diamond rates matching diamond_type_id and clarity_id
                            const matchingDiamondRates = await DiamondRate.findAll({
                                where: {
                                    diamond_type_id: parseInt(useDiamondTypeId),
                                    clarity_id: parseInt(useClarityId)
                                },
                                attributes: ['id']
                            });
                            diamondRateIds = matchingDiamondRates.map(dr => dr.id);

                            if (diamondRateIds.length === 0) {
                                return null; // No matching diamond rates found
                            }
                        }
                    }
                    // Build includes
                    const includes = buildIncludes(hasDiamondFilters, diamondRateFilter, useCutId, languageId, useDiamondTypeId, useClarityId, diamondRateIds);

                    // Find design
                    const designWhere = { product_id: parseInt(productId) };
                    if (designId) {
                        designWhere.id = parseInt(designId);
                    }

                    // Add metal_rate_id filter only if metal filters were provided
                    if (useMetalRateFilter && metalRateFilter) {
                        designWhere.metal_rate_id = metalRateFilter.id;
                    }

                    const designData = await Designs.findOne({
                        where: designWhere,
                        include: includes
                    });

                    return designData;
                };

                // Track adjusted filters
                let adjustedFilters = {};

                // Check if original request had diamond filters (carat is optional)
                const originalHasDiamondFilters = diamondTypeId && clarityId;

                // First, try exact match
                let designData = await tryFindDesign({
                    useMetalId: metalId,
                    useKaratId: karatId,
                    useDiamondTypeId: diamondTypeId,
                    useClarityId: clarityId,
                    useCarat: carat,
                    useCutId: cutId
                });

                // If exact match not found, try different combinations
                if (!designData) {
                    // Define filter removal priority based on last changed filter
                    // If lastChangedFilter is provided, prioritize removing that one first
                    const filterRemovalOrder = [];

                    if (lastChangedFilter) {
                        // Start with the last changed filter
                        filterRemovalOrder.push(lastChangedFilter);
                        // Then add others in priority order
                        const allFilters = ['cut_id', 'carat', 'clarity_id', 'diamond_type_id', 'karat_id', 'metal_id'];
                        allFilters.forEach(filter => {
                            if (filter !== lastChangedFilter) {
                                filterRemovalOrder.push(filter);
                            }
                        });
                    } else {
                        // Default priority: most specific to least specific
                        filterRemovalOrder.push('cut_id', 'carat', 'clarity_id', 'diamond_type_id', 'karat_id', 'metal_id');
                    }

                    // Try removing filters one by one
                    for (let i = 0; i < filterRemovalOrder.length; i++) {
                        const filterToRemove = filterRemovalOrder[i];
                        const filters = {
                            useMetalId: filterToRemove !== 'metal_id' ? metalId : null,
                            useKaratId: filterToRemove !== 'karat_id' ? karatId : null,
                            useDiamondTypeId: filterToRemove !== 'diamond_type_id' ? diamondTypeId : null,
                            useClarityId: filterToRemove !== 'clarity_id' ? clarityId : null,
                            useCarat: filterToRemove !== 'carat' ? carat : null,
                            useCutId: filterToRemove !== 'cut_id' ? cutId : null
                        };

                        designData = await tryFindDesign(filters);
                        if (designData) {
                            // Track which filter was removed
                            adjustedFilters[filterToRemove] = null;
                            break;
                        }
                    }

                    // If still not found, try removing all diamond filters (keep only metal filters)
                    if (!designData && originalHasDiamondFilters) {
                        designData = await tryFindDesign({
                            useMetalId: metalId,
                            useKaratId: karatId,
                            useDiamondTypeId: null,
                            useClarityId: null,
                            useCarat: null,
                            useCutId: null
                        });
                        if (designData) {
                            adjustedFilters = {
                                diamond_type_id: null,
                                clarity_id: null,
                                carat: null,
                                cut_id: null
                            };
                        }
                    }

                    // If still not found, try with any metal
                    if (!designData) {
                        designData = await tryFindDesign({
                            useMetalId: null,
                            useKaratId: null,
                            useDiamondTypeId: null,
                            useClarityId: null,
                            useCarat: null,
                            useCutId: null
                        });
                        if (designData) {
                            adjustedFilters = {
                                metal_id: null,
                                karat_id: null,
                                diamond_type_id: null,
                                clarity_id: null,
                                carat: null,
                                cut_id: null
                            };
                        }
                    }
                }

                if (!designData) {
                    return res.status(404).json({
                        success: false,
                        message: "Design not found with any available filter combination"
                    });
                }

                // Convert design to JSON to add computed fields
                const designDataJson = designData.toJSON ? designData.toJSON() : designData;
                const designDiamondDetails = await DesignsDiamondDetails.findAll({
                    where: {
                        design_id: designData.id
                    },
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
                });
                designDataJson.diamond_details = designDiamondDetails.map(d => d.toJSON ? d.toJSON() : d);

                // Extract actual filter values from the found design and populate adjustedFilters
                if (Object.keys(adjustedFilters).length > 0) {
                    // Get actual metal and karat from the design
                    if (adjustedFilters.metal_id === null || adjustedFilters.karat_id === null) {
                        if (designDataJson.metal_rate) {
                            if (adjustedFilters.metal_id === null) {
                                adjustedFilters.metal_id = designDataJson.metal_rate.metal_id;
                            }
                            if (adjustedFilters.karat_id === null) {
                                adjustedFilters.karat_id = designDataJson.metal_rate.karat_id;
                            }
                        }
                    }

                    // Get actual diamond filters from the design's diamond details
                    if (adjustedFilters.diamond_type_id === null || adjustedFilters.clarity_id === null ||
                        adjustedFilters.cut_id === null || (adjustedFilters.carat === null && carat)) {
                        if (designDataJson.diamond_details && designDataJson.diamond_details.length > 0) {
                            // Use the first diamond detail as the representative
                            const firstDiamondDetail = designDataJson.diamond_details[0];
                            if (firstDiamondDetail.diamond_rate) {
                                if (adjustedFilters.diamond_type_id === null) {
                                    adjustedFilters.diamond_type_id = firstDiamondDetail.diamond_rate.diamond_type_id;
                                }
                                if (adjustedFilters.clarity_id === null) {
                                    adjustedFilters.clarity_id = firstDiamondDetail.diamond_rate.clarity_id;
                                }
                                // Only set carat in adjusted filters if it was originally provided
                                if (adjustedFilters.carat === null && carat && firstDiamondDetail.diamond_rate.diamond_master) {
                                    adjustedFilters.carat = firstDiamondDetail.diamond_rate.diamond_master.carat;
                                }
                            }
                            if (adjustedFilters.cut_id === null && firstDiamondDetail.cut_master) {
                                adjustedFilters.cut_id = firstDiamondDetail.cut_master.id;
                            }
                        }
                    }
                }

                // Calculate total price
                // Formula: TotalPrice = (MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat) × Markup
                const metalWeight = parseFloat(designDataJson.metal_weight) || 0;
                const ratePerGram = parseFloat(designDataJson.metal_rate?.rate) || 0;
                const metalCost = metalWeight * ratePerGram;

                // Diamond cost calculation (sum of all diamond details)
                let diamondCost = 0;
                if (designDataJson.diamond_details && designDataJson.diamond_details.length > 0) {
                    designDataJson.diamond_details.forEach(diamondDetail => {
                        const diamondPieces = parseInt(diamondDetail.pcs) || 0;
                        const diamondSize = parseFloat(diamondDetail.diamond_rate?.diamond_master?.carat) || 0;
                        const diamondRatePerCarat = parseFloat(diamondDetail.diamond_rate?.rate) || 0;

                        diamondCost += diamondPieces * diamondSize * diamondRatePerCarat;
                    });
                }

                // Markup - default to 1 if 0, null, or undefined
                const markUpValue = designDataJson.mark_up != null ? parseFloat(designDataJson.mark_up) : 1;
                const markup = markUpValue > 0 ? markUpValue : 1;

                // Total price calculation
                const xyz = (metalCost + diamondCost) * markup;

                // Construct full image URLs for all design images
                if (designDataJson.images && Array.isArray(designDataJson.images)) {
                    designDataJson.images = designDataJson.images.map(img => ({
                        id: img.id,
                        image: img.image_name,
                        image_url: constructImageUrl(img.image_name, 'design'),
                        order: img.order,
                        is_product_listing: img.is_product_listing,
                    }));
                } else {
                    designDataJson.images = [];
                }

                // Get first translation if available
                // if (designDataJson.design_translations && Array.isArray(designDataJson.design_translations)) {
                //     if (designDataJson.design_translations.length > 0) {
                //         designDataJson.design_translation = designDataJson.design_translations[0];
                //     } else {
                //         designDataJson.design_translation = null;
                //     }
                //     delete designDataJson.design_translations;
                // } else {
                //     designDataJson.design_translation = null;
                // }

                // Add total_price to design data based on price_flag
                // Support for two languages: English (1) and Finnish (2)
                const currentLanguageId = parseInt(req.query.language_id || req.body.language_id) || languageId.English; // Default to English (1) if not specified
                const startingFromText = priceMessages.startingFrom[currentLanguageId] || priceMessages.startingFrom[languageId.English];
                const enquirePriceText = priceMessages.enquirePrice[currentLanguageId] || priceMessages.enquirePrice[languageId.English];

                // Parse price_flag to handle both string and number types
                const priceFlagValue = parseInt(designDataJson.price_flag) || 0;
                const designPrice = parseFloat(designDataJson.price) || 0;

                // Initialize total_price - ensure it's always set fresh, never append
                let totalPriceValue = null;

                // Only ONE condition should execute per design
                // Use lowest price variant (xyz) for calculated price display
                if (priceFlagValue === 1 || priceFlagValue === priceFlag.Set) {
                    // Condition 1: price_flag == 1: Show calculated price (using lowest price variant)
                    totalPriceValue = priceMessages.currencySymbol + Math.round(xyz);
                } else if (priceFlagValue === 2) {
                    // Condition 2: price_flag == 2: Show "Starting From {price from database}" and "Please enquire" (or calculated if price == 0)
                    const basePrice = designPrice > 0 ? Math.round(designPrice) : Math.round(xyz);
                    totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${basePrice} ${enquirePriceText}`;
                } else if (priceFlagValue === 4 && designPrice === 0) {
                    // Condition 3: price_flag == 4 AND designs.price == 0: Show "Please enquire" message only
                    totalPriceValue = enquirePriceText;
                } else {
                    // Fallback: Show calculated price (for price_flag == 0 or other values) using lowest price variant
                    // const roundedPrice = Math.round(xyz);
                    // totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${roundedPrice} ${enquirePriceText}`;
                    totalPriceValue = `${enquirePriceText}`;
                }

                // Set total_price only once, ensuring no duplication
                designDataJson.total_price = totalPriceValue;

                // Prepare response
                const response = {
                    success: true,
                    message: "Design variant details fetched successfully",
                    data: designDataJson
                };

                // Add adjusted filters information if any filters were adjusted
                if (Object.keys(adjustedFilters).length > 0) {
                    response.adjusted_filters = adjustedFilters;
                    response.message = "Design variant details fetched successfully with adjusted filters";
                    response.is_design_avl = 0; // 0 = design not available with exact filters, adjusted filters used
                } else {
                    response.is_design_avl = 1; // 1 = exact match found, design available with exact filters
                }

                return res.status(200).json(response);
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        deleteDesignImage: async (req, res) => {
            try {
                // Validate image ID
                if (!req.params.id) {
                    return res.status(409).json({
                        success: false,
                        message: "Please provide design image ID",
                    });
                }

                // Find existing design image
                const designImage = await DesignsImages.findByPk(req.params.id);

                if (!designImage) {
                    return res.status(404).json({
                        success: false,
                        message: "Design image not found",
                    });
                }

                // Delete image from S3 if exists
                if (designImage.image_name) {
                    try {
                        // Construct full S3 key for deletion: public/design/image/{filename}
                        const fullS3Key = `public/design/image/${designImage.image_name}`;
                        await deleteFromBucket(fullS3Key);
                    } catch (deleteError) {
                        console.log("Error deleting image from S3:", deleteError);
                        // Continue even if deletion fails
                    }
                }

                // Delete the image record
                await DesignsImages.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Design image deleted successfully",
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
        uploadCsv: async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Please upload a CSV or Excel file (csv/xlsx/xls)",
                    });
                }

                // Validate that file was properly uploaded
                if (!req.file.key) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed: S3 key is missing",
                    });
                }

                const s3Key = req.file.key;
                const path = await getS3Object(s3Key);
                const csvString = await path.Body.transformToString("utf8");
                await deleteFromBucket(s3Key);

                // Configure csvtojson to preserve encoding and handle special characters properly (especially for Finnish)
                const sources = await csvtojson({
                    checkType: false, // Don't auto-convert types, preserve as strings
                    encoding: 'utf8'
                }).fromString(csvString);
                // return res.json(sources);
                // Check for required columns - now includes P1 and P2 for both languages
                const requiredColumns = [
                    "Product Name",
                    "Design Variant Name(EN)",
                    "Design Variant Name(FN)",
                    "Description(EN)-P1",
                    "Description(EN)-P2",
                    "Description(FN)-P1",
                    "Description(FN)-P2",
                    "Metal name",
                    "Karat",
                    "Weight",
                    "Mark Up",
                    "Diamond Cut",
                    "Diamond Carat",
                    "Diamond Type",
                    "Diamond Clarity",
                    "Pcs",
                    "Diamond Position",
                    "Position Visible",
                    "Price flag",
                    "Price"
                ];

                const sourceKeys = Object.keys(sources[0]);
                const hasAllRequiredColumns = requiredColumns.every((col, index) => {
                    return sourceKeys[index] === col;
                });

                if (!hasAllRequiredColumns) {
                    return res.status(422).json({
                        success: false,
                        message: "Invalid File Format"
                    });
                }
                let designArray = [];
                let designTranslationArray = [];
                let designDiamondDetailsArray = [];
                let finalList = [];
                // Store metal and karat info for SKU generation
                let skuInfoArray = [];

                for (const x of sources) {
                    let designObj = {};
                    let designTranslationObjEN = {};
                    let designTranslationObjFN = {};
                    let designDiamondDetailsObj = {};
                    let duplicationString = [];
                    let validationSting = [];
                    let metalCode = null;
                    let karatValue = null;
                    if (x["Product Name"].trim() !== "") {
                        const product = await Product.findOne({
                            include: [
                                {
                                    model: ProductTranslation,
                                    as: 'product_translations',
                                    where: {
                                        language_id: languageId.English,
                                        product_name: x["Product Name"].trim(),
                                    }
                                }
                            ]
                        });
                        if (!product) {
                            validationSting.push("Product name not found");
                        } else {
                            designObj.product_id = product.id;
                            designObj.category_id = product.category_id;
                            designObj.sub_category_id = product.sub_category_id;
                        }
                        
                    }
                    // Process English translation
                    if (x["Design Variant Name(EN)"].trim() !== "") {
                        designObj.design_variant_name = x["Design Variant Name(EN)"].trim();
                        designTranslationObjEN.design_variant_name = x["Design Variant Name(EN)"].trim();
                        designTranslationObjEN.language_id = languageId.English;
                    } 
                    // Concatenate P1 and P2 with \n\n for English description
                    let descriptionEN = [];
                    if (x["Description(EN)-P1"] && typeof x["Description(EN)-P1"] === 'string' && x["Description(EN)-P1"].trim() !== "") {
                        descriptionEN.push(x["Description(EN)-P1"].trim());
                    }
                    if (x["Description(EN)-P2"] && typeof x["Description(EN)-P2"] === 'string' && x["Description(EN)-P2"].trim() !== "") {
                        descriptionEN.push(x["Description(EN)-P2"].trim());
                    }
                    if (descriptionEN.length > 0) {
                        designTranslationObjEN.description = descriptionEN.join("\n\n");
                    }

                    // Process Finnish translation
                    if (x["Design Variant Name(FN)"].trim() !== "") {
                        designTranslationObjFN.design_variant_name = x["Design Variant Name(FN)"].trim();
                        designTranslationObjFN.language_id = languageId.Finnish;
                    } 
                    // Concatenate P1 and P2 with \n\n for Finnish description
                    let descriptionFN = [];
                    // Preserve exact content from Excel with proper encoding for Finnish special characters (ä, ö, å)
                    if (x["Description(FN)-P1"] !== undefined && x["Description(FN)-P1"] !== null && x["Description(FN)-P1"] !== "") {
                        const p1Value = String(x["Description(FN)-P1"]).trim();
                        if (p1Value !== "") {
                            descriptionFN.push(p1Value);
                        }
                    }
                    if (x["Description(FN)-P2"] !== undefined && x["Description(FN)-P2"] !== null && x["Description(FN)-P2"] !== "") {
                        const p2Value = String(x["Description(FN)-P2"]).trim();
                        if (p2Value !== "") {
                            descriptionFN.push(p2Value);
                        }
                    }
                    if (descriptionFN.length > 0) {
                        // Join with \n\n to create better paragraph separation
                        designTranslationObjFN.description = descriptionFN.join("\n\n");
                    } 
                    if (x["Metal name"].trim() !== "") {
                        const metal = await Metal.findOne({
                            where: {
                                metal_name: x["Metal name"].trim(),
                            }
                        });
                        if (metal) {
                            metalCode = metal.metal_code || null;
                            if (x["Karat"].trim() !== "") {
                                const karat = await Karat.findOne({
                                    where: {
                                        karat: x["Karat"].trim(),
                                    }
                                });
                                if (karat) {
                                    karatValue = karat.karat;
                                    const MetalRateId = await MetalRateMaster.findOne({
                                        where: {
                                            karat_id: karat.id,
                                            metal_id: metal.id,
                                        }
                                    });
                                    if (MetalRateId) {
                                        designObj.metal_rate_id = MetalRateId.id;
                                    } else {
                                        validationSting.push("Metal rate not found");
                                    }
                                } else {
                                    validationSting.push("Karat not found");
                                }
                            } else {
                                validationSting.push("Karat is required");
                            }
                        } else {
                            validationSting.push("Metal name not found");
                        }
                    } 

                    if (x["Weight"].trim() !== "") {
                        designObj.metal_weight = x["Weight"].trim();
                    }
                    if (x["Mark Up"].trim() !== "") {
                        designObj.mark_up = x["Mark Up"].trim();
                    }
                    if (x["Price flag"].trim() !== "") {
                        designObj.price_flag = x["Price flag"].trim();
                    }
                    if (x["Price"] && x["Price"].trim() !== "") {
                        designObj.price = parseInt(x["Price"].trim()) || 0;
                    }
                    if (x["Diamond Cut"].trim() !== "") {
                        const diamondCut = await CutMaster.findOne({
                            where: {
                                cut_name: x["Diamond Cut"].trim(),
                            }
                        });
                        if (diamondCut) {
                            designDiamondDetailsObj.cut_master_id = diamondCut.id;
                        } else {
                            validationSting.push("Diamond cut not found");
                        }
                    }
                    if (x["Diamond Carat"].trim() !== "" && x["Diamond Type"].trim() !== "" && x["Diamond Clarity"].trim() !== "") {
                        const caratValue = parseFloat(x["Diamond Carat"].trim());
                        const epsilon = 0.0001; // Small tolerance for floating-point comparison
                        const DiamondMasterDetails = await DiamondMaster.findOne({
                            where: {
                                carat: {
                                    [Op.between]: [caratValue - epsilon, caratValue + epsilon]
                                }
                            }
                        });
                        const DiamondTypeDetails = await DiamondType.findOne({
                            where: {
                                type_name: x["Diamond Type"].trim(),
                            }
                        });
                        const DiamondClarityDetails = await DiamondClarity.findOne({
                            where: {
                                clarity: x["Diamond Clarity"].trim(),
                            }
                        });
                        if (DiamondMasterDetails && DiamondTypeDetails && DiamondClarityDetails) {
                            const DiamondRateDetails = await DiamondRate.findOne({
                                where: {
                                    diamond_master_id: DiamondMasterDetails.id,
                                    diamond_type_id: DiamondTypeDetails.id,
                                    clarity_id: DiamondClarityDetails.id,
                                }
                            });
                            if (DiamondRateDetails) {
                                designDiamondDetailsObj.diamond_rate_id = DiamondRateDetails.id;
                                // designDiamondDetailsObj.cut_master_id = diamondCut.id
                                designDiamondDetailsObj.pcs = x["Pcs"].trim();
                            } else {
                                validationSting.push("Diamond rate not found");
                            }
                        } else {
                            validationSting.push("Diamond master, type, or clarity not found");
                        }
                    }
                    if (x["Pcs"].trim() !== "") {
                        designDiamondDetailsObj.pcs = x["Pcs"].trim();
                    }
                    if (x["Diamond Position"].trim() !== "") {
                        if (x["Diamond Position"].trim().toLowerCase().includes("center")) {
                            designDiamondDetailsObj.diamond_position = 1;
                            designDiamondDetailsObj.is_center = 1;
                        } else {
                            designDiamondDetailsObj.diamond_position = 0;
                            designDiamondDetailsObj.is_center = 0;
                        }
                    }
                    if (x["Position Visible"].trim() !== "") {
                        designDiamondDetailsObj.position_visible = x["Position Visible"].trim();
                    }
                    if (validationSting.length !== 0 || duplicationString.length !== 0) {
                        x.success = "false";
                        x.message =
                            validationSting.length == 0
                                ? `DuplicationError:${duplicationString.toString()}`
                                : duplicationString.length == 0
                                    ? `ValidationError:${validationSting.toString()}`
                                    : `DuplicationError:${duplicationString.toString()} & ValidationError:${validationSting.toString()}`;
                        finalList.push(x);
                    }
                    if (validationSting.length == 0 && duplicationString.length == 0) {
                        x.success = "true";
                        x.message = "verified";
                        finalList.push(x);

                        if (
                            Object.keys(designObj).length !== 0 &&
                            designObj.product_id &&
                            designObj.constructor === Object
                        ) {
                            designArray.push(designObj);
                            // Store metal code and karat for SKU generation
                            skuInfoArray.push({
                                metalCode: metalCode,
                                karatValue: karatValue
                            });
                        }
                        // Push both English and Finnish translations
                        if (
                            Object.keys(designTranslationObjEN).length !== 0 &&
                            designTranslationObjEN.constructor === Object
                        ) {
                            designTranslationArray.push(designTranslationObjEN);
                        }
                        if (
                            Object.keys(designTranslationObjFN).length !== 0 &&
                            designTranslationObjFN.constructor === Object
                        ) {
                            designTranslationArray.push(designTranslationObjFN);
                        }
                        // Store diamond details with design index for later insertion
                        // Only insert if both cut_master_id and diamond_rate_id are present (both are required)
                        if (
                            Object.keys(designDiamondDetailsObj).length !== 0 &&
                            designDiamondDetailsObj.constructor === Object &&
                            designDiamondDetailsObj.cut_master_id &&
                            designDiamondDetailsObj.diamond_rate_id
                        ) {
                            designDiamondDetailsArray.push({
                                ...designDiamondDetailsObj,
                                designIndex: designArray.length - 1, // Index in designArray
                                // is_center: designObj.diamond_position === 1 ? 1 : 0
                            });
                        }
                    }
                }
                // return res.json({ designDiamondDetailsArray: designDiamondDetailsArray });

                // Validate: If design has only 1 diamond detail and position_visible is 0, throw validation error
                // Group diamond details by design index
                const diamondDetailsByDesignIndex = new Map();
                designDiamondDetailsArray.forEach((diamondDetail) => {
                    const designIndex = diamondDetail.designIndex;
                    if (!diamondDetailsByDesignIndex.has(designIndex)) {
                        diamondDetailsByDesignIndex.set(designIndex, []);
                    }
                    diamondDetailsByDesignIndex.get(designIndex).push(diamondDetail);
                });

                // Check each design's diamond details
                for (const [designIndex, diamondDetails] of diamondDetailsByDesignIndex) {
                    if (diamondDetails.length === 1) {
                        const singleDiamondDetail = diamondDetails[0];
                        // Check if position_visible is 0 (string or number)
                        const positionVisible = String(singleDiamondDetail.position_visible || '').trim();
                        if (positionVisible === '0' || positionVisible === 0) {
                            // Find the corresponding row in finalList to mark as error
                            const designVariantName = designArray[designIndex]?.design_variant_name || '';
                            // Find and update the row in finalList
                            for (let i = 0; i < finalList.length; i++) {
                                if (finalList[i]["Design Variant Name(EN)"]?.trim() === designVariantName &&
                                    finalList[i].success === "true") {
                                    finalList[i].success = "false";
                                    finalList[i].message = "ValidationError:Please make Position visible flag = 1 because design has 1 diamond details only";
                                    break;
                                }
                            }
                        }
                    }
                }

                //if there is no error then data will ne inserted
                const findingError = finalList.filter((x) => {
                    return x.success === "false";
                });
                if (findingError.length === 0) {
                    // Use transaction for atomic operations
                    const transaction = await sequelize.transaction();
                    try {
                        // Validate array lengths match (should be 2 translations per design)
                        // if (designArray.length * 2 !== designTranslationArray.length) {
                        //     await transaction.rollback();
                        //     return res.status(500).json({
                        //         success: false,
                        //         message: "Internal error: Design and translation arrays length mismatch. Expected 2 translations per design."
                        //     });
                        // }

                        // Count diamond details per design to set is_filter_available
                        const diamondDetailsCountMap = new Map();
                        designDiamondDetailsArray.forEach((diamondDetail) => {
                            const designIndex = diamondDetail.designIndex;
                            diamondDetailsCountMap.set(designIndex, (diamondDetailsCountMap.get(designIndex) || 0) + 1);
                        });

                        // Set is_filter_available for each design
                        for (let i = 0; i < designArray.length; i++) {
                            // Special case: if product_id is 55, set is_filter_available to 2 (MultipleDiamond)
                            if (designArray[i].product_id === 55) {
                                designArray[i].is_filter_available = filterAvailable.TheFlowerType; // 4
                                continue;
                            }
                            else if (categoryId.Bracelets === designArray[i].category_id) {
                                designArray[i].is_filter_available = filterAvailable.PendantsAndNecklacesAndBraceletsAndEarrings; // 3
                                continue;
                            }

                            const diamondCount = diamondDetailsCountMap.get(i) || 0;
                            if (diamondCount === 0) {
                                designArray[i].is_filter_available = filterAvailable.NoDiamond; // 0
                            } else if (diamondCount === 1) {
                                designArray[i].is_filter_available = filterAvailable.SingleDiamond; // 1
                            } else {
                                // Check if any diamond has is_center = 1 for multiple diamonds
                                const hasCenterDiamond = designDiamondDetailsArray.some(
                                    (diamondDetail) => diamondDetail.designIndex === i && diamondDetail.is_center === 1
                                );
                                if (hasCenterDiamond) {
                                    designArray[i].is_filter_available = filterAvailable.CenterDiamondWithMultipleDiamond; // 1
                                } else {
                                    designArray[i].is_filter_available = filterAvailable.MultipleDiamond; // 2
                                }
                            }
                        }

                        // Generate SKU numbers for each design
                        // Track SKU numbers used in this batch to avoid duplicates
                        const skuCounterMap = new Map();

                        for (let i = 0; i < designArray.length; i++) {
                            const skuInfo = skuInfoArray[i];
                            if (skuInfo && skuInfo.metalCode && skuInfo.karatValue) {
                                // Build SKU prefix: KORK + karat + metal_code (e.g., KORK14KTYG)
                                const skuPrefix = `KORK${skuInfo.karatValue.replace(/\s+/g, '')}${skuInfo.metalCode}`;

                                // Check if we've already generated a SKU for this prefix in this batch
                                let nextNumber;
                                if (skuCounterMap.has(skuPrefix)) {
                                    // Increment the counter for this prefix
                                    nextNumber = skuCounterMap.get(skuPrefix) + 1;
                                    skuCounterMap.set(skuPrefix, nextNumber);
                                } else {
                                    // First time seeing this prefix in this batch - find the highest existing SKU
                                    const existingDesigns = await Designs.findAll({
                                        where: {
                                            sku_number: {
                                                [Op.like]: `${skuPrefix}%`
                                            }
                                        },
                                        order: [['sku_number', 'DESC']],
                                        limit: 1,
                                        transaction
                                    });

                                    nextNumber = 1;
                                    if (existingDesigns.length > 0 && existingDesigns[0].sku_number) {
                                        // Extract the number part from existing SKU (e.g., "KORK14KTYG001" -> "001")
                                        const existingSku = existingDesigns[0].sku_number;
                                        const numberPart = existingSku.replace(skuPrefix, '');
                                        const existingNumber = parseInt(numberPart, 10);
                                        if (!isNaN(existingNumber)) {
                                            nextNumber = existingNumber + 1;
                                        }
                                    }
                                    skuCounterMap.set(skuPrefix, nextNumber);
                                }

                                // Format number with leading zeros (001, 002, etc.)
                                const formattedNumber = String(nextNumber).padStart(3, '0');
                                designArray[i].sku_number = `${skuPrefix}${formattedNumber}`;
                            }
                        }

                        // Insert designs using bulkCreate
                        const createdDesigns = await Designs.bulkCreate(designArray, {
                            transaction
                        });

                        // Map design_id to each translation record
                        // Each design has 2 translations (EN and FN) at consecutive indices
                        const translationRecordsWithDesignId = designTranslationArray.map((translation, index) => {
                            // Calculate which design this translation belongs to (every 2 translations = 1 design)
                            const designIndex = Math.floor(index / 2);
                            return {
                                ...translation,
                                design_id: createdDesigns[designIndex].id
                            };
                        });

                        // Insert design translations using bulkCreate
                        await DesignTranslation.bulkCreate(translationRecordsWithDesignId, {
                            transaction
                        });

                        // Insert diamond details with design_id foreign key
                        if (designDiamondDetailsArray.length > 0) {
                            const diamondDetailsWithDesignId = designDiamondDetailsArray.map((diamondDetail) => {
                                const { designIndex, ...diamondDetailData } = diamondDetail;
                                return {
                                    ...diamondDetailData,
                                    design_id: createdDesigns[designIndex].id,
                                    is_center: diamondDetailData.is_center !== undefined ? diamondDetailData.is_center : 0
                                };
                            });

                            await DesignsDiamondDetails.bulkCreate(diamondDetailsWithDesignId, {
                                transaction
                            });
                        }

                        // Commit transaction
                        await transaction.commit();

                        return res.status(200).send({
                            success: true,
                            message: "CSV/Excel file uploaded and data inserted successfully",
                            data: {
                                designArray: createdDesigns.map(design => design.toJSON()),
                                designTranslationArray: translationRecordsWithDesignId,
                            },
                        });
                    } catch (insertError) {
                        // Rollback transaction on error
                        await transaction.rollback();
                        throw insertError;
                    }
                } else {
                    const csv = await converter.json2csvAsync(finalList);
                    let writeNewCSV = {
                        name: `${req.file.originalname}`,
                        type: "text/csv",
                        data: csv,
                        path: ["design", "csv", `${req.file.originalname}`].join("/"),
                    };
                    // replace new file with error log
                    await saveToBucket(writeNewCSV);

                    // Generate presigned URL since public ACL is blocked by bucket settings
                    const s3Key = `${process.env.AWS_BUCKET_NAME}/design/csv/${req.file.originalname}`;
                    const url = await getPresignedUrl(s3Key, 3600 * 24 * 7); // 7 days expiry

                    return res.status(200).send({
                        success: false,
                        csvError: 1,
                        url,
                        message:
                            "Please solve error first then upload " + req.file.originalname,
                    });
                }
            } catch (error) {
                console.log("S3 CSV Upload Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload CSV/Excel file to S3",
                    error: error.message,
                });
            }
        },
        updateCsv: async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Please upload a CSV or Excel file (csv/xlsx/xls)",
                    });
                }

                // Validate that file was properly uploaded
                if (!req.file.key) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed: S3 key is missing",
                    });
                }

                const s3Key = req.file.key;
                const path = await getS3Object(s3Key);
                const csvString = await path.Body.transformToString("utf8");
                await deleteFromBucket(s3Key);

                // Configure csvtojson to preserve encoding and handle special characters properly (especially for Finnish)
                const sources = await csvtojson({
                    checkType: false, // Don't auto-convert types, preserve as strings
                    encoding: 'utf8'
                }).fromString(csvString);

                // Validate CSV format - SKU Number is the first column, then all other columns
                // Check for required columns - now includes P1 and P2 for both languages
                const requiredColumns = [
                    "SKU Number",
                    "Product Name",
                    "Design Variant Name(EN)",
                    "Design Variant Name(FN)",
                    "Description(EN)-P1",
                    "Description(EN)-P2",
                    "Description(FN)-P1",
                    "Description(FN)-P2",
                    "Metal name",
                    "Karat",
                    "Weight",
                    "Mark Up",
                    "Diamond Cut",
                    "Diamond Carat",
                    "Diamond Type",
                    "Diamond Clarity",
                    "Pcs",
                    "Diamond Position",
                    "Position Visible",
                    "Price flag",
                    "Price"
                ];

                const sourceKeys = Object.keys(sources[0]);
                const hasAllRequiredColumns = requiredColumns.every((col, index) => {
                    return sourceKeys[index] === col;
                });

                if (!hasAllRequiredColumns) {
                    return res.status(422).json({
                        success: false,
                        message: "Invalid File Format. First column must be 'SKU Number'"
                    });
                }

                let finalList = [];
                // Group rows by SKU Number (carry forward SKU from previous row if empty)
                let currentSku = null;
                let groupedBySku = new Map();

                for (const x of sources) {
                    // If SKU Number is provided, use it; otherwise use the last seen SKU
                    if (x["SKU Number"] && x["SKU Number"].trim() !== "") {
                        currentSku = x["SKU Number"].trim();
                    }

                    // Skip if no SKU has been set yet
                    if (!currentSku) {
                        x.success = "false";
                        x.message = "ValidationError:SKU Number is required in the first row";
                        finalList.push(x);
                        continue;
                    }

                    // Group rows by SKU
                    if (!groupedBySku.has(currentSku)) {
                        groupedBySku.set(currentSku, []);
                    }
                    groupedBySku.get(currentSku).push(x);
                }

                // Process each SKU group
                let updateOperations = [];

                for (const [skuNumber, rows] of groupedBySku) {
                    // Find existing design by SKU number
                    const existingDesign = await Designs.findOne({
                        where: {
                            sku_number: skuNumber,
                        }
                    });

                    if (!existingDesign) {
                        // Mark all rows for this SKU as error
                        for (const x of rows) {
                            x.success = "false";
                            x.message = "ValidationError:Design with SKU Number not found";
                            finalList.push(x);
                        }
                        continue;
                    }

                    // Process all rows for this SKU
                    let designObj = {};
                    let designTranslationObjEN = {};
                    let designTranslationObjFN = {};
                    let diamondDetailsArray = [];
                    let hasValidationError = false;

                    for (const x of rows) {
                        let validationSting = [];
                        let duplicationString = [];

                        // Use the first row's data for design-level updates (Product Name, Variant Name, Metal, etc.)
                        // Only process these fields from the first row
                        if (rows.indexOf(x) === 0) {
                            // Process Product Name if provided
                            if (x["Product Name"] && x["Product Name"].trim() !== "") {
                                const product = await Product.findOne({
                                    include: [
                                        {
                                            model: ProductTranslation,
                                            as: 'product_translations',
                                            where: {
                                                language_id: languageId.English,
                                                product_name: x["Product Name"].trim(),
                                            }
                                        }
                                    ]
                                });
                                if (!product) {
                                    validationSting.push("Product name not found");
                                } else {
                                    designObj.product_id = product.id;
                                    designObj.category_id = product.category_id;
                                    designObj.sub_category_id = product.sub_category_id;
                                }
                            }

                            // Process English translation
                            if (x["Design Variant Name(EN)"] && x["Design Variant Name(EN)"].trim() !== "") {
                                designObj.design_variant_name = x["Design Variant Name(EN)"].trim();
                                designTranslationObjEN.design_variant_name = x["Design Variant Name(EN)"].trim();
                                designTranslationObjEN.language_id = languageId.English;
                            }
                            // Concatenate P1 and P2 with \n\n for English description
                            let descriptionEN = [];
                            if (x["Description(EN)-P1"] && typeof x["Description(EN)-P1"] === 'string' && x["Description(EN)-P1"].trim() !== "") {
                                descriptionEN.push(x["Description(EN)-P1"].trim());
                            }
                            if (x["Description(EN)-P2"] && typeof x["Description(EN)-P2"] === 'string' && x["Description(EN)-P2"].trim() !== "") {
                                descriptionEN.push(x["Description(EN)-P2"].trim());
                            }
                            if (descriptionEN.length > 0) {
                                designTranslationObjEN.description = descriptionEN.join("\n\n");
                            }

                            // Process Finnish translation
                            if (x["Design Variant Name(FN)"] && x["Design Variant Name(FN)"].trim() !== "") {
                                designTranslationObjFN.design_variant_name = x["Design Variant Name(FN)"].trim();
                                designTranslationObjFN.language_id = languageId.Finnish;
                            }
                            // Concatenate P1 and P2 with \n\n for Finnish description
                            let descriptionFN = [];
                            // Preserve exact content from Excel with proper encoding for Finnish special characters (ä, ö, å)
                            if (x["Description(FN)-P1"] !== undefined && x["Description(FN)-P1"] !== null && x["Description(FN)-P1"] !== "") {
                                const p1Value = String(x["Description(FN)-P1"]).trim();
                                if (p1Value !== "") {
                                    descriptionFN.push(p1Value);
                                }
                            }
                            if (x["Description(FN)-P2"] !== undefined && x["Description(FN)-P2"] !== null && x["Description(FN)-P2"] !== "") {
                                const p2Value = String(x["Description(FN)-P2"]).trim();
                                if (p2Value !== "") {
                                    descriptionFN.push(p2Value);
                                }
                            }
                            if (descriptionFN.length > 0) {
                                // Join with \n\n to create better paragraph separation
                                designTranslationObjFN.description = descriptionFN.join("\n\n");
                            }

                            // Process Metal and Karat
                            if (x["Metal name"] && x["Metal name"].trim() !== "") {
                                const metal = await Metal.findOne({
                                    where: {
                                        metal_name: x["Metal name"].trim(),
                                    }
                                });
                                if (metal) {
                                    if (x["Karat"] && x["Karat"].trim() !== "") {
                                        const karat = await Karat.findOne({
                                            where: {
                                                karat: x["Karat"].trim(),
                                            }
                                        });
                                        if (karat) {
                                            const MetalRateId = await MetalRateMaster.findOne({
                                                where: {
                                                    karat_id: karat.id,
                                                    metal_id: metal.id,
                                                }
                                            });
                                            if (MetalRateId) {
                                                designObj.metal_rate_id = MetalRateId.id;
                                            } else {
                                                validationSting.push("Metal rate not found");
                                            }
                                        } else {
                                            validationSting.push("Karat not found");
                                        }
                                    } else {
                                        validationSting.push("Karat is required when Metal name is provided");
                                    }
                                } else {
                                    validationSting.push("Metal name not found");
                                }
                            }

                            if (x["Weight"] && x["Weight"].trim() !== "") {
                                designObj.metal_weight = x["Weight"].trim();
                            }
                            if (x["Mark Up"] && x["Mark Up"].trim() !== "") {
                                designObj.mark_up = x["Mark Up"].trim();
                            }
                            if (x["Price flag"] && x["Price flag"].trim() !== "") {
                                designObj.price_flag = x["Price flag"].trim();
                            }
                            if (x["Price"] && x["Price"].trim() !== "") {
                                designObj.price = parseInt(x["Price"].trim()) || 0;
                            }
                        }

                        // Process Diamond details for each row (all rows can have diamond details)
                        let designDiamondDetailsObj = {};

                        if (x["Diamond Cut"] && x["Diamond Cut"].trim() !== "") {
                            const diamondCut = await CutMaster.findOne({
                                where: {
                                    cut_name: x["Diamond Cut"].trim(),
                                }
                            });
                            if (diamondCut) {
                                designDiamondDetailsObj.cut_master_id = diamondCut.id;
                            } else {
                                validationSting.push("Diamond cut not found");
                            }
                        }

                        if (x["Diamond Carat"] && x["Diamond Carat"].trim() !== "" &&
                            x["Diamond Type"] && x["Diamond Type"].trim() !== "" &&
                            x["Diamond Clarity"] && x["Diamond Clarity"].trim() !== "") {
                            const caratValue = parseFloat(x["Diamond Carat"].trim());
                            const epsilon = 0.0001;
                            const DiamondMasterDetails = await DiamondMaster.findOne({
                                where: {
                                    carat: {
                                        [Op.between]: [caratValue - epsilon, caratValue + epsilon]
                                    }
                                }
                            });
                            const DiamondTypeDetails = await DiamondType.findOne({
                                where: {
                                    type_name: x["Diamond Type"].trim(),
                                }
                            });
                            const DiamondClarityDetails = await DiamondClarity.findOne({
                                where: {
                                    clarity: x["Diamond Clarity"].trim(),
                                }
                            });
                            if (DiamondMasterDetails && DiamondTypeDetails && DiamondClarityDetails) {
                                const DiamondRateDetails = await DiamondRate.findOne({
                                    where: {
                                        diamond_master_id: DiamondMasterDetails.id,
                                        diamond_type_id: DiamondTypeDetails.id,
                                        clarity_id: DiamondClarityDetails.id,
                                    }
                                });
                                if (DiamondRateDetails) {
                                    designDiamondDetailsObj.diamond_rate_id = DiamondRateDetails.id;
                                    if (x["Pcs"] && x["Pcs"].trim() !== "") {
                                        designDiamondDetailsObj.pcs = x["Pcs"].trim();
                                    }
                                } else {
                                    validationSting.push("Diamond rate not found");
                                }
                            } else {
                                validationSting.push("Diamond master, type, or clarity not found");
                            }
                        }

                        if (x["Pcs"] && x["Pcs"].trim() !== "") {
                            designDiamondDetailsObj.pcs = x["Pcs"].trim();
                        }

                        if (x["Diamond Position"] && x["Diamond Position"].trim() !== "") {
                            if (x["Diamond Position"].trim().toLowerCase().includes("center")) {
                                designDiamondDetailsObj.diamond_position = 1;
                                designDiamondDetailsObj.is_center = 1;
                            } else {
                                designDiamondDetailsObj.diamond_position = 0;
                                designDiamondDetailsObj.is_center = 0;
                            }
                        }

                        if (x["Position Visible"] && x["Position Visible"].trim() !== "") {
                            designDiamondDetailsObj.position_visible = x["Position Visible"].trim();
                        }

                        // Check for validation errors
                        if (validationSting.length !== 0 || duplicationString.length !== 0) {
                            x.success = "false";
                            x.message =
                                validationSting.length == 0
                                    ? `DuplicationError:${duplicationString.toString()}`
                                    : duplicationString.length == 0
                                        ? `ValidationError:${validationSting.toString()}`
                                        : `DuplicationError:${duplicationString.toString()} & ValidationError:${validationSting.toString()}`;
                            finalList.push(x);
                            hasValidationError = true;
                        } else {
                            x.success = "true";
                            x.message = "verified";
                            finalList.push(x);

                            // Add diamond details if valid
                            if (Object.keys(designDiamondDetailsObj).length > 0 &&
                                designDiamondDetailsObj.cut_master_id &&
                                designDiamondDetailsObj.diamond_rate_id) {
                                diamondDetailsArray.push(designDiamondDetailsObj);
                            }
                        }
                    }

                    // Validate: If design has only 1 diamond detail and position_visible is 0, throw validation error
                    if (!hasValidationError && diamondDetailsArray.length === 1) {
                        const singleDiamondDetail = diamondDetailsArray[0];
                        // Check if position_visible is 0 (string or number)
                        const positionVisible = String(singleDiamondDetail.position_visible || '').trim();
                        if (positionVisible === '0' || positionVisible === 0) {
                            // Mark all rows for this SKU as error
                            for (const x of rows) {
                                if (x.success === "true") {
                                    x.success = "false";
                                    x.message = "ValidationError:Please make Position visible flag = 1 because design has 1 diamond details only";
                                }
                            }
                            hasValidationError = true;
                        }
                    }

                    // If no validation errors for this SKU group, add to update operations
                    if (!hasValidationError) {
                        updateOperations.push({
                            skuNumber: skuNumber,
                            designId: existingDesign.id,
                            existingDesign: existingDesign,
                            designObj: designObj,
                            designTranslationObjEN: designTranslationObjEN,
                            designTranslationObjFN: designTranslationObjFN,
                            diamondDetailsArray: diamondDetailsArray
                        });
                    }
                }

                // Check if there are any errors
                const findingError = finalList.filter((x) => {
                    return x.success === "false";
                });

                if (findingError.length === 0) {
                    // Use transaction for atomic operations
                    const transaction = await sequelize.transaction();
                    try {
                        const updatedDesigns = [];
                        const updatedTranslations = [];
                        const updatedDiamondDetails = [];

                        for (const updateOp of updateOperations) {
                            const { designId, designObj, existingDesign, diamondDetailsArray } = updateOp;

                            // Only update fields that were provided (non-empty)
                            const fieldsToUpdate = {};
                            Object.keys(designObj).forEach(key => {
                                if (designObj[key] !== undefined && designObj[key] !== null && designObj[key] !== '') {
                                    fieldsToUpdate[key] = designObj[key];
                                }
                            });
                            // Determine is_filter_available based on diamond details count
                            // Special case: if product_id is 55, set is_filter_available to 2 (MultipleDiamond)
                            const productId = existingDesign.product_id || designObj.product_id;
                            if (productId === 55) {
                                fieldsToUpdate.is_filter_available = filterAvailable.TheFlowerType; // 4
                            } else if (categoryId.Bracelets === existingDesign.category_id) {
                                fieldsToUpdate.is_filter_available = filterAvailable.PendantsAndNecklacesAndBraceletsAndEarrings; // 3
                            } else if (diamondDetailsArray.length > 0) {
                                // We're updating diamond details - set based on new count
                                if (diamondDetailsArray.length === 0) {
                                    fieldsToUpdate.is_filter_available = filterAvailable.NoDiamond;
                                } else if (diamondDetailsArray.length === 1) {
                                    fieldsToUpdate.is_filter_available = filterAvailable.SingleDiamond;
                                } else {
                                    // Check if any diamond has is_center = 1 for multiple diamonds
                                    const hasCenterDiamond = diamondDetailsArray.some(
                                        (diamondDetail) => diamondDetail.is_center === 1
                                    );
                                    if (hasCenterDiamond) {
                                        fieldsToUpdate.is_filter_available = filterAvailable.CenterDiamondWithMultipleDiamond; // 1
                                    } else {
                                        fieldsToUpdate.is_filter_available = filterAvailable.MultipleDiamond; // 2
                                    }
                                }
                            } else {
                                // No diamond details being updated, check existing count to maintain current state
                                const existingDiamondDetails = await DesignsDiamondDetails.findAll({
                                    where: { design_id: designId },
                                    transaction
                                });
                                if (existingDiamondDetails.length === 0) {
                                    fieldsToUpdate.is_filter_available = filterAvailable.NoDiamond;
                                } else if (existingDiamondDetails.length === 1) {
                                    fieldsToUpdate.is_filter_available = filterAvailable.SingleDiamond;
                                } else {
                                    // Check if any diamond has is_center = 1 for multiple diamonds
                                    const hasCenterDiamond = existingDiamondDetails.some(
                                        (diamondDetail) => diamondDetail.is_center === 1
                                    );
                                    if (hasCenterDiamond) {
                                        fieldsToUpdate.is_filter_available = filterAvailable.CenterDiamondWithMultipleDiamond; // 1
                                    } else {
                                        fieldsToUpdate.is_filter_available = filterAvailable.MultipleDiamond; // 2
                                    }
                                }
                            }

                            // Update design if there are fields to update
                            if (Object.keys(fieldsToUpdate).length > 0) {
                                await Designs.update(fieldsToUpdate, {
                                    where: { id: designId },
                                    transaction
                                });
                                const updatedDesign = await Designs.findByPk(designId, { transaction });
                                updatedDesigns.push(updatedDesign);
                            } else {
                                updatedDesigns.push(existingDesign);
                            }

                            // Update or create English translation
                            if (Object.keys(updateOp.designTranslationObjEN).length > 0) {
                                const existingTranslationEN = await DesignTranslation.findOne({
                                    where: {
                                        design_id: designId,
                                        language_id: languageId.English
                                    },
                                    transaction
                                });

                                if (existingTranslationEN) {
                                    await DesignTranslation.update(updateOp.designTranslationObjEN, {
                                        where: {
                                            design_id: designId,
                                            language_id: languageId.English
                                        },
                                        transaction
                                    });
                                    const updated = await DesignTranslation.findOne({
                                        where: {
                                            design_id: designId,
                                            language_id: languageId.English
                                        },
                                        transaction
                                    });
                                    updatedTranslations.push(updated);
                                } else {
                                    updateOp.designTranslationObjEN.design_id = designId;
                                    const created = await DesignTranslation.create(updateOp.designTranslationObjEN, { transaction });
                                    updatedTranslations.push(created);
                                }
                            }

                            // Update or create Finnish translation
                            if (Object.keys(updateOp.designTranslationObjFN).length > 0) {
                                const existingTranslationFN = await DesignTranslation.findOne({
                                    where: {
                                        design_id: designId,
                                        language_id: languageId.Finnish
                                    },
                                    transaction
                                });

                                if (existingTranslationFN) {
                                    await DesignTranslation.update(updateOp.designTranslationObjFN, {
                                        where: {
                                            design_id: designId,
                                            language_id: languageId.Finnish
                                        },
                                        transaction
                                    });
                                    const updated = await DesignTranslation.findOne({
                                        where: {
                                            design_id: designId,
                                            language_id: languageId.Finnish
                                        },
                                        transaction
                                    });
                                    updatedTranslations.push(updated);
                                } else {
                                    updateOp.designTranslationObjFN.design_id = designId;
                                    const created = await DesignTranslation.create(updateOp.designTranslationObjFN, { transaction });
                                    updatedTranslations.push(created);
                                }
                            }

                            // Handle diamond details - delete existing and create new ones from array
                            if (diamondDetailsArray.length > 0) {
                                // Delete existing diamond details for this design
                                await DesignsDiamondDetails.destroy({
                                    where: { design_id: designId },
                                    transaction
                                });

                                // Create all new diamond details
                                const diamondDetailsToCreate = diamondDetailsArray.map(detail => ({
                                    design_id: designId,
                                    cut_master_id: detail.cut_master_id,
                                    diamond_rate_id: detail.diamond_rate_id,
                                    pcs: detail.pcs || 0,
                                    is_center: detail.is_center !== undefined ? detail.is_center : 0,
                                    position_visible: detail.position_visible !== undefined ? detail.position_visible : 1
                                }));

                                const createdDiamondDetails = await DesignsDiamondDetails.bulkCreate(diamondDetailsToCreate, { transaction });
                                updatedDiamondDetails.push(...createdDiamondDetails);
                            }
                        }

                        // Commit transaction
                        await transaction.commit();

                        return res.status(200).send({
                            success: true,
                            message: "CSV/Excel file uploaded and data updated successfully",
                            data: {
                                designArray: updatedDesigns.map(design => design.toJSON()),
                                designTranslationArray: updatedTranslations.map(trans => trans.toJSON()),
                                diamondDetailsArray: updatedDiamondDetails.map(detail => detail.toJSON()),
                            },
                        });
                    } catch (updateError) {
                        // Rollback transaction on error
                        await transaction.rollback();
                        throw updateError;
                    }
                } else {
                    const csv = await converter.json2csvAsync(finalList);
                    let writeNewCSV = {
                        name: `${req.file.originalname}`,
                        type: "text/csv",
                        data: csv,
                        path: ["design", "csv", `${req.file.originalname}`].join("/"),
                    };
                    // replace new file with error log
                    await saveToBucket(writeNewCSV);

                    // Generate presigned URL since public ACL is blocked by bucket settings
                    const s3Key = `${process.env.AWS_BUCKET_NAME}/design/csv/${req.file.originalname}`;
                    const url = await getPresignedUrl(s3Key, 3600 * 24 * 7); // 7 days expiry

                    return res.status(200).send({
                        success: false,
                        csvError: 1,
                        url,
                        message:
                            "Please solve error first then upload " + req.file.originalname,
                    });
                }
            } catch (error) {
                console.log("S3 CSV Update Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to update CSV/Excel file from S3",
                    error: error.message,
                });
            }
        },
        relatedProductDetailsForEcom: async (req, res) => {
            try {
            // If product_id is provided, fetch its sub_category_id first
            let targetSubCategoryId = null;
            if (req.query.product_id !== undefined && req.query.product_id !== null && req.query.product_id !== '') {
                const sourceProduct = await Product.findOne({
                    where: { id: req.query.product_id },
                    attributes: ['id', 'sub_category_id', 'category_id']
                });

                if (!sourceProduct) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }

                // Use the source product's sub_category_id and category_id
                targetSubCategoryId = sourceProduct.sub_category_id;
                
                // If sub_category_id is null, return empty array
                if (targetSubCategoryId === null || targetSubCategoryId === undefined) {
                    return res.status(200).json({
                        success: true,
                        message: "Product list fetched successfully",
                        data: [],
                    });
                }
            }

            // Build where clause conditionally
            const productWhere = {
                is_display: 1,
                category_id: req.query.category_id
            };

            // Filter by sub_category_id from the source product if product_id is provided
            // Otherwise, use sub_category_id from query params if provided
            if (targetSubCategoryId !== null) {
                productWhere.sub_category_id = targetSubCategoryId;
            } else if (req.query.sub_category_id !== undefined && req.query.sub_category_id !== null && req.query.sub_category_id !== '') {
                productWhere.sub_category_id = req.query.sub_category_id;
            }

            // Only add style_id filter if it's provided
            if (req.query.style_id !== undefined && req.query.style_id !== null && req.query.style_id !== '') {
                productWhere.style_id = req.query.style_id;
            }

            // Exclude product_id if provided in query params (to get other products)
            if (req.query.product_id !== undefined && req.query.product_id !== null && req.query.product_id !== '') {
                productWhere.id = { [Op.ne]: req.query.product_id };
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

            // Build design where clause - exclude design_id if provided
            const designWhere = {
                product_id: { [Op.in]: filteredProductIds },
                price_flag: { [Op.ne]: 0 }
            };

            // Exclude design_id if provided in query params
            if (req.query.design_id !== undefined && req.query.design_id !== null && req.query.design_id !== '') {
                designWhere.id = { [Op.ne]: req.query.design_id };
            }

            // Fetch all designs for these products with full details
            const allDesigns = await Designs.findAll({
                where: designWhere,
                include: [
                    {
                        model: MetalRateMaster,
                        as: 'metal_rate',
                        attributes: ['id', 'metal_id', 'karat_id', 'rate'],
                        where: { metal_id: 1 },
                        required: true,
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
                        // where: req.query.language_id ? { language_id: req.query.language_id } : undefined,
                        required: false,
                        separate: true,
                        include: [
                            { model: Language, as: 'language', attributes: ['id', 'language_name', 'language_code'] }
                        ]
                    }
                ]
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

            // Create a map of product_id to product info
            const productInfoMap = new Map();
            productData.forEach(item => {
                productInfoMap.set(item.product.id, item);
            });

            if (productInfoMap.size === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Product list fetched successfully",
                    data: [],
                });
            }

            // Calculate total price for each design
            // Formula: TotalPrice = ((MetalWeight × RatePerGram) + (DiamondPieces × DiamondSize × DiamondRatePerCarat)) × Markup
            const designsWithPrice = [];
            
            allDesigns.forEach(design => {
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
                    design: design,
                    totalPrice: priceForComparison,
                    calculatedPrice: calculatedPrice, // Keep calculated price for display
                    product_id: design.product_id
                });
            });

            // Group designs by product_id and find lowest price design for each product
            const designsByProduct = new Map();
            
            designsWithPrice.forEach(item => {
                const productId = item.product_id;
                if (!designsByProduct.has(productId)) {
                    designsByProduct.set(productId, item);
                } else {
                    // Compare and keep the one with lower price
                    const existing = designsByProduct.get(productId);
                    if (item.totalPrice < existing.totalPrice) {
                        designsByProduct.set(productId, item);
                    }
                }
            });

            // Build response with design details - one design per product (lowest price)
            const dataWithUrls = Array.from(designsByProduct.values()).map(item => {
                // Convert design to JSON to add computed fields
                const designData = item.design.toJSON ? item.design.toJSON() : item.design;
                const productInfo = productInfoMap.get(item.product_id);

                if (!productInfo) {
                    return null;
                }

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

                // Keep design_translations as array (not converting to single object)
                // design_translations will remain as an array of translation objects

                // Get image where is_product_listing is 1, or use product image as fallback
                let productImage = constructImageUrl(productInfo.product.image, 'product');
                if (designData.images && designData.images.length > 0) {
                    const listingImage = designData.images.find(img => img.is_product_listing === 1);
                    if (listingImage) {
                        productImage = listingImage.image_url;
                    }
                }

                // Add total_price to design data based on price_flag
                // Support for two languages: English (1) and Finnish (2)
                const currentLanguageId = parseInt(req.query.language_id) || languageId.English; // Default to English (1) if not specified
                const startingFromText = priceMessages.startingFrom[currentLanguageId] || priceMessages.startingFrom[languageId.English];
                const enquirePriceText = priceMessages.enquirePrice[currentLanguageId] || priceMessages.enquirePrice[languageId.English];

                // Use calculatedPrice for display when needed (price_flag == 1 or fallback)
                const calculatedPrice = item.calculatedPrice || item.totalPrice;
                const calculatedRounded = Math.round(calculatedPrice);
                const dbPrice = Number(designData.price || 0);
                const dbPriceRounded = Math.round(dbPrice);

                // Parse price_flag to handle both string and number types
                const priceFlagValue = parseInt(designData.price_flag) || 0;

                // Initialize total_price - ensure it's always set fresh, never append
                let totalPriceValue = null;

                // Only ONE condition should execute per design
                if (priceFlagValue === 1 || priceFlagValue === priceFlag.Set) {
                    // Condition 1: price_flag == 1: Show calculated price
                    totalPriceValue = `${priceMessages.currencySymbol}${calculatedRounded}`;
                } else if (priceFlagValue === 2) {
                    // Condition 2: price_flag == 2: Show "Starting From {price from database}" and "Please enquire" (or calculated if price == 0)
                    const basePrice = dbPrice > 0 ? dbPriceRounded : calculatedRounded;
                    totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${basePrice} ${enquirePriceText}`;
                } else if (priceFlagValue === 4 && dbPrice === 0) {
                    // Condition 3: price_flag == 4 AND designs.price == 0: Show "Please enquire" message only
                    totalPriceValue = enquirePriceText;
                } else {
                    // Fallback: Show calculated price (for price_flag == 0 or other values)
                    // totalPriceValue = `${startingFromText} ${priceMessages.currencySymbol}${calculatedRounded} ${enquirePriceText}`;
                    totalPriceValue = `${enquirePriceText}`;
                }

                // Set total_price only once, ensuring no duplication
                designData.total_price = totalPriceValue;

                return {
                    id: productInfo.product.id,
                    product_name: productInfo.product_name,
                    image: productImage,
                    category_id: productInfo.product.category_id,
                    sub_category_id: productInfo.product.sub_category_id,
                    style_id: productInfo.product.style_id,
                    design: designData,
                    total_price: designData.total_price
                };
            }).filter(item => item !== null); // Filter out any null items

            return res.status(200).json({
                success: true,
                message: "Related product details fetched successfully",
                data: dataWithUrls,
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
        exportDesign: async (req, res) => {
            try {
            
                const productIDS = req.query.productIDS;
            
                const designs = await Designs.findAll({
                    where: {
                        product_id: { [Op.in]: JSON.parse(productIDS) }
                    },
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                {
                                    model: ProductTranslation,
                                    as: 'product_translations',
                                    include: [
                                        {
                                            model: Language,
                                            as: 'language',
                                            attributes: ['id', 'language_code']
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: MetalRateMaster,
                            as: 'metal_rate',
                            include: [
                                {
                                    model: Metal,
                                    as: 'metal',
                                    attributes: ['id', 'metal_name']
                                },
                                {
                                    model: Karat,
                                    as: 'karat',
                                    attributes: ['id', 'karat']
                                }
                            ]
                        },
                        {
                            model: DesignTranslation,
                            as: 'design_translations',
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_code']
                                }
                            ]
                        },
                        {
                            model: DesignsDiamondDetails,
                            as: 'diamond_details',
                            include: [
                                {
                                    model: CutMaster,
                                    as: 'cut_master',
                                    attributes: ['id', 'cut_name']
                                },
                                {
                                    model: DiamondRate,
                                    as: 'diamond_rate',
                                    attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id'],
                                    include: [
                                        {
                                            model: DiamondMaster,
                                            as: 'diamond_master',
                                            attributes: ['id', 'carat']
                                        },
                                        {
                                            model: DiamondType,
                                            as: 'diamond_type',
                                            attributes: ['id', 'type_name']
                                        },
                                        {
                                            model: DiamondClarity,
                                            as: 'clarity',
                                            attributes: ['id', 'clarity']
                                        }
                                    ]
                                }
                            ],
                            order: [['id', 'ASC']]
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                if (!designs || designs.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "No designs found to export"
                    });
                }

               
                const designsByProduct = new Map();
                
                for (const design of designs) {
                    const productId = design.product_id;
                    if (!designsByProduct.has(productId)) {
                        designsByProduct.set(productId, []);
                    }
                    designsByProduct.get(productId).push(design);
                }

                // Helper function to split description into two paragraphs
                const splitDescription = (description) => {
                    if (!description || typeof description !== 'string') {
                        return { p1: '', p2: '' };
                    }
                    
                    let trimmed = description.trim();
                    if (!trimmed) {
                        return { p1: '', p2: '' };
                    }
                    
                    // Try splitting by double newlines first (standard paragraph separator)
                    let paragraphs = trimmed.split(/\n\n+/);
                    if (paragraphs.length >= 2) {
                        return {
                            p1: paragraphs[0].trim(),
                            p2: paragraphs.slice(1).join('\n\n').trim()
                        };
                    }
                    
                    // Try splitting by single newline
                    paragraphs = trimmed.split(/\n+/);
                    if (paragraphs.length >= 2) {
                        return {
                            p1: paragraphs[0].trim(),
                            p2: paragraphs.slice(1).join('\n').trim()
                        };
                    }
                    
                    // If single paragraph, try to split at first sentence boundary
                    // Look for period followed by space (but not at the end)
                    const sentenceMatch = trimmed.match(/^(.+?\.\s+)(.+)$/);
                    if (sentenceMatch) {
                        return {
                            p1: sentenceMatch[1].trim(),
                            p2: sentenceMatch[2].trim()
                        };
                    }
                    
                    // If can't be split meaningfully, put all in P1
                    return {
                        p1: trimmed,
                        p2: ''
                    };
                };

                const exportData = [];
                for (const [productId, productDesigns] of designsByProduct.entries()) {
                    for (const design of productDesigns) {
                        const productNameEN = design.product?.product_translations?.find(
                            pt => pt.language_id === languageId.English
                        )?.product_name || '';

                        const translationEN = design.design_translations?.find(
                            dt => dt.language_id === languageId.English
                        );
                        const translationFN = design.design_translations?.find(
                            dt => dt.language_id === languageId.Finnish
                        );

                        const metalName = design.metal_rate?.metal?.metal_name || '';
                        const karatValue = design.metal_rate?.karat?.karat || '';

                        // Split descriptions into two paragraphs
                        const descriptionEN = splitDescription(translationEN?.description || '');
                        const descriptionFN = splitDescription(translationFN?.description || '');

                        const diamondDetailsArray = [];
                        if (design.diamond_details && design.diamond_details.length > 0) {
                            for (const diamondDetail of design.diamond_details) {
                                const cutName = diamondDetail.cut_master?.cut_name || '';
                                const diamondCarat = diamondDetail.diamond_rate?.diamond_master?.carat?.toString() || '';
                                const diamondType = diamondDetail.diamond_rate?.diamond_type?.type_name || '';
                                const diamondClarity = diamondDetail.diamond_rate?.clarity?.clarity || '';
                                const pcs = diamondDetail.pcs?.toString() || '';
                                
                                const diamondPosition = diamondDetail.is_center === 1 ? 'Center diamond' : 'other';
                                
                                const positionVisible = diamondDetail.position_visible?.toString() || '0';

                                diamondDetailsArray.push({
                                    'Diamond Cut': cutName,
                                    'Diamond Carat': diamondCarat,
                                    'Diamond Type': diamondType,
                                    'Diamond Clarity': diamondClarity,
                                    'Pcs': pcs,
                                    'Diamond Position': diamondPosition,
                                    'Position Visible': positionVisible
                                });
                            }
                        }

                        exportData.push({
                            'Product Name': productNameEN,
                            'Design Variant Name(EN)': translationEN?.design_variant_name || design.design_variant_name || '',
                            'Design Variant Name(FN)': translationFN?.design_variant_name || '',
                            'Description(EN)-P1': descriptionEN.p1,
                            'Description(EN)-P2': descriptionEN.p2,
                            'Description(FN)-P1': descriptionFN.p1,
                            'Description(FN)-P2': descriptionFN.p2,
                            'Metal name': metalName,
                            'Karat': karatValue,
                            'Weight': design.metal_weight?.toString() || '',
                            'Mark Up': design.mark_up?.toString() || '',
                            'Price flag': design.price_flag?.toString() || '0',
                            'SKU Number': design.sku_number || '',
                            'diamond_details': diamondDetailsArray,
                            'Price': design.price?.toString() || ''
                        });
                    }
                }

                exportData.sort((a, b) => {
                    const productNameA = a['Product Name'] || '';
                    const productNameB = b['Product Name'] || '';
                    return productNameA.localeCompare(productNameB);
                });

                const format = req.query.format || 'csv';
                
                if (format === 'json') {
                    return res.status(200).json({
                        success: true,
                        message: "Design variants exported successfully",
                        data: exportData
                    });
                }

                const csvData = [];
                for (const designData of exportData) {
                    const { diamond_details, ...baseData } = designData;
                    
                    if (diamond_details && diamond_details.length > 0) {
                        for (let i = 0; i < diamond_details.length; i++) {
                            const diamondDetail = diamond_details[i];
                            const isFirstRow = i === 0;
                            
                            csvData.push({
                                'SKU Number': isFirstRow ? baseData['SKU Number'] : '',
                                'Product Name': isFirstRow ? baseData['Product Name'] : '',
                                'Design Variant Name(EN)': isFirstRow ? baseData['Design Variant Name(EN)'] : '',
                                'Design Variant Name(FN)': isFirstRow ? baseData['Design Variant Name(FN)'] : '',
                                'Description(EN)-P1': isFirstRow ? baseData['Description(EN)-P1'] : '',
                                'Description(EN)-P2': isFirstRow ? baseData['Description(EN)-P2'] : '',
                                'Description(FN)-P1': isFirstRow ? baseData['Description(FN)-P1'] : '',
                                'Description(FN)-P2': isFirstRow ? baseData['Description(FN)-P2'] : '',
                                'Metal name': isFirstRow ? baseData['Metal name'] : '',
                                'Karat': isFirstRow ? baseData['Karat'] : '',
                                'Weight': isFirstRow ? baseData['Weight'] : '',
                                'Mark Up': isFirstRow ? baseData['Mark Up'] : '',
                                'Diamond Cut': diamondDetail['Diamond Cut'],
                                'Diamond Carat': diamondDetail['Diamond Carat'],
                                'Diamond Type': diamondDetail['Diamond Type'],
                                'Diamond Clarity': diamondDetail['Diamond Clarity'],
                                'Pcs': diamondDetail['Pcs'],
                                'Diamond Position': diamondDetail['Diamond Position'],
                                'Position Visible': diamondDetail['Position Visible'],
                                'Price flag': isFirstRow ? baseData['Price flag'] : '',
                                'Price': isFirstRow ? baseData['Price'] : '',
                            });
                        }
                    } else {
                        csvData.push({
                            'SKU Number': baseData['SKU Number'],
                            'Product Name': baseData['Product Name'],
                            'Design Variant Name(EN)': baseData['Design Variant Name(EN)'],
                            'Design Variant Name(FN)': baseData['Design Variant Name(FN)'],
                            'Description(EN)-P1': baseData['Description(EN)-P1'],
                            'Description(EN)-P2': baseData['Description(EN)-P2'],
                            'Description(FN)-P1': baseData['Description(FN)-P1'],
                            'Description(FN)-P2': baseData['Description(FN)-P2'],
                            'Metal name': baseData['Metal name'],
                            'Karat': baseData['Karat'],
                            'Weight': baseData['Weight'],
                            'Mark Up': baseData['Mark Up'],
                            'Diamond Cut': '',
                            'Diamond Carat': '',
                            'Diamond Type': '',
                            'Diamond Clarity': '',
                            'Pcs': '',
                            'Diamond Position': '',
                            'Position Visible': '',
                            'Price flag': baseData['Price flag'],
                            'Price': '',
                        });
                    }
                }

                const csv = await converter.json2csvAsync(csvData);

                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `designs_export_${timestamp}.csv`;

                const csvFile = {
                    name: filename,
                    type: "text/csv",
                    data: csv,
                    path: ["design", "csv", filename].join("/"),
                };

                await saveToBucket(csvFile);

                const s3Key = `${process.env.AWS_BUCKET_NAME}/design/csv/${filename}`;
                const url = await getPresignedUrl(s3Key, 3600 * 24 * 7);

                return res.status(200).json({
                    success: true,
                    message: "Design variants exported successfully",
                    csv_url: url,
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
