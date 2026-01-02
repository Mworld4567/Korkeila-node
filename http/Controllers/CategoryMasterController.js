const logError = require("../../logger/log");
const CategoryMaster = require("../../Models/Category");
const dateFunc = require("../../helpers/dateFunc");
const CategoryTranslation = require("../../Models/CategoryTranslation");
const Language = require("../../Models/Language");
const { Op } = require("sequelize");
const { deleteFromBucket } = require("../middlewares/awsS3Middleware");
const { extractFilename, constructImageUrl } = require("../../helpers/imageHelper");
const { languageId } = require("../../config/globalVariable");
const categoryMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.category_name || req.body.category_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category name",
                    });
                }

                if (!req.body.category_code || req.body.category_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category code",
                    });
                }

                const existingCategory = await CategoryMaster.findOne({
                    where: {
                        category_code: req.body.category_code.trim(),
                        deleted_at: null
                    }
                });

                if (existingCategory) {
                    return res.status(409).json({
                        success: false,
                        message: "Category code already exists",
                    });
                }

                // Handle image - store only filename (last part) in database
                let image = null;
                if (req.file && req.file.key) {
                    // Image uploaded as file - extract only the filename (last part)
                    image = extractFilename(req.file.key);
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text (filename or URL) - extract only filename
                    image = extractFilename(req.body.image.trim());
                }

                const data = {
                    category_name: req.body.category_name.trim(),
                    category_code: req.body.category_code.trim(),
                    image: image,
                };

                const mydata = await CategoryMaster.create(data);

                // Handle category_name_array - parse if it's a string (form-data scenario)
                if (req.body.category_name_array) {
                    let category_name_array = req.body.category_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof category_name_array === 'string') {
                        try {
                            category_name_array = JSON.parse(category_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid category_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that category_name_array is an array
                    if (!Array.isArray(category_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "category_name_array must be an array",
                        });
                    }

                    const translationData = [];
                    for (const language of category_name_array) {
                        translationData.push({
                            category_id: mydata.id,
                            language_id: language.language_id,
                            category_name: language.category_name.trim(),
                        });
                    }
                    
                    const category_translations = await CategoryTranslation.bulkCreate(translationData);
                    mydata.category_translations = category_translations;
                }
                // Construct full URL for response
                const responseData = mydata.toJSON();
                responseData.image = constructImageUrl(responseData.image, 'categoryMaster');

                return res.status(200).json({
                    success: true,
                    message: "Category master created successfully",
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
        read: async (req, res) => {
            try {
                const mydata = await CategoryMaster.findAll({
                    where: {
                        deleted_at: null,
                    },
                    order: [['id', 'DESC']],
                    include: [
                        {
                            model: CategoryTranslation,
                            as: 'category_translations',
                            where: { language_id: languageId.English },
                            attributes: ['id', 'category_id', 'language_id', 'category_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name', 'language_code']
                                }
                            ]
                        }
                    ]
                });

                // Construct full URLs for images dynamically and include translations
                const dataWithUrls = mydata.map(item => {
                    const itemData = item.toJSON();
                    itemData.image = constructImageUrl(itemData.image, 'categoryMaster');
                    return itemData;
                });

                return res.status(200).json({
                    success: true,
                    message: "Category master fetched successfully",
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
                const mydata = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    },
                    include: [
                        {
                            model: CategoryTranslation,
                            as: 'category_translations',
                            attributes: ['id', 'category_id', 'language_id', 'category_name'],
                            include: [
                                {
                                    model: Language,
                                    as: 'language',
                                    attributes: ['id', 'language_name', 'language_code']
                                }
                            ]
                        }
                    ]
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Category master not found",
                    });
                }

                // Construct full URL for image dynamically
                const responseData = mydata.toJSON();
                responseData.image = constructImageUrl(responseData.image, 'categoryMaster');

                return res.status(200).json({
                    success: true,
                    message: "Category master fetched successfully",
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
            try {
                const categoryData = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!categoryData) {
                    return res.status(409).json({
                        success: true,
                        message: "Category master not found",
                    });
                }

                if (!req.body.category_name || req.body.category_name === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter category name",
                    });
                }

                if (!req.body.category_code || req.body.category_code === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter category code",
                    });
                }

                const existingCategory = await CategoryMaster.findOne({
                    where: {
                        category_code: req.body.category_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingCategory) {
                    return res.status(409).json({
                        success: false,
                        message: "Category code already exists",
                    });
                }

                // Handle image - always extract only filename (last part), even from existing data
                let image = null;
                
                // Handle new image upload
                if (req.file && req.file.key) {
                    // Delete old image from S3 if exists
                    if (categoryData.image) {
                        try {
                            // Extract filename from old value (might be URL, path, or just filename)
                            const oldFilename = extractFilename(categoryData.image);
                            // Construct full S3 key for deletion: public/categoryMaster/image/{filename}
                            const fullOldKey = `public/categoryMaster/image/${oldFilename}`;
                            await deleteFromBucket(fullOldKey);
                        } catch (deleteError) {
                            console.log("Error deleting old image:", deleteError);
                            // Continue even if deletion fails
                        }
                    }
                    
                    // Store only filename (last part)
                    image = extractFilename(req.file.key);
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text - extract only filename
                    image = extractFilename(req.body.image.trim());
                } else if (categoryData.image) {
                    // No new image provided, but existing image exists - extract only filename from it (might be URL or path)
                    image = extractFilename(categoryData.image);
                }

                const data = {
                    category_name: req.body.category_name.trim(),
                    category_code: req.body.category_code.trim(),
                    image: image,
                };

                await CategoryMaster.update(data, {
                    where: { id: req.params.id }
                });

                // Handle category_name_array updates - parse if it's a string (form-data scenario)
                if (req.body.category_name_array) {
                    let category_name_array = req.body.category_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof category_name_array === 'string') {
                        try {
                            category_name_array = JSON.parse(category_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid category_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that category_name_array is an array
                    if (!Array.isArray(category_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "category_name_array must be an array",
                        });
                    }

                    // Delete existing translations for this category
                    await CategoryTranslation.destroy({
                        where: { category_id: req.params.id }
                    });

                    // Create new translations
                    const translationData = [];
                    for (const language of category_name_array) {
                        translationData.push({
                            category_id: parseInt(req.params.id),
                            language_id: language.language_id,
                            category_name: language.category_name.trim(),
                        });
                    }
                    
                    await CategoryTranslation.bulkCreate(translationData);
                }

                const updatedData = await CategoryMaster.findByPk(req.params.id);

                // Construct full URL for response
                const responseData = updatedData.toJSON();
                responseData.image = constructImageUrl(responseData.image, 'categoryMaster');

                return res.status(200).json({
                    success: true,
                    message: "Category master updated successfully",
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
        delete: async (req, res) => {
            try {
                const categoryData = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!categoryData) {
                    return res.status(409).json({
                        success: true,
                        message: "Category master not found",
                    });
                }

                const dateTime = dateFunc();

                // Delete all translations for this category
                await CategoryTranslation.destroy({
                    where: { category_id: req.params.id }
                });

                await CategoryMaster.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Category master deleted successfully",
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
        categoryDropdown: async (req, res) => {
            try {
                const categoryData = await CategoryMaster.findAll({
                    attributes: ['id', 'category_name'],
                    order: [['id', 'ASC']]
                });
                return res.status(200).json({
                    success: true,
                    message: "Category dropdown fetched successfully",
                    data: categoryData,
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
        categoryListingForEcomHomePage: async (req, res) => {
            try {
                const categoryData = await CategoryTranslation.findAll({
                    where: {
                        language_id: req.query.language_id
                    },
                    include: [
                        {
                            model: CategoryMaster,
                            as: 'category',
                            attributes: ['id', 'category_name', 'image'],
                            include: [
                                {
                                    model: CategoryTranslation,
                                    as: 'category_translations',
                                    where: { language_id: req.query.language_id },
                                    attributes: ['id', 'category_id', 'language_id', 'category_name'],
                                    include: [
                                        {
                                            model: Language,
                                            as: 'language',
                                            attributes: ['id', 'language_name', 'language_code']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });
                
                const data = categoryData.map(item => {
                    return {
                        id: item.category.id,
                        category_name: item.category.category_translations[0].category_name,
                        image: constructImageUrl(item.category.image, 'categoryMaster')
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Category listing for ecom home page fetched successfully",
                    data: data,
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

module.exports = categoryMasterController;

