const logError = require("../../logger/log");
const Metal = require("../../Models/Metal");
const dateFunc = require("../../helpers/dateFunc");
const MetalTranslation = require("../../Models/MetalTranslation");
const Language = require("../../Models/Language");
const { Op } = require("sequelize");
const { languageId } = require("../../config/globalVariable");

const metalController = () => {
    return {
        create: async (req, res) => {
            try {
                // if (!req.body.metal_name || req.body.metal_name === "") {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter metal name",
                //     });
                // }

                if (!req.body.metal_code || req.body.metal_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter metal code",
                    });
                }

                const existingMetal = await Metal.findOne({
                    where: {
                        metal_code: req.body.metal_code.trim(),
                        deleted_at: null
                    }
                });

                if (existingMetal) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal code already exists",
                    });
                }

                const data = {
                    // metal_name: req.body.metal_name.trim(),
                    metal_code: req.body.metal_code.trim(),
                };

                const mydata = await Metal.create(data);

                // Handle metal_name_array - parse if it's a string (form-data scenario)
                if (req.body.metal_name_array) {
                    let metal_name_array = req.body.metal_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof metal_name_array === 'string') {
                        try {
                            metal_name_array = JSON.parse(metal_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid metal_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that metal_name_array is an array
                    if (!Array.isArray(metal_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "metal_name_array must be an array",
                        });
                    }

                    const translationData = [];
                    for (const language of metal_name_array) {
                        translationData.push({
                            metal_id: mydata.id,
                            language_id: language.language_id,
                            metal_name: language.metal_name.trim(),
                        });
                    }
                    
                    const metal_translations = await MetalTranslation.bulkCreate(translationData);
                    mydata.metal_translations = metal_translations;
                }

                return res.status(200).json({
                    success: true,
                    message: "Metal created successfully",
                    data: mydata,
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
                const mydata = await Metal.findAll({
                    where: {
                        deleted_at: null,
                    },
                    attributes: ['id', 'metal_code'],
                    order: [['id', 'DESC']],
                    include: [
                        {
                            model: MetalTranslation,
                            as: 'metal_translations',
                            where: { language_id: languageId.English },
                            attributes: ['id', 'metal_id', 'language_id', 'metal_name'],
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

                // Append metal_name outside array
                const formattedData = mydata.map(metal => {
                    const metalObj = metal.toJSON();
                    if (metalObj.metal_translations && metalObj.metal_translations.length > 0) {
                        metalObj.metal_name = metalObj.metal_translations[0].metal_name;
                    }
                    delete metalObj.metal_translations;
                    return metalObj;
                });

                return res.status(200).json({
                    success: true,
                    message: "Metal fetched successfully",
                    data: formattedData,
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
                const mydata = await Metal.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    },
                    attributes: ['id', 'metal_code'],
                    include: [
                        {
                            model: MetalTranslation,
                            as: 'metal_translations',
                            attributes: ['id', 'metal_id', 'language_id', 'metal_name'],
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
                        message: "Metal not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Metal fetched successfully",
                    data: mydata,
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
                const metalData = await Metal.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });
                if (!metalData) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal not found",
                    });
                }

                // if (!req.body.metal_name || req.body.metal_name === "") {
                //     return res.status(409).json({
                //         success: true,
                //         message: "Please enter metal name",
                //     });
                // }

                if (!req.body.metal_code || req.body.metal_code === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter metal code",
                    });
                }

                const existingMetal = await Metal.findOne({
                    where: {
                        metal_code: req.body.metal_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingMetal) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal code already exists",
                    });
                }

                const data = {
                    // metal_name: req.body.metal_name.trim(),
                    metal_code: req.body.metal_code.trim(),
                };

                await Metal.update(data, {
                    where: { id: req.params.id }
                });

                // Handle metal_name_array updates - parse if it's a string (form-data scenario)
                if (req.body.metal_name_array) {
                    let metal_name_array = req.body.metal_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof metal_name_array === 'string') {
                        try {
                            metal_name_array = JSON.parse(metal_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid metal_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that metal_name_array is an array
                    if (!Array.isArray(metal_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "metal_name_array must be an array",
                        });
                    }

                    // Delete existing translations for this metal
                    await MetalTranslation.destroy({
                        where: { metal_id: req.params.id }
                    });

                    // Create new translations
                    const translationData = [];
                    for (const language of metal_name_array) {
                        translationData.push({
                            metal_id: parseInt(req.params.id),
                            language_id: language.language_id,
                            metal_name: language.metal_name.trim(),
                        });
                    }
                    
                    await MetalTranslation.bulkCreate(translationData);
                }

                const updatedData = await Metal.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Metal updated successfully",
                    data: updatedData,
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
                const metalData = await Metal.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!metalData) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal not found",
                    });
                }

                const dateTime = dateFunc();

                // Delete all translations for this metal
                await MetalTranslation.destroy({
                    where: { metal_id: req.params.id }
                });

                await Metal.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Metal deleted successfully",
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
    };
};
module.exports = metalController;
