const logError = require("../../logger/log");
const DiamondRate = require("../../Models/DiamondRate");
const DiamondMaster = require("../../Models/DiamondMaster");
const DiamondType = require("../../Models/DiamondType");
const DiamondClarity = require("../../Models/DiamondClarity");
const { Op } = require("sequelize");
const dateFunc = require("../../helpers/dateFunc");

const diamondRateController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.diamond_master_id || req.body.diamond_master_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter diamond master id",
                    });
                }

                if (!req.body.diamond_type_id || req.body.diamond_type_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter diamond type id",
                    });
                }

                if (!req.body.clarity_id || req.body.clarity_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter clarity id",
                    });
                }

                if (req.body.rate === undefined || req.body.rate === null || req.body.rate === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter rate",
                    });
                }

                // Validate foreign keys exist
                const diamondMaster = await DiamondMaster.findOne({
                    where: {
                        id: req.body.diamond_master_id,
                        deleted_at: null
                    }
                });

                if (!diamondMaster) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond master not found",
                    });
                }

                const diamondType = await DiamondType.findOne({
                    where: {
                        id: req.body.diamond_type_id
                    }
                });

                if (!diamondType) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond type not found",
                    });
                }

                const diamondClarity = await DiamondClarity.findOne({
                    where: {
                        id: req.body.clarity_id
                    }
                });

                if (!diamondClarity) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond clarity not found",
                    });
                }

                // Check for existing rate with same combination (excluding soft deleted)
                const existingRate = await DiamondRate.findOne({
                    where: {
                        diamond_master_id: req.body.diamond_master_id,
                        diamond_type_id: req.body.diamond_type_id,
                        clarity_id: req.body.clarity_id,
                        deleted_at: null
                    }
                });

                if (existingRate) {
                    return res.status(409).json({
                        success: false,
                        message: "Diamond rate already exists for this combination",
                    });
                }

                const data = {
                    diamond_master_id: parseInt(req.body.diamond_master_id),
                    diamond_type_id: parseInt(req.body.diamond_type_id),
                    clarity_id: parseInt(req.body.clarity_id),
                    rate: parseFloat(req.body.rate),
                };

                const mydata = await DiamondRate.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate created successfully",
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
                const mydata = await DiamondRate.findAll({
                    where: {
                        deleted_at: null
                    },
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate fetched successfully",
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
        readOne: async (req, res) => {
            try {
                const mydata = await DiamondRate.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond rate not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate fetched successfully",
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
                const rateData = await DiamondRate.findByPk(req.params.id);
                if (!rateData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond rate not found",
                    });
                }

                if (!req.body.diamond_master_id || req.body.diamond_master_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter diamond master id",
                    });
                }

                if (!req.body.diamond_type_id || req.body.diamond_type_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter diamond type id",
                    });
                }

                if (!req.body.clarity_id || req.body.clarity_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter clarity id",
                    });
                }

                if (req.body.rate === undefined || req.body.rate === null || req.body.rate === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter rate",
                    });
                }

                // Validate foreign keys exist
                const diamondMaster = await DiamondMaster.findOne({
                    where: {
                        id: req.body.diamond_master_id,
                        deleted_at: null
                    }
                });

                if (!diamondMaster) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond master not found",
                    });
                }

                const diamondType = await DiamondType.findOne({
                    where: {
                        id: req.body.diamond_type_id
                    }
                });

                if (!diamondType) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond type not found",
                    });
                }

                const diamondClarity = await DiamondClarity.findOne({
                    where: {
                        id: req.body.clarity_id
                    }
                });

                if (!diamondClarity) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond clarity not found",
                    });
                }

                // Check for existing rate with same combination (excluding current record and soft deleted)
                const existingRate = await DiamondRate.findOne({
                    where: {
                        diamond_master_id: req.body.diamond_master_id,
                        diamond_type_id: req.body.diamond_type_id,
                        clarity_id: req.body.clarity_id,
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingRate) {
                    return res.status(409).json({
                        success: false,
                        message: "Diamond rate already exists for this combination",
                    });
                }

                const data = {
                    diamond_master_id: parseInt(req.body.diamond_master_id),
                    diamond_type_id: parseInt(req.body.diamond_type_id),
                    clarity_id: parseInt(req.body.clarity_id),
                    rate: parseFloat(req.body.rate),
                };

                await DiamondRate.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await DiamondRate.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate updated successfully",
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
                const rateData = await DiamondRate.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!rateData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond rate not found",
                    });
                }

                const dateTime = dateFunc();

                await DiamondRate.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate deleted successfully",
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
        diamondRateDropdown: async (req, res) => {
            try {
                const mydata = await DiamondRate.findAll({
                    attributes: ['id', 'diamond_master_id', 'diamond_type_id', 'clarity_id'],
                    order: [['id', 'ASC']],
                    include: [
                        {
                            model: DiamondMaster,
                            as: 'diamond_master',
                            attributes: ['id', 'carat'],
                        },
                        {
                            model: DiamondType,
                            as: 'diamond_type',
                            attributes: ['id', 'type_name'],
                        },
                        {
                            model: DiamondClarity,
                            as: 'clarity',
                            attributes: ['id', 'clarity'],
                        }
                    ]
                });

                const data = mydata.map((x) => {
                    return {
                        id: x.dataValues.id,
                        name: x.dataValues.diamond_type.dataValues.clarity + " " + x.dataValues.diamond_type.dataValues.type_code + " " + x.dataValues.clarity.dataValues.clarity,
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond rate dropdown fetched successfully",
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
        },
    };
};

module.exports = diamondRateController;
