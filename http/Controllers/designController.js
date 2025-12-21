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
const { constructImageUrl } = require("../../helpers/imageHelper");

const designController = () => {
    return {
        create: async (req, res) => {
            const transaction = req.transaction || null;
            try {
                const {
                    category_id,
                    category_name,
                    style_id,
                    style_name,
                    cut_details,
                    karat_details,
                    colours,
                    colors
                } = req.body;

                // Support both "colours" and "colors" in payload
                const colorDetails = colours || colors || [];

                // Validation
                if (!category_id || !category_name) {
                    return res.status(400).json({
                        success: false,
                        message: "Category ID and name are required"
                    });
                }

                if (!style_id || !style_name) {
                    return res.status(400).json({
                        success: false,
                        message: "Style ID and name are required"
                    });
                }

                if (!cut_details || !Array.isArray(cut_details) || cut_details.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Cut details array is required"
                    });
                }

                if (!karat_details || !Array.isArray(karat_details) || karat_details.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Karat details array is required"
                    });
                }

                if (!colorDetails || !Array.isArray(colorDetails) || colorDetails.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Color details array is required"
                    });
                }

                // Verify category exists
                const category = await CategoryMaster.findByPk(category_id);
                if (!category) {
                    return res.status(409).json({
                        success: true,
                        message: "Category not found"
                    });
                }

                // Verify style exists
                const style = await StyleMaster.findByPk(style_id);
                if (!style) {
                    return res.status(409).json({
                        success: true,
                        message: "Style not found"
                    });
                }

                // Get category code (first 3 letters uppercase) or use category_code if available
                const categoryCode = category.category_code || category_name.substring(0, 3).toUpperCase();

                // Get style code (first letter uppercase) or use style_code if available
                const styleCode = style.style_code || style_name.substring(0, 1).toUpperCase();

                // Extract all cut IDs, karat IDs, and color IDs for bulk validation
                const cutIds = cut_details.map(c => c.cut_master_id);
                const karatIds = karat_details.map(k => k.karat_master_id);
                const colorIds = colorDetails.map(c => c.gold_color_id || c.color_id || c.id);

                // Bulk validate cuts, karats, and colors
                const [cuts, karats, goldColors] = await Promise.all([
                    CutMaster.findAll({
                        where: { id: cutIds },
                        attributes: ['id', 'cut_code', 'cut_name']
                    }),
                    Karat.findAll({
                        where: { id: karatIds },
                        attributes: ['id', 'karat_value', 'karat']
                    }),
                    GoldColor.findAll({
                        where: { id: colorIds },
                        attributes: ['id', 'color', 'colour_code']
                    })
                ]);

                // Create lookup maps for faster access
                const cutMap = new Map(cuts.map(c => [c.id, c]));
                const karatMap = new Map(karats.map(k => [k.id, k]));
                const colorMap = new Map(goldColors.map(c => [c.id, c]));

                // Validate all cuts exist
                for (const cutId of cutIds) {
                    if (!cutMap.has(cutId)) {
                        return res.status(409).json({
                            success: true,
                            message: `Cut with ID ${cutId} not found`
                        });
                    }
                }

                // Validate all karats exist
                for (const karatId of karatIds) {
                    if (!karatMap.has(karatId)) {
                        return res.status(409).json({
                            success: true,
                            message: `Karat with ID ${karatId} not found`
                        });
                    }
                }

                // Validate all colors exist
                for (const colorId of colorIds) {
                    if (!colorMap.has(colorId)) {
                        return res.status(409).json({
                            success: true,
                            message: `Color with ID ${colorId} not found`
                        });
                    }
                }

                // Helper function to format diamond carat to 3-digit code
                const formatDiamondCarat = (carat) => {
                    if (!carat && carat !== 0) return '000';
                    // Multiply by 1000 to convert to integer (0.003 -> 3, 0.10 -> 100)
                    const caratInt = Math.round(parseFloat(carat) * 1000);
                    // Pad to 3 digits with leading zeros
                    return caratInt.toString().padStart(3, '0');
                };

                // Generate all combinations
                const combinations = [];

                // Iterate through each cut
                for (const cutDetail of cut_details) {
                    const cutId = cutDetail.cut_master_id;
                    const cut = cutMap.get(cutId);

                    // Use cut_code from database, fallback to payload or generate from name
                    const cutCode = cut.cut_code || cutDetail.cut_code || cut.cut_name?.substring(0, 2).toUpperCase() || 'CU';

                    // Get diamond details for this cut
                    const diamondDetails = cutDetail.diamond_details || [];

                    // If cut has diamond details, create combination for each diamond
                    if (diamondDetails.length > 0) {
                        // For each karat
                        for (const karatDetail of karat_details) {
                            const karatId = karatDetail.karat_master_id;
                            const karat = karatMap.get(karatId);

                            // For each color
                            for (const colorDetail of colorDetails) {
                                const colorId = colorDetail.gold_color_id || colorDetail.color_id || colorDetail.id;
                                const color = colorMap.get(colorId);
                                const colorCode = color ? color.colour_code : '';

                                // For each diamond detail in this cut
                                for (const diamondDetail of diamondDetails) {
                                    const karatValue = karatDetail.karat_value || karat.karat_value || '';
                                    const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';

                                    // Format diamond carat to 3-digit code (e.g., 0.003 -> 003, 0.10 -> 100)
                                    const diamondCaratCode = formatDiamondCarat(diamondDetail.diamond_carat);

                                    // Generate variant name: KK + CategoryCode + StyleCode + CutCode + DiamondCarat + ColorCode + Karat
                                    const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}${colorCode}-${karatSuffix}`;

                                    combinations.push({
                                        variantName,
                                        categoryId: category_id,
                                        styleId: style_id,
                                        cutId: cutId,
                                        karatId: karatId,
                                        colorId: colorId,
                                        diamondDetail: diamondDetail
                                    });
                                }
                            }
                        }
                    } else {
                        // If cut has no diamond details, create one combination per karat and color with "000" for carat
                        for (const karatDetail of karat_details) {
                            const karatId = karatDetail.karat_master_id;
                            const karat = karatMap.get(karatId);

                            // For each color
                            for (const colorDetail of colorDetails) {
                                const colorId = colorDetail.gold_color_id || colorDetail.color_id || colorDetail.id;
                                const color = colorMap.get(colorId);
                                const colorCode = color ? color.colour_code : '';

                                const karatValue = karatDetail.karat_value || karat.karat_value || '';
                                const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';

                                // Use "000" for cuts without diamond details
                                const diamondCaratCode = '000';

                                // Generate variant name
                                const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}${colorCode}-${karatSuffix}`;

                                combinations.push({
                                    variantName,
                                    categoryId: category_id,
                                    styleId: style_id,
                                    cutId: cutId,
                                    karatId: karatId,
                                    colorId: colorId,
                                    diamondDetail: null
                                });
                            }
                        }
                    }
                }

                // Check for existing combinations to avoid duplicates
                // Build a map to check existing designs by their unique combination
                const existingDesignsMap = new Map();

                // Get all existing designs for this category and style
                const existingDesigns = await Designs.findAll({
                    where: {
                        category_master_id: category_id,
                        style_master_id: style_id,
                        deleted_at: null
                    },
                    attributes: ['id', 'design_variant_name', 'category_master_id', 'style_master_id', 'cut_master_id', 'karat_id', 'gold_color_id']
                });

                // Get diamond details for existing designs
                const existingDesignIds = existingDesigns.map(d => d.id);
                const existingDiamondDetails = existingDesignIds.length > 0
                    ? await DesignsDiamondDetails.findAll({
                        where: { design_id: existingDesignIds },
                        attributes: ['design_id', 'diamond_master_id']
                    })
                    : [];

                // Create a map of diamond details by design_id
                const diamondDetailsByDesignId = new Map();
                existingDiamondDetails.forEach(dd => {
                    if (!diamondDetailsByDesignId.has(dd.design_id)) {
                        diamondDetailsByDesignId.set(dd.design_id, []);
                    }
                    diamondDetailsByDesignId.get(dd.design_id).push(dd.diamond_master_id);
                });

                // Create a unique key for each existing design: cut_id + karat_id + color_id + diamond_master_id
                existingDesigns.forEach(design => {
                    const designData = design.dataValues || design;
                    const diamondIds = diamondDetailsByDesignId.get(designData.id) || [];
                    const diamondId = diamondIds.length > 0 ? diamondIds[0] : null;
                    const uniqueKey = `${designData.cut_master_id}_${designData.karat_id}_${designData.gold_color_id}_${diamondId || 'no_diamond'}`;
                    existingDesignsMap.set(uniqueKey, designData);
                });

                // Separate new and existing combinations
                const newCombinations = [];
                const existingCombinationsData = [];

                combinations.forEach(combo => {
                    const diamondMasterId = combo.diamondDetail?.diamond_master_id || null;
                    const uniqueKey = `${combo.cutId}_${combo.karatId}_${combo.colorId}_${diamondMasterId || 'no_diamond'}`;

                    if (existingDesignsMap.has(uniqueKey)) {
                        // Combination already exists
                        const existingDesign = existingDesignsMap.get(uniqueKey);
                        existingCombinationsData.push({
                            id: existingDesign.id,
                            design_variant_name: existingDesign.design_variant_name,
                            category_master_id: existingDesign.category_master_id,
                            style_master_id: existingDesign.style_master_id,
                            cut_master_id: existingDesign.cut_master_id,
                            karat_id: existingDesign.karat_id,
                            gold_color_id: existingDesign.gold_color_id,
                            is_existing: true
                        });
                    } else {
                        // New combination to create
                        newCombinations.push(combo);
                    }
                });

                // Prepare bulk data for new designs only
                const designsData = newCombinations.map(combo => ({
                    design_variant_name: combo.variantName,
                    category_master_id: combo.categoryId,
                    style_master_id: combo.styleId,
                    cut_master_id: combo.cutId,
                    karat_id: combo.karatId,
                    gold_color_id: combo.colorId,
                    mark_up: 0
                }));

                // Bulk create only new designs
                const options = transaction ? { transaction } : {};
                let createdDesigns = [];
                if (designsData.length > 0) {
                    createdDesigns = await Designs.bulkCreate(designsData, {
                        ...options,
                        returning: true
                    });
                }

                // Prepare bulk data for diamond details for new designs
                const diamondDetailsData = [];
                createdDesigns.forEach((design, index) => {
                    const combo = newCombinations[index];
                    if (combo.diamondDetail) {
                        const designId = design.id || design.dataValues?.id;
                        diamondDetailsData.push({
                            design_id: designId,
                            cut_master_id: combo.cutId,
                            diamond_master_id: combo.diamondDetail.diamond_master_id,
                            pcs: combo.diamondDetail.diamond_pcs || 0
                        });
                    }
                });

                // Bulk create diamond details if any
                if (diamondDetailsData.length > 0) {
                    await DesignsDiamondDetails.bulkCreate(diamondDetailsData, options);
                }

                // Format response data for newly created designs
                const newDesignsData = createdDesigns.map(design => {
                    const designData = design.dataValues || design;
                    return {
                        id: designData.id,
                        design_variant_name: designData.design_variant_name,
                        category_master_id: designData.category_master_id,
                        style_master_id: designData.style_master_id,
                        cut_master_id: designData.cut_master_id,
                        karat_id: designData.karat_id,
                        gold_color_id: designData.gold_color_id,
                        is_existing: false
                    };
                });

                // Combine existing and new designs
                const allDesigns = [...existingCombinationsData, ...newDesignsData];

                return res.status(200).json({
                    success: true,
                    message: `Found ${existingCombinationsData.length} existing combination(s), created ${newDesignsData.length} new combination(s)`,
                    data: {
                        total_combinations: allDesigns.length,
                        existing_count: existingCombinationsData.length,
                        new_count: newDesignsData.length,
                        designs: allDesigns
                    }
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
        read: async (req, res) => {
            try {
                const { Op } = require("sequelize");

                // Get all designs with related data
                const designs = await Designs.findAll({
                    where: {
                        deleted_at: null,
                        // is_active: 1
                    },
                    order: [['created_at', 'DESC']]
                });

                if (!designs || designs.length === 0) {
                    return res.status(409).json({
                        success: true,
                        message: "No designs found",
                        data: []
                    });
                }

                // Get all related IDs for bulk fetching
                const categoryIds = [...new Set(designs.map(d => d.category_master_id))];
                const styleIds = [...new Set(designs.map(d => d.style_master_id))];
                const cutIds = [...new Set(designs.map(d => d.cut_master_id))];
                const karatIds = [...new Set(designs.map(d => d.karat_id))];
                const colorIds = [...new Set(designs.map(d => d.gold_color_id).filter(id => id !== null))];
                const designIds = designs.map(d => d.id);

                // Bulk fetch all related data
                const [categories, styles, cuts, karats, goldColors, diamondDetails, images] = await Promise.all([
                    CategoryMaster.findAll({
                        where: { id: categoryIds },
                        attributes: ['id', 'category_name', 'category_code']
                    }),
                    StyleMaster.findAll({
                        where: { id: styleIds },
                        attributes: ['id', 'style_name', 'style_code']
                    }),
                    CutMaster.findAll({
                        where: { id: cutIds },
                        attributes: ['id', 'cut_name', 'cut_code']
                    }),
                    Karat.findAll({
                        where: { id: karatIds },
                        attributes: ['id', 'metal_type_id', 'karat_value', 'karat'],
                        include: [{
                            model: Metal,
                            as: 'metal',
                            attributes: ['id', 'metal_name']
                        }]
                    }),
                    colorIds.length > 0 ? GoldColor.findAll({
                        where: { id: colorIds },
                        attributes: ['id', 'color', 'colour_code']
                    }) : [],
                    DesignsDiamondDetails.findAll({
                        where: { design_id: designIds },
                        attributes: ['id', 'design_id', 'cut_master_id', 'diamond_master_id', 'pcs']
                    }),
                    DesignsImages.findAll({
                        where: { design_id: designIds },
                        attributes: ['id', 'design_id', 'image_name']
                    })
                ]);

                // Get diamond master IDs and fetch diamond details
                const diamondMasterIds = [...new Set(diamondDetails.map(dd => dd.diamond_master_id))];
                const diamondMasters = diamondMasterIds.length > 0 ? await DiamondMaster.findAll({
                    where: { id: diamondMasterIds },
                    attributes: ['id', 'carat', 'size_from', 'size_to']
                }) : [];

                // Create lookup maps
                const categoryMap = new Map(categories.map(c => [c.id, c]));
                const styleMap = new Map(styles.map(s => [s.id, s]));
                const cutMap = new Map(cuts.map(c => [c.id, c]));
                const karatMap = new Map(karats.map(k => [k.id, k]));
                const colorMap = new Map(goldColors.map(c => [c.id, c]));
                const diamondMasterMap = new Map(diamondMasters.map(dm => [dm.id, dm]));
                const diamondDetailsMap = new Map();
                diamondDetails.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd);
                });

                // Create image key map for image sharing
                // Group designs by image key (category+style+cut+color+diamond, ignoring karat)
                // This allows E-commerce to filter images by cut and color
                const imageKeyMap = new Map();
                designs.forEach(design => {
                    const designData = design.dataValues || design;
                    const diamondDetailsForDesign = diamondDetailsMap.get(designData.id) || [];
                    const diamondMasterId = diamondDetailsForDesign.length > 0
                        ? diamondDetailsForDesign[0].diamond_master_id
                        : null;
                    // Image key includes cut and color for E-commerce filtering
                    const imageKey = `${designData.category_master_id}_${designData.style_master_id}_${designData.cut_master_id}_${designData.gold_color_id || 'no_color'}_${diamondMasterId || 'no_diamond'}`;

                    if (!imageKeyMap.has(imageKey)) {
                        imageKeyMap.set(imageKey, []);
                    }
                    imageKeyMap.get(imageKey).push(designData.id);
                });

                // Map images to image keys (images are shared across variants with same cut+color)
                const imagesByKeyMap = new Map();
                images.forEach(img => {
                    // Find which image key this image belongs to
                    for (const [imageKey, designIds] of imageKeyMap.entries()) {
                        if (designIds.includes(img.design_id)) {
                            if (!imagesByKeyMap.has(imageKey)) {
                                imagesByKeyMap.set(imageKey, []);
                            }
                            // Avoid duplicates
                            const existing = imagesByKeyMap.get(imageKey).find(i => i.image_name === img.image_name);
                            if (!existing) {
                                imagesByKeyMap.get(imageKey).push({
                                    id: img.id,
                                    image_name: img.image_name
                                });
                            }
                            break;
                        }
                    }
                });

                // Format response data
                const formattedData = designs.map(design => {
                    const designData = design.dataValues || design;
                    const category = categoryMap.get(designData.category_master_id);
                    const style = styleMap.get(designData.style_master_id);
                    const cut = cutMap.get(designData.cut_master_id);
                    const karat = karatMap.get(designData.karat_id);
                    const goldColor = designData.gold_color_id ? colorMap.get(designData.gold_color_id) : null;
                    const designDiamondDetails = diamondDetailsMap.get(designData.id) || [];

                    // Get images based on cut+color combination (for E-commerce filtering)
                    const diamondMasterId = designDiamondDetails.length > 0
                        ? designDiamondDetails[0].diamond_master_id
                        : null;
                    // Image key includes cut and color so images change when cut/color changes
                    const imageKey = `${designData.category_master_id}_${designData.style_master_id}_${designData.cut_master_id}_${designData.gold_color_id || 'no_color'}_${diamondMasterId || 'no_diamond'}`;
                    const designImages = imagesByKeyMap.get(imageKey) || [];

                    // Format diamond details with diamond master info
                    const formattedDiamondDetails = designDiamondDetails.map(dd => {
                        const diamondMaster = diamondMasterMap.get(dd.diamond_master_id);
                        return {
                            id: dd.id,
                            diamond_master_id: dd.diamond_master_id,
                            diamond_carat: diamondMaster ? diamondMaster.carat : null,
                            diamond_size_from: diamondMaster ? diamondMaster.size_from : null,
                            diamond_size_to: diamondMaster ? diamondMaster.size_to : null,
                            pcs: dd.pcs
                        };
                    });

                    return {
                        id: designData.id,
                        design_variant_name: designData.design_variant_name,
                        category: {
                            id: category ? category.id : null,
                            category_id: designData.category_master_id,
                            category_name: category ? category.category_name : null,
                            category_code: category ? category.category_code : null
                        },
                        style: {
                            id: style ? style.id : null,
                            style_id: designData.style_master_id,
                            style_name: style ? style.style_name : null,
                            style_code: style ? style.style_code : null
                        },
                        cut: {
                            id: cut ? cut.id : null,
                            cut_id: designData.cut_master_id,
                            cut_name: cut ? cut.cut_name : null,
                            cut_code: cut ? cut.cut_code : null
                        },
                        karat: {
                            id: karat ? karat.id : null,
                            karat_id: designData.karat_id,
                            metal_type: karat && karat.metal ? karat.metal.metal_name : null,
                            karat_value: karat ? karat.karat_value : null,
                            karat: karat ? karat.karat : null
                        },
                        gold_color: {
                            id: goldColor ? goldColor.id : null,
                            gold_color_id: designData.gold_color_id,
                            color: goldColor ? goldColor.color : null,
                            colour_code: goldColor ? goldColor.colour_code : null
                        },
                        diamond_details: formattedDiamondDetails,
                        images: designImages.map(img => ({
                            id: img.id,
                            image_name: img.image_name
                        })),
                        mark_up: designData.mark_up,
                        // is_active: designData.is_active,
                        created_at: designData.created_at,
                        updated_at: designData.updated_at
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Designs fetched successfully",
                    data: formattedData,
                    total: formattedData.length
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
                const designId = req.params.id;

                if (!designId) {
                    return res.status(400).json({
                        success: false,
                        message: "Design ID is required"
                    });
                }

                // Get design
                const design = await Designs.findOne({
                    where: {
                        id: designId,
                        deleted_at: null
                    }
                });

                if (!design) {
                    return res.status(409).json({
                        success: true,
                        message: "Design not found"
                    });
                }

                const designData = design.dataValues || design;

                // Fetch all related data
                const [category, style, cut, karat, goldColor, diamondDetails, designImages] = await Promise.all([
                    CategoryMaster.findByPk(designData.category_master_id, {
                        attributes: ['id', 'category_name', 'category_code']
                    }),
                    StyleMaster.findByPk(designData.style_master_id, {
                        attributes: ['id', 'style_name', 'style_code']
                    }),
                    CutMaster.findByPk(designData.cut_master_id, {
                        attributes: ['id', 'cut_name', 'cut_code']
                    }),
                    Karat.findByPk(designData.karat_id, {
                        attributes: ['id', 'metal_type_id', 'karat_value', 'karat'],
                        include: [{
                            model: Metal,
                            as: 'metal',
                            attributes: ['id', 'metal_name']
                        }]
                    }),
                    designData.gold_color_id ? GoldColor.findByPk(designData.gold_color_id, {
                        attributes: ['id', 'color', 'colour_code']
                    }) : null,
                    DesignsDiamondDetails.findAll({
                        where: { design_id: designId },
                        attributes: ['id', 'design_id', 'cut_master_id', 'diamond_master_id', 'pcs']
                    }),
                    DesignsImages.findAll({
                        where: { design_id: designId },
                        attributes: ['id', 'design_id', 'image_name']
                    })
                ]);

                // For readOne, get images based on cut+color combination (for E-commerce filtering)
                // Find other designs with same cut+color+diamond (images change when cut/color changes)
                const diamondMasterIdList = diamondDetails.map(dd => dd.diamond_master_id);
                const diamondMasterId = diamondMasterIdList.length > 0 ? diamondMasterIdList[0] : null;
                const imageKey = `${designData.category_master_id}_${designData.style_master_id}_${designData.cut_master_id}_${designData.gold_color_id || 'no_color'}_${diamondMasterId || 'no_diamond'}`;

                // Find all designs with same cut+color+diamond combination
                const matchingDesigns = await Designs.findAll({
                    where: {
                        category_master_id: designData.category_master_id,
                        style_master_id: designData.style_master_id,
                        cut_master_id: designData.cut_master_id,
                        gold_color_id: designData.gold_color_id,
                        deleted_at: null
                    },
                    attributes: ['id']
                });

                // Get diamond details for all matching designs to verify diamond match
                const matchingDesignIds = matchingDesigns.map(d => d.id);
                const matchingDiamondDetails = await DesignsDiamondDetails.findAll({
                    where: { design_id: matchingDesignIds },
                    attributes: ['design_id', 'diamond_master_id']
                });

                // Filter to designs with same diamond (or no diamond)
                const finalMatchingDesignIds = matchingDesigns
                    .filter(d => {
                        const dd = matchingDiamondDetails.find(mdd => mdd.design_id === d.id);
                        const ddDiamondId = dd ? dd.diamond_master_id : null;
                        return ddDiamondId === diamondMasterId;
                    })
                    .map(d => d.id);

                // Get images from matching designs (same cut+color+diamond)
                const sharedImages = finalMatchingDesignIds.length > 0
                    ? await DesignsImages.findAll({
                        where: { design_id: finalMatchingDesignIds },
                        attributes: ['id', 'design_id', 'image_name']
                    })
                    : [];

                // Remove duplicates by image_name
                const uniqueImages = [];
                const seenImageNames = new Set();
                sharedImages.forEach(img => {
                    if (!seenImageNames.has(img.image_name)) {
                        seenImageNames.add(img.image_name);
                        uniqueImages.push(img);
                    }
                });

                // Get diamond master details
                const diamondMasterIdListForRead = diamondDetails.map(dd => dd.diamond_master_id);
                const diamondMasters = diamondMasterIdListForRead.length > 0 ? await DiamondMaster.findAll({
                    where: { id: diamondMasterIdListForRead },
                    attributes: ['id', 'carat', 'size_from', 'size_to']
                }) : [];

                const diamondMasterMap = new Map(diamondMasters.map(dm => [dm.id, dm]));

                // Format diamond details with diamond master info
                const formattedDiamondDetails = diamondDetails.map(dd => {
                    const diamondMaster = diamondMasterMap.get(dd.diamond_master_id);
                    return {
                        id: dd.id,
                        diamond_master_id: dd.diamond_master_id,
                        diamond_carat: diamondMaster ? diamondMaster.carat : null,
                        diamond_size_from: diamondMaster ? diamondMaster.size_from : null,
                        diamond_size_to: diamondMaster ? diamondMaster.size_to : null,
                        pcs: dd.pcs
                    };
                });

                // Format response
                const formattedData = {
                    id: designData.id,
                    design_variant_name: designData.design_variant_name,
                    category: {
                        id: category ? category.id : null,
                        category_id: designData.category_master_id,
                        category_name: category ? category.category_name : null,
                        category_code: category ? category.category_code : null
                    },
                    style: {
                        id: style ? style.id : null,
                        style_id: designData.style_master_id,
                        style_name: style ? style.style_name : null,
                        style_code: style ? style.style_code : null
                    },
                    cut: {
                        id: cut ? cut.id : null,
                        cut_id: designData.cut_master_id,
                        cut_name: cut ? cut.cut_name : null,
                        cut_code: cut ? cut.cut_code : null
                    },
                    karat: {
                        id: karat ? karat.id : null,
                        karat_id: designData.karat_id,
                        metal_type: karat && karat.metal ? karat.metal.metal_name : null,
                        karat_value: karat ? karat.karat_value : null,
                        karat: karat ? karat.karat : null
                    },
                    gold_color: {
                        id: goldColor ? goldColor.id : null,
                        gold_color_id: designData.gold_color_id,
                        color: goldColor ? goldColor.color : null,
                        colour_code: goldColor ? goldColor.colour_code : null
                    },
                    diamond_details: formattedDiamondDetails,
                    images: uniqueImages.map(img => ({
                        id: img.id,
                        image_name: constructImageUrl(img.image_name)
                    })),
                    mark_up: designData.mark_up,
                    // is_active: designData.is_active,
                    created_at: designData.created_at,
                    updated_at: designData.updated_at
                };

                return res.status(200).json({
                    success: true,
                    message: "Design fetched successfully",
                    data: formattedData
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
        uploadImages: async (req, res) => {
            const transaction = req.transaction || null;
            try {
                const {
                    category_id,
                    style_id,
                    cut_id,
                    color_id,
                    diamond_master_id, // Optional: if provided, only update designs with this diamond
                    images
                } = req.body;

                // Validation
                if (!category_id || !style_id || !cut_id || !color_id) {
                    return res.status(400).json({
                        success: false,
                        message: "category_id, style_id, cut_id, and color_id are required"
                    });
                }

                if (!images || !Array.isArray(images) || images.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Images array is required and must not be empty"
                    });
                }

                // Find all designs matching the criteria
                const whereClause = {
                    category_master_id: category_id,
                    style_master_id: style_id,
                    cut_master_id: cut_id,
                    gold_color_id: color_id,
                    deleted_at: null
                };

                const matchingDesigns = await Designs.findAll({
                    where: whereClause,
                    attributes: ['id', 'cut_master_id', 'gold_color_id']
                });

                if (!matchingDesigns || matchingDesigns.length === 0) {
                    return res.status(409).json({
                        success: true,
                        message: "No designs found matching the criteria"
                    });
                }

                const designIds = matchingDesigns.map(d => d.id);

                // If diamond_master_id is provided, filter designs by diamond
                let finalDesignIds = designIds;
                if (diamond_master_id !== undefined && diamond_master_id !== null) {
                    const diamondDetails = await DesignsDiamondDetails.findAll({
                        where: {
                            design_id: designIds,
                            diamond_master_id: diamond_master_id
                        },
                        attributes: ['design_id']
                    });
                    finalDesignIds = diamondDetails.map(dd => dd.design_id);

                    if (finalDesignIds.length === 0) {
                        return res.status(409).json({
                            success: true,
                            message: "No designs found matching the criteria with the specified diamond"
                        });
                    }
                }

                // Group designs by cut+color+diamond combination for image sharing
                // Get diamond details for all matching designs
                const allDiamondDetails = await DesignsDiamondDetails.findAll({
                    where: { design_id: finalDesignIds },
                    attributes: ['design_id', 'diamond_master_id']
                });

                const diamondDetailsMap = new Map();
                allDiamondDetails.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd.diamond_master_id);
                });

                // Group designs by image key (cut+color+diamond)
                const imageKeyMap = new Map();
                finalDesignIds.forEach(designId => {
                    const diamondIds = diamondDetailsMap.get(designId) || [];
                    const diamondId = diamondIds.length > 0 ? diamondIds[0] : null;
                    const imageKey = `${category_id}_${style_id}_${cut_id}_${color_id}_${diamondId || 'no_diamond'}`;

                    if (!imageKeyMap.has(imageKey)) {
                        imageKeyMap.set(imageKey, []);
                    }
                    imageKeyMap.get(imageKey).push(designId);
                });

                const options = transaction ? { transaction } : {};

                // Delete existing images for all matching designs
                await DesignsImages.destroy({
                    where: { design_id: finalDesignIds },
                    ...options
                });

                // Add new images to the first design of each cut+color+diamond combination
                // Images will be shared across variants with same cut+color+diamond
                const imagesData = [];
                for (const [imageKey, designIdsForKey] of imageKeyMap.entries()) {
                    const firstDesignId = designIdsForKey[0]; // Use first design for each combination
                    images.forEach(img => {
                        // Support both string and object formats
                        const imageName = typeof img === 'string' ? img : (img.image_name || img.name || img);
                        imagesData.push({
                            design_id: firstDesignId,
                            image_name: imageName
                        });
                    });
                }

                // Bulk create images
                if (imagesData.length > 0) {
                    await DesignsImages.bulkCreate(imagesData, options);
                }

                return res.status(200).json({
                    success: true,
                    message: `Successfully uploaded ${images.length} image(s) for ${finalDesignIds.length} design variant(s)`,
                    data: {
                        total_designs_updated: finalDesignIds.length,
                        images_uploaded: images.length,
                        image_combinations: imageKeyMap.size
                    }
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
        getCombinationsForImageUpload: async (req, res) => {
            try {
                const { category_id, style_id } = req.query;

                if (!category_id || !style_id) {
                    return res.status(400).json({
                        success: false,
                        message: "category_id and style_id are required"
                    });
                }

                // Get all designs for this category and style
                const designs = await Designs.findAll({
                    where: {
                        category_master_id: category_id,
                        style_master_id: style_id,
                        deleted_at: null
                    },
                    attributes: ['id', 'cut_master_id', 'gold_color_id'],
                    order: [['cut_master_id', 'ASC'], ['gold_color_id', 'ASC']]
                });

                if (!designs || designs.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: "No designs found",
                        data: []
                    });
                }

                // Get diamond details
                const designIds = designs.map(d => d.id);
                const diamondDetails = await DesignsDiamondDetails.findAll({
                    where: { design_id: designIds },
                    attributes: ['design_id', 'diamond_master_id']
                });

                const diamondDetailsMap = new Map();
                diamondDetails.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd.diamond_master_id);
                });

                // Get cut and color details
                const cutIds = [...new Set(designs.map(d => d.cut_master_id))];
                const colorIds = [...new Set(designs.map(d => d.gold_color_id).filter(id => id !== null))];

                const [cuts, colors] = await Promise.all([
                    CutMaster.findAll({
                        where: { id: cutIds },
                        attributes: ['id', 'cut_name', 'cut_code']
                    }),
                    colorIds.length > 0 ? GoldColor.findAll({
                        where: { id: colorIds },
                        attributes: ['id', 'color', 'colour_code']
                    }) : []
                ]);

                const cutMap = new Map(cuts.map(c => [c.id, c]));
                const colorMap = new Map(colors.map(c => [c.id, c]));

                // Group by cut+color+diamond combination
                const combinationsMap = new Map();
                designs.forEach(design => {
                    const diamondIds = diamondDetailsMap.get(design.id) || [];
                    const diamondId = diamondIds.length > 0 ? diamondIds[0] : null;
                    const combinationKey = `${design.cut_master_id}_${design.gold_color_id || 'no_color'}_${diamondId || 'no_diamond'}`;

                    if (!combinationsMap.has(combinationKey)) {
                        const cut = cutMap.get(design.cut_master_id);
                        const color = design.gold_color_id ? colorMap.get(design.gold_color_id) : null;
                        combinationsMap.set(combinationKey, {
                            cut_id: design.cut_master_id,
                            cut_name: cut ? cut.cut_name : null,
                            cut_code: cut ? cut.cut_code : null,
                            color_id: design.gold_color_id,
                            color: color ? color.color : null,
                            colour_code: color ? color.colour_code : null,
                            diamond_master_id: diamondId,
                            variant_count: 0,
                            design_ids: []
                        });
                    }
                    const combo = combinationsMap.get(combinationKey);
                    combo.variant_count++;
                    combo.design_ids.push(design.id);
                });

                // Get existing images for each combination
                const combinations = Array.from(combinationsMap.values());
                for (const combo of combinations) {
                    if (combo.design_ids.length > 0) {
                        const existingImages = await DesignsImages.findAll({
                            where: { design_id: combo.design_ids[0] },
                            attributes: ['id', 'image_name']
                        });
                        combo.existing_images = existingImages.map(img => ({
                            id: img.id,
                            image_name: constructImageUrl(img.image_name)
                        }));
                    } else {
                        combo.existing_images = [];
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: "Combinations fetched successfully",
                    data: combinations
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
        previewCombinations: async (req, res) => {
            try {
                const {
                    category_id,
                    category_name,
                    style_id,
                    style_name,
                    cut_details,
                    karat_details,
                    colours,
                    colors
                } = req.body;

                // Support both "colours" and "colors" in payload
                const colorDetails = colours || colors || [];

                // Validation
                if (!category_id || !category_name) {
                    return res.status(400).json({
                        success: false,
                        message: "Category ID and name are required"
                    });
                }

                if (!style_id || !style_name) {
                    return res.status(400).json({
                        success: false,
                        message: "Style ID and name are required"
                    });
                }

                if (!cut_details || !Array.isArray(cut_details) || cut_details.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Cut details array is required"
                    });
                }

                if (!karat_details || !Array.isArray(karat_details) || karat_details.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Karat details array is required"
                    });
                }

                if (!colorDetails || !Array.isArray(colorDetails) || colorDetails.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Color details array is required"
                    });
                }

                // Verify category exists
                const category = await CategoryMaster.findByPk(category_id);
                if (!category) {
                    return res.status(409).json({
                        success: true,
                        message: "Category not found"
                    });
                }

                // Verify style exists
                const style = await StyleMaster.findByPk(style_id);
                if (!style) {
                    return res.status(409).json({
                        success: true,
                        message: "Style not found"
                    });
                }

                // Get category code
                const categoryCode = category.category_code || category_name.substring(0, 3).toUpperCase();
                const styleCode = style.style_code || style_name.substring(0, 1).toUpperCase();

                // Extract all cut IDs, karat IDs, and color IDs for bulk validation
                const cutIds = cut_details.map(c => c.cut_master_id);
                const karatIds = karat_details.map(k => k.karat_master_id);
                const colorIds = colorDetails.map(c => c.gold_color_id || c.color_id || c.id);

                // Bulk validate cuts, karats, and colors
                const [cuts, karats, goldColors] = await Promise.all([
                    CutMaster.findAll({
                        where: { id: cutIds },
                        attributes: ['id', 'cut_code', 'cut_name']
                    }),
                    Karat.findAll({
                        where: { id: karatIds },
                        attributes: ['id', 'karat_value', 'karat']
                    }),
                    GoldColor.findAll({
                        where: { id: colorIds },
                        attributes: ['id', 'color', 'colour_code']
                    })
                ]);

                // Create lookup maps
                const cutMap = new Map(cuts.map(c => [c.id, c]));
                const karatMap = new Map(karats.map(k => [k.id, k]));
                const colorMap = new Map(goldColors.map(c => [c.id, c]));

                // Helper function to format diamond carat to 3-digit code
                const formatDiamondCarat = (carat) => {
                    if (!carat && carat !== 0) return '000';
                    const caratInt = Math.round(parseFloat(carat) * 1000);
                    return caratInt.toString().padStart(3, '0');
                };

                // Generate all combinations
                const combinations = [];

                for (const cutDetail of cut_details) {
                    const cutId = cutDetail.cut_master_id;
                    const cut = cutMap.get(cutId);
                    const cutCode = cut.cut_code || cutDetail.cut_code || cut.cut_name?.substring(0, 2).toUpperCase() || 'CU';
                    const diamondDetails = cutDetail.diamond_details || [];

                    if (diamondDetails.length > 0) {
                        for (const karatDetail of karat_details) {
                            const karatId = karatDetail.karat_master_id;
                            const karat = karatMap.get(karatId);

                            for (const colorDetail of colorDetails) {
                                const colorId = colorDetail.gold_color_id || colorDetail.color_id || colorDetail.id;
                                const color = colorMap.get(colorId);
                                const colorCode = color ? color.colour_code : '';

                                for (const diamondDetail of diamondDetails) {
                                    const karatValue = karatDetail.karat_value || karat.karat_value || '';
                                    const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';
                                    const diamondCaratCode = formatDiamondCarat(diamondDetail.diamond_carat);
                                    const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}${colorCode}-${karatSuffix}`;

                                    combinations.push({
                                        variantName,
                                        categoryId: category_id,
                                        styleId: style_id,
                                        cutId: cutId,
                                        karatId: karatId,
                                        colorId: colorId,
                                        diamondDetail: diamondDetail
                                    });
                                }
                            }
                        }
                    } else {
                        for (const karatDetail of karat_details) {
                            const karatId = karatDetail.karat_master_id;
                            const karat = karatMap.get(karatId);

                            for (const colorDetail of colorDetails) {
                                const colorId = colorDetail.gold_color_id || colorDetail.color_id || colorDetail.id;
                                const color = colorMap.get(colorId);
                                const colorCode = color ? color.colour_code : '';
                                const karatValue = karatDetail.karat_value || karat.karat_value || '';
                                const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';
                                const diamondCaratCode = '000';
                                const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}${colorCode}-${karatSuffix}`;

                                combinations.push({
                                    variantName,
                                    categoryId: category_id,
                                    styleId: style_id,
                                    cutId: cutId,
                                    karatId: karatId,
                                    colorId: colorId,
                                    diamondDetail: null
                                });
                            }
                        }
                    }
                }

                // Check which combinations already exist
                const existingDesigns = await Designs.findAll({
                    where: {
                        category_master_id: category_id,
                        style_master_id: style_id,
                        deleted_at: null
                    },
                    attributes: ['id', 'design_variant_name', 'cut_master_id', 'karat_id', 'gold_color_id']
                });

                const existingDesignIds = existingDesigns.map(d => d.id);
                const existingDiamondDetails = existingDesignIds.length > 0
                    ? await DesignsDiamondDetails.findAll({
                        where: { design_id: existingDesignIds },
                        attributes: ['design_id', 'diamond_master_id']
                    })
                    : [];

                const diamondDetailsByDesignId = new Map();
                existingDiamondDetails.forEach(dd => {
                    if (!diamondDetailsByDesignId.has(dd.design_id)) {
                        diamondDetailsByDesignId.set(dd.design_id, []);
                    }
                    diamondDetailsByDesignId.get(dd.design_id).push(dd.diamond_master_id);
                });

                const existingDesignsMap = new Map();
                existingDesigns.forEach(design => {
                    const designData = design.dataValues || design;
                    const diamondIds = diamondDetailsByDesignId.get(designData.id) || [];
                    const diamondId = diamondIds.length > 0 ? diamondIds[0] : null;
                    const uniqueKey = `${designData.cut_master_id}_${designData.karat_id}_${designData.gold_color_id}_${diamondId || 'no_diamond'}`;
                    existingDesignsMap.set(uniqueKey, designData);
                });

                // Mark combinations as existing or new
                const previewData = combinations.map(combo => {
                    const diamondMasterId = combo.diamondDetail?.diamond_master_id || null;
                    const uniqueKey = `${combo.cutId}_${combo.karatId}_${combo.colorId}_${diamondMasterId || 'no_diamond'}`;
                    const exists = existingDesignsMap.has(uniqueKey);
                    const existingDesign = exists ? existingDesignsMap.get(uniqueKey) : null;

                    return {
                        variant_name: combo.variantName,
                        category_id: combo.categoryId,
                        style_id: combo.styleId,
                        cut_id: combo.cutId,
                        karat_id: combo.karatId,
                        color_id: combo.colorId,
                        diamond_master_id: diamondMasterId,
                        exists: exists,
                        existing_design_id: existingDesign ? existingDesign.id : null
                    };
                });

                const existingCount = previewData.filter(p => p.exists).length;
                const newCount = previewData.filter(p => !p.exists).length;

                return res.status(200).json({
                    success: true,
                    message: `Preview: ${existingCount} existing combination(s), ${newCount} new combination(s) will be created`,
                    data: {
                        total_combinations: previewData.length,
                        existing_count: existingCount,
                        new_count: newCount,
                        combinations: previewData
                    }
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
