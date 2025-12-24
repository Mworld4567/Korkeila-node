const logError = require("../../logger/log");
const DiamondMaster = require("../../Models/DiamondMaster");
const dateFunc = require("../../helpers/dateFunc");

const diamondMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (req.body.carat === undefined || req.body.carat === null) {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter carat",
                    });
                }

                const caratValue = parseFloat(req.body.carat) || 0;

                // Check if diamond master with same carat already exists
                const existingDiamond = await DiamondMaster.findOne({
                    where: {
                        carat: caratValue,
                        deleted_at: null
                    }
                });

                if (existingDiamond) {
                    return res.status(409).json({
                        success: false,
                        message: "Diamond master with this carat value already exists",
                    });
                }

                // if (req.body.size_from === undefined || req.body.size_from === null) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter size from",
                //     });
                // }

                // if (req.body.size_to === undefined || req.body.size_to === null) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter size to",
                //     });
                // }

                const data = {
                    carat: caratValue,
                    size_from: parseFloat(req.body.size_from) || 0,
                    size_to: parseFloat(req.body.size_to) || 0,
                };

                const mydata = await DiamondMaster.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Diamond master created successfully",
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
                const mydata = await DiamondMaster.findAll({
                    where: {
                        deleted_at: null
                    },
                    attributes: ['id', 'carat'],
                });

                return res.status(200).json({
                    success: true,
                    message: "Diamond master fetched successfully",
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
                const mydata = await DiamondMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    },
                    attributes: ['id', 'carat'],
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond master not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Diamond master fetched successfully",
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
                const diamondData = await DiamondMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!diamondData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond master not found",
                    });
                }

                if (req.body.carat === undefined || req.body.carat === null) {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter carat",
                    });
                }

                // if (req.body.size_from === undefined || req.body.size_from === null) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter size from",
                //     });
                // }

                // if (req.body.size_to === undefined || req.body.size_to === null) {
                //     return res.status(409).json({
                //         success: false,
                //         message: "Please enter size to",
                //     });
                // }

                const data = {
                    carat: parseFloat(req.body.carat) || 0,
                    size_from: parseFloat(req.body.size_from) || 0,
                    size_to: parseFloat(req.body.size_to) || 0,
                };

                await DiamondMaster.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await DiamondMaster.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Diamond master updated successfully",
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
                const diamondData = await DiamondMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!diamondData) {
                    return res.status(409).json({
                        success: true,
                        message: "Diamond master not found",
                    });
                }

                const dateTime = dateFunc();

                await DiamondMaster.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Diamond master deleted successfully",
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
        diamondCaratDropdownEcom: async (req, res) => {
            try {
                const diamondCaratData = await DiamondMaster.findAll({
                    attributes: ['id', 'carat'],
                });
                return res.status(200).json({
                    success: true,
                    message: "Diamond carat dropdown fetched successfully",
                    data: diamondCaratData,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        }
    };
};

module.exports = diamondMasterController;

