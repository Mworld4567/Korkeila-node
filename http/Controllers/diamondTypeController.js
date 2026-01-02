const logError = require("../../logger/log");
const DiamondType = require("../../Models/DiamondType");
const DiamondTypeTranslation = require("../../Models/DiamondTypeTranslation");
const Language = require("../../Models/Language");
const { Op } = require("sequelize");
const { languageId } = require("../../config/globalVariable");

const diamondTypeController = () => {
    return {
        create: async (req, res) => {
            try {
                // if (!req.body.type_name || req.body.type_name === "") {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter type name",
                //     });
                // }

                if (!req.body.type_code || req.body.type_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter type code",
                    });
                }

                const existingType = await DiamondType.findOne({
                    where: {
                        type_code: req.body.type_code.trim()
                    }
                });

                if (existingType) {
                    return res.status(409).json({
                        success: false,
                        message: "Type code already exists",
                    });
                }

                const data = {
                    // type_name: req.body.type_name.trim(),
                    type_code: req.body.type_code.trim(),
                };

                const mydata = await DiamondType.create(data);

                // Handle type_name_array - parse if it's a string (form-data scenario)
                if (req.body.type_name_array) {
                    let type_name_array = req.body.type_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof type_name_array === 'string') {
                        try {
                            type_name_array = JSON.parse(type_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid type_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that type_name_array is an array
                    if (!Array.isArray(type_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "type_name_array must be an array",
                        });
                    }

                    const translationData = [];
                    for (const language of type_name_array) {
                        translationData.push({
                            diamond_type_id: mydata.id,
                            language_id: language.language_id,
                            diamond_type_name: language.type_name.trim(),
                        });
                    }
                    
                    const diamond_type_translations = await DiamondTypeTranslation.bulkCreate(translationData);
                    mydata.diamond_type_translations = diamond_type_translations;
                }

                return res.status(200).json({
                    success: true,
                    message: "Diamond type created successfully",
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
                const mydata = await DiamondType.findAll({
                    attributes: ['id', 'type_code'],
                    order: [['id', 'DESC']],
                    include: [
                        {
                            model: DiamondTypeTranslation,
                            as: 'diamond_type_translations',
                            where: { language_id: languageId.English },
                            attributes: ['id', 'diamond_type_id', 'language_id', 'diamond_type_name'],
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

                // Append diamond_type_name outside array
                const formattedData = mydata.map(diamondType => {
                    const diamondTypeObj = diamondType.toJSON();
                    if (diamondTypeObj.diamond_type_translations && diamondTypeObj.diamond_type_translations.length > 0) {
                        diamondTypeObj.diamond_type_name = diamondTypeObj.diamond_type_translations[0].diamond_type_name;
                    }
                    delete diamondTypeObj.diamond_type_translations;
                    return diamondTypeObj;
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond type fetched successfully",
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
                const mydata = await DiamondType.findOne({
                    where: {
                        id: req.params.id
                    },
                    attributes: ['id', 'type_code'],
                    include: [
                        {
                            model: DiamondTypeTranslation,
                            as: 'diamond_type_translations',
                            attributes: ['id', 'diamond_type_id', 'language_id', 'diamond_type_name'],
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
                        message: "Diamond type not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Diamond type fetched successfully",
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
                const typeData = await DiamondType.findByPk(req.params.id);
                if (!typeData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond type not found",
                    });
                }

                // if (!req.body.type_name || req.body.type_name === "") {
                //     return res.status(409).json({
                //         success: true,
                //         message: "Please enter type name",
                //     });
                // }

                if (!req.body.type_code || req.body.type_code === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter type code",
                    });
                }

                const existingType = await DiamondType.findOne({
                    where: {
                        type_code: req.body.type_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingType) {
                    return res.status(409).json({
                        success: false,
                        message: "Type code already exists",
                    });
                }

                const data = {
                    // type_name: req.body.type_name.trim(),
                    type_code: req.body.type_code.trim(),
                };

                await DiamondType.update(data, {
                    where: { id: req.params.id }
                });

                // Handle type_name_array updates - parse if it's a string (form-data scenario)
                if (req.body.type_name_array) {
                    let type_name_array = req.body.type_name_array;
                    
                    // Parse if it's a JSON string (when sent as form-data)
                    if (typeof type_name_array === 'string') {
                        try {
                            type_name_array = JSON.parse(type_name_array.trim());
                        } catch (error) {
                            return res.status(409).json({
                                success: false,
                                message: "Invalid type_name_array format. Please ensure it's valid JSON array",
                            });
                        }
                    }

                    // Validate that type_name_array is an array
                    if (!Array.isArray(type_name_array)) {
                        return res.status(409).json({
                            success: false,
                            message: "type_name_array must be an array",
                        });
                    }

                    // Delete existing translations for this diamond type
                    await DiamondTypeTranslation.destroy({
                        where: { diamond_type_id: req.params.id }
                    });

                    // Create new translations
                    const translationData = [];
                    for (const language of type_name_array) {
                        translationData.push({
                            diamond_type_id: parseInt(req.params.id),
                            language_id: language.language_id,
                            diamond_type_name: language.type_name.trim(),
                        });
                    }
                    
                    await DiamondTypeTranslation.bulkCreate(translationData);
                }

                const updatedData = await DiamondType.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Diamond type updated successfully",
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
                const typeData = await DiamondType.findByPk(req.params.id);
                if (!typeData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond type not found",
                    });
                }

                // Delete all translations for this diamond type
                await DiamondTypeTranslation.destroy({
                    where: { diamond_type_id: req.params.id }
                });

                await DiamondType.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond type deleted successfully",
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
module.exports = diamondTypeController;
