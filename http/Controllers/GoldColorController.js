const logError = require("../../logger/log");
const GoldColor = require("../../Models/GoldColor");
const dateFunc = require("../../helpers/dateFunc");
const { Op } = require("sequelize");

const goldColorController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.color || req.body.color === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter color",
                    });
                }

                if (!req.body.colour_code || req.body.colour_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter colour code",
                    });
                }

                const existingGoldColor = await GoldColor.findOne({
                    where: {
                        metal_type_id: req.body.metal_type_id,
                        colour_code: req.body.colour_code.trim(),
                        deleted_at: null
                    }
                });

                if (existingGoldColor) {
                    return res.status(401).json({
                        success: false,
                        message: "Colour code already exists",
                    });
                }

                const data = {
                    color: req.body.color.trim(),
                    colour_code: req.body.colour_code.trim(),
                    metal_type_id: req.body.metal_type_id,
                };

                const mydata = await GoldColor.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Gold color created successfully",
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
                const mydata = await GoldColor.findAll({
                    where: {
                        deleted_at: null,
                    },
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Gold color fetched successfully",
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
                const mydata = await GoldColor.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!mydata) {
                    return res.status(204).json({
                        success: true,
                        message: "Gold color not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Gold color fetched successfully",
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
                const goldColorData = await GoldColor.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!goldColorData) {
                    return res.status(204).json({
                        success: true,
                        message: "Gold color not found",
                    });
                }

                if (!req.body.color || req.body.color === "") {
                    return res.status(204).json({
                        success: true,
                        message: "Please enter color",
                    });
                }

                if (!req.body.colour_code || req.body.colour_code === "") {
                    return res.status(204).json({
                        success: true,
                        message: "Please enter colour code",
                    });
                }

                const existingGoldColor = await GoldColor.findOne({
                    where: {
                        colour_code: req.body.colour_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingGoldColor) {
                    return res.status(204).json({
                        success: true,
                        message: "Colour code already exists",
                    });
                }

                const data = {
                    color: req.body.color.trim(),
                    colour_code: req.body.colour_code.trim(),
                };

                await GoldColor.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await GoldColor.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Gold color updated successfully",
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
                const goldColorData = await GoldColor.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!goldColorData) {
                    return res.status(204).json({
                        success: true,
                        message: "Gold color not found",
                    });
                }

                const dateTime = dateFunc();

                await GoldColor.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Gold color deleted successfully",
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

module.exports = goldColorController;
