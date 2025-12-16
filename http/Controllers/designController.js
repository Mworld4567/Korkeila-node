const logError = require("../../logger/log");
const Designs = require("../../Models/Designs");
const DesignsDiamondDetails = require("../../Models/DesignsDiamondDetails");
const DesignsImages = require("../../Models/DesignsImages");
const CategoryMaster = require("../../Models/CategoryMaster");
const StyleMaster = require("../../Models/StyleMaster");
const CutMaster = require("../../Models/CutMaster");
const Karat = require("../../Models/Karat");
const DiamondMaster = require("../../Models/DiamondMaster");
const sequelize = require("../../config/dbconfig");

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
                    images
                } = req.body;

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

                // Verify category exists
                const category = await CategoryMaster.findByPk(category_id);
                if (!category) {
                    return res.status(404).json({
                        success: false,
                        message: "Category not found"
                    });
                }

                // Verify style exists
                const style = await StyleMaster.findByPk(style_id);
                if (!style) {
                    return res.status(404).json({
                        success: false,
                        message: "Style not found"
                    });
                }

                // Get category code (first 3 letters uppercase) or use category_code if available
                const categoryCode = category.category_code || category_name.substring(0, 3).toUpperCase();

                // Get style code (first letter uppercase) or use style_code if available
                const styleCode = style.style_code || style_name.substring(0, 1).toUpperCase();

                // Extract all cut IDs and karat IDs for bulk validation
                const cutIds = cut_details.map(c => c.cut_master_id);
                const karatIds = karat_details.map(k => k.karat_master_id);

                // Bulk validate cuts and karats
                const [cuts, karats] = await Promise.all([
                    CutMaster.findAll({
                        where: { id: cutIds },
                        attributes: ['id', 'cut_code', 'cut_name']
                    }),
                    Karat.findAll({
                        where: { id: karatIds },
                        attributes: ['id', 'karat_value', 'karat']
                    })
                ]);

                // Create lookup maps for faster access
                const cutMap = new Map(cuts.map(c => [c.id, c]));
                const karatMap = new Map(karats.map(k => [k.id, k]));

                // Validate all cuts exist
                for (const cutId of cutIds) {
                    if (!cutMap.has(cutId)) {
                        return res.status(404).json({
                            success: false,
                            message: `Cut with ID ${cutId} not found`
                        });
                    }
                }

                // Validate all karats exist
                for (const karatId of karatIds) {
                    if (!karatMap.has(karatId)) {
                        return res.status(404).json({
                            success: false,
                            message: `Karat with ID ${karatId} not found`
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

                            // For each diamond detail in this cut
                            for (const diamondDetail of diamondDetails) {
                                const karatValue = karatDetail.karat_value || karat.karat_value || '';
                                const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';

                                // Format diamond carat to 3-digit code (e.g., 0.003 -> 003, 0.10 -> 100)
                                const diamondCaratCode = formatDiamondCarat(diamondDetail.diamond_carat);

                                // Generate variant name: KK + CategoryCode + StyleCode + CutCode + DiamondCarat + Karat
                                const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}-${karatSuffix}`;

                                combinations.push({
                                    variantName,
                                    categoryId: category_id,
                                    styleId: style_id,
                                    cutId: cutId,
                                    karatId: karatId,
                                    diamondDetail: diamondDetail
                                });
                            }
                        }
                    } else {
                        // If cut has no diamond details, create one combination per karat with "000" for carat
                        for (const karatDetail of karat_details) {
                            const karatId = karatDetail.karat_master_id;
                            const karat = karatMap.get(karatId);

                            const karatValue = karatDetail.karat_value || karat.karat_value || '';
                            const karatSuffix = karatValue ? `${karatValue}KT` : 'KT';

                            // Use "000" for cuts without diamond details
                            const diamondCaratCode = '000';

                            // Generate variant name
                            const variantName = `KK${categoryCode}${styleCode}${cutCode}${diamondCaratCode}-${karatSuffix}`;

                            combinations.push({
                                variantName,
                                categoryId: category_id,
                                styleId: style_id,
                                cutId: cutId,
                                karatId: karatId,
                                diamondDetail: null
                            });
                        }
                    }
                }

                // Prepare bulk data for designs
                const designsData = combinations.map(combo => ({
                    design_variant_name: combo.variantName,
                    category_master_id: combo.categoryId,
                    style_master_id: combo.styleId,
                    cut_master_id: combo.cutId,
                    karat_id: combo.karatId,
                    mark_up: 0
                }));

                // Bulk create all designs
                const options = transaction ? { transaction } : {};
                const createdDesigns = await Designs.bulkCreate(designsData, {
                    ...options,
                    returning: true
                });

                // Prepare bulk data for diamond details
                const diamondDetailsData = [];
                createdDesigns.forEach((design, index) => {
                    const combo = combinations[index];
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

                // Prepare bulk data for images
                const imagesData = [];
                if (images && Array.isArray(images) && images.length > 0) {
                    createdDesigns.forEach(design => {
                        const designId = design.id || design.dataValues?.id;
                        images.forEach(img => {
                            imagesData.push({
                                design_id: designId,
                                image_name: img.image_name
                            });
                        });
                    });
                }

                // Bulk create images if any
                if (imagesData.length > 0) {
                    await DesignsImages.bulkCreate(imagesData, options);
                }

                // Format response data
                const responseData = createdDesigns.map(design => {
                    const designData = design.dataValues || design;
                    return {
                        id: designData.id,
                        design_variant_name: designData.design_variant_name,
                        category_master_id: designData.category_master_id,
                        style_master_id: designData.style_master_id,
                        cut_master_id: designData.cut_master_id,
                        karat_id: designData.karat_id
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: `Successfully created ${responseData.length} design variant(s)`,
                    data: {
                        total_combinations: responseData.length,
                        designs: responseData
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
                    return res.status(200).json({
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
                const designIds = designs.map(d => d.id);

                // Bulk fetch all related data
                const [categories, styles, cuts, karats, diamondDetails, images] = await Promise.all([
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
                        attributes: ['id', 'metal_type', 'karat_value', 'karat']
                    }),
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
                const diamondMasterMap = new Map(diamondMasters.map(dm => [dm.id, dm]));
                const diamondDetailsMap = new Map();
                diamondDetails.forEach(dd => {
                    if (!diamondDetailsMap.has(dd.design_id)) {
                        diamondDetailsMap.set(dd.design_id, []);
                    }
                    diamondDetailsMap.get(dd.design_id).push(dd);
                });
                const imagesMap = new Map();
                images.forEach(img => {
                    if (!imagesMap.has(img.design_id)) {
                        imagesMap.set(img.design_id, []);
                    }
                    imagesMap.get(img.design_id).push(img);
                });

                // Format response data
                const formattedData = designs.map(design => {
                    const designData = design.dataValues || design;
                    const category = categoryMap.get(designData.category_master_id);
                    const style = styleMap.get(designData.style_master_id);
                    const cut = cutMap.get(designData.cut_master_id);
                    const karat = karatMap.get(designData.karat_id);
                    const designDiamondDetails = diamondDetailsMap.get(designData.id) || [];
                    const designImages = imagesMap.get(designData.id) || [];

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
                            metal_type: karat ? karat.metal_type : null,
                            karat_value: karat ? karat.karat_value : null,
                            karat: karat ? karat.karat : null
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
                    return res.status(404).json({
                        success: false,
                        message: "Design not found"
                    });
                }

                const designData = design.dataValues || design;

                // Fetch all related data
                const [category, style, cut, karat, diamondDetails, designImages] = await Promise.all([
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
                        attributes: ['id', 'metal_type', 'karat_value', 'karat']
                    }),
                    DesignsDiamondDetails.findAll({
                        where: { design_id: designId },
                        attributes: ['id', 'design_id', 'cut_master_id', 'diamond_master_id', 'pcs']
                    }),
                    DesignsImages.findAll({
                        where: { design_id: designId },
                        attributes: ['id', 'design_id', 'image_name']
                    })
                ]);

                // Get diamond master details
                const diamondMasterIds = diamondDetails.map(dd => dd.diamond_master_id);
                const diamondMasters = diamondMasterIds.length > 0 ? await DiamondMaster.findAll({
                    where: { id: diamondMasterIds },
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
                        metal_type: karat ? karat.metal_type : null,
                        karat_value: karat ? karat.karat_value : null,
                        karat: karat ? karat.karat : null
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
    };
};
module.exports = designController;
