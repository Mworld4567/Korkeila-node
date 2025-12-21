const logError = require("../../logger/log");
const DiamondType = require("../../Models/DiamondType");
const { Op } = require("sequelize");

const diamondTypeController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.type_name || req.body.type_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter type name",
                    });
                }

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
                    type_name: req.body.type_name.trim(),
                    type_code: req.body.type_code.trim(),
                };

                const mydata = await DiamondType.create(data);

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
                    order: [['id', 'DESC']]
                });

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
        readOne: async (req, res) => {
            try {
                const mydata = await DiamondType.findByPk(req.params.id);

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

                if (!req.body.type_name || req.body.type_name === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter type name",
                    });
                }

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
                    type_name: req.body.type_name.trim(),
                    type_code: req.body.type_code.trim(),
                };

                await DiamondType.update(data, {
                    where: { id: req.params.id }
                });

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
