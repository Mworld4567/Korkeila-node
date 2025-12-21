const logError = require("../../logger/log");
const Karat = require("../../Models/Karat");
const { Op } = require("sequelize");

const karatController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.karat || req.body.karat === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter karat",
                    });
                }

                const existingKarat = await Karat.findOne({
                    where: {
                        karat: req.body.karat.trim()
                    }
                });

                if (existingKarat) {
                    return res.status(409).json({
                        success: false,
                        message: "Karat already exists",
                    });
                }

                const data = {
                    karat: req.body.karat.trim(),
                };

                const mydata = await Karat.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Karat created successfully",
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
                const mydata = await Karat.findAll({
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Karat fetched successfully",
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
                const mydata = await Karat.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Karat not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Karat fetched successfully",
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
                const karatData = await Karat.findByPk(req.params.id);
                if (!karatData) {
                    return res.status(409).json({
                        success: true,
                        message: "Karat not found",
                    });
                }

                if (!req.body.karat || req.body.karat === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter karat",
                    });
                }

                const existingKarat = await Karat.findOne({
                    where: {
                        karat: req.body.karat.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingKarat) {
                    return res.status(409).json({
                        success: false,
                        message: "Karat already exists",
                    });
                }

                const data = {
                    karat: req.body.karat.trim(),
                };

                await Karat.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await Karat.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Karat updated successfully",
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
                const karatData = await Karat.findByPk(req.params.id);
                if (!karatData) {
                    return res.status(409).json({
                        success: true,
                        message: "Karat not found",
                    });
                }

                await Karat.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Karat deleted successfully",
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
module.exports = karatController;
