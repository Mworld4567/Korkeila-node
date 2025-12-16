const logError = require("../../logger/log");
const StyleMaster = require("../../Models/StyleMaster");
const { Op } = require("sequelize");

const styleMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.style_name || req.body.style_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style name",
                    });
                }

                if (!req.body.style_code || req.body.style_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style code",
                    });
                }

                const existingStyle = await StyleMaster.findOne({
                    where: {
                        style_code: req.body.style_code.trim()
                    }
                });

                if (existingStyle) {
                    return res.status(401).json({
                        success: false,
                        message: "Style code already exists",
                    });
                }

                const data = {
                    style_name: req.body.style_name.trim(),
                    style_code: req.body.style_code.trim(),
                };

                const mydata = await StyleMaster.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Style master created successfully",
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
                const mydata = await StyleMaster.findAll({
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Style master fetched successfully",
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
                const mydata = await StyleMaster.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(401).json({
                        success: false,
                        message: "Style master not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Style master fetched successfully",
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
                const styleData = await StyleMaster.findByPk(req.params.id);
                if (!styleData) {
                    return res.status(401).json({
                        success: false,
                        message: "Style master not found",
                    });
                }

                if (!req.body.style_name || req.body.style_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style name",
                    });
                }

                if (!req.body.style_code || req.body.style_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style code",
                    });
                }

                const existingStyle = await StyleMaster.findOne({
                    where: {
                        style_code: req.body.style_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingStyle) {
                    return res.status(401).json({
                        success: false,
                        message: "Style code already exists",
                    });
                }

                const data = {
                    style_name: req.body.style_name.trim(),
                    style_code: req.body.style_code.trim(),
                };

                await StyleMaster.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await StyleMaster.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Style master updated successfully",
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
                const styleData = await StyleMaster.findByPk(req.params.id);
                if (!styleData) {
                    return res.status(401).json({
                        success: false,
                        message: "Style master not found",
                    });
                }

                await StyleMaster.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Style master deleted successfully",
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

module.exports = styleMasterController;

