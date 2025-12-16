const logError = require("../../logger/log");
const CutMaster = require("../../Models/CutMaster");
const { Op } = require("sequelize");

const cutMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.cut_name || req.body.cut_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter cut name",
                    });
                }

                if (!req.body.cut_code || req.body.cut_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter cut code",
                    });
                }

                const existingCut = await CutMaster.findOne({
                    where: {
                        cut_code: req.body.cut_code.trim()
                    }
                });

                if (existingCut) {
                    return res.status(401).json({
                        success: false,
                        message: "Cut code already exists",
                    });
                }

                const data = {
                    cut_name: req.body.cut_name.trim(),
                    cut_code: req.body.cut_code.trim(),
                };

                const mydata = await CutMaster.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Cut master created successfully",
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
                const mydata = await CutMaster.findAll({
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Cut master fetched successfully",
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
                const mydata = await CutMaster.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(401).json({
                        success: false,
                        message: "Cut master not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Cut master fetched successfully",
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
                const cutData = await CutMaster.findByPk(req.params.id);
                if (!cutData) {
                    return res.status(401).json({
                        success: false,
                        message: "Cut master not found",
                    });
                }

                if (!req.body.cut_name || req.body.cut_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter cut name",
                    });
                }

                if (!req.body.cut_code || req.body.cut_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter cut code",
                    });
                }

                const existingCut = await CutMaster.findOne({
                    where: {
                        cut_code: req.body.cut_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingCut) {
                    return res.status(401).json({
                        success: false,
                        message: "Cut code already exists",
                    });
                }

                const data = {
                    cut_name: req.body.cut_name.trim(),
                    cut_code: req.body.cut_code.trim(),
                };

                await CutMaster.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await CutMaster.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Cut master updated successfully",
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
                const cutData = await CutMaster.findByPk(req.params.id);
                if (!cutData) {
                    return res.status(401).json({
                        success: false,
                        message: "Cut master not found",
                    });
                }

                await CutMaster.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Cut master deleted successfully",
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

module.exports = cutMasterController;

