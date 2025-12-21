const logError = require("../../logger/log");
const DiamondClarity = require("../../Models/DiamondClarity");
const { Op } = require("sequelize");

const diamondClarityController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.clarity || req.body.clarity === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter clarity",
                    });
                }

                const existingClarity = await DiamondClarity.findOne({
                    where: {
                        clarity: req.body.clarity.trim()
                    }
                });

                if (existingClarity) {
                    return res.status(409).json({
                        success: false,
                        message: "Clarity already exists",
                    });
                }

                const data = {
                    clarity: req.body.clarity.trim(),
                };

                const mydata = await DiamondClarity.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Diamond clarity created successfully",
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
                const mydata = await DiamondClarity.findAll({
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond clarity fetched successfully",
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
                const mydata = await DiamondClarity.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond clarity not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Diamond clarity fetched successfully",
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
                const clarityData = await DiamondClarity.findByPk(req.params.id);
                if (!clarityData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond clarity not found",
                    });
                }

                if (!req.body.clarity || req.body.clarity === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter clarity",
                    });
                }

                const existingClarity = await DiamondClarity.findOne({
                    where: {
                        clarity: req.body.clarity.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingClarity) {
                    return res.status(409).json({
                        success: false,
                        message: "Clarity already exists",
                    });
                }

                const data = {
                    clarity: req.body.clarity.trim(),
                };

                await DiamondClarity.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await DiamondClarity.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Diamond clarity updated successfully",
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
                const clarityData = await DiamondClarity.findByPk(req.params.id);
                if (!clarityData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond clarity not found",
                    });
                }

                await DiamondClarity.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond clarity deleted successfully",
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
module.exports = diamondClarityController;
