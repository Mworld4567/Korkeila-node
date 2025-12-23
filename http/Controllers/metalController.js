const logError = require("../../logger/log");
const Metal = require("../../Models/Metal");
const { Op } = require("sequelize");

const metalController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.metal_name || req.body.metal_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter metal name",
                    });
                }

                const existingMetal = await Metal.findOne({
                    where: {
                        metal_name: req.body.metal_name.trim()
                    }
                });

                if (existingMetal) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal name already exists",
                    });
                }

                const data = {
                    metal_name: req.body.metal_name.trim(),
                    metal_code: req.body.metal_code ? req.body.metal_code : null,
                };

                const mydata = await Metal.create(data);

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
                    order: [['id', 'DESC']]
                });

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
        readOne: async (req, res) => {
            try {
                const mydata = await Metal.findByPk(req.params.id);

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
                const metalData = await Metal.findByPk(req.params.id);
                if (!metalData) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal not found",
                    });
                }

                if (!req.body.metal_name || req.body.metal_name === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter metal name",
                    });
                }

                const existingMetal = await Metal.findOne({
                    where: {
                        metal_name: req.body.metal_name.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingMetal) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal name already exists",
                    });
                }

                const data = {
                    metal_name: req.body.metal_name.trim(),
                    metal_code: req.body.metal_code,
                };

                await Metal.update(data, {
                    where: { id: req.params.id }
                });

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
                const metalData = await Metal.findByPk(req.params.id);
                if (!metalData) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal not found",
                    });
                }

                await Metal.destroy({
                    where: { id: req.params.id }
                });

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
