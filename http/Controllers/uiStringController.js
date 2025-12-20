const logError = require("../../logger/log");
const UiString = require("../../Models/UiString");
const { Op } = require("sequelize");

const uiStringController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.ui_string_key || req.body.ui_string_key === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter UI string key",
                    });
                }

                const existingString = await UiString.findOne({
                    where: {
                        ui_string_key: req.body.ui_string_key.trim()
                    }
                });

                if (existingString) {
                    return res.status(401).json({
                        success: false,
                        message: "UI string with this key already exists",
                    });
                }

                const data = {
                    ui_string_key: req.body.ui_string_key.trim(),
                };

                const mydata = await UiString.create(data);

                return res.status(200).json({
                    success: true,
                    message: "UI string created successfully",
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
                const mydata = await UiString.findAll({
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "UI string fetched successfully",
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
                const mydata = await UiString.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(204).json({
                        success: true,
                        message: "UI string not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "UI string fetched successfully",
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
                const stringData = await UiString.findByPk(req.params.id);
                if (!stringData) {
                    return res.status(204).json({
                        success: true,
                        message: "UI string not found",
                    });
                }

                if (!req.body.ui_string_key || req.body.ui_string_key === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter UI string key",
                    });
                }

                const existingString = await UiString.findOne({
                    where: {
                        ui_string_key: req.body.ui_string_key.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingString) {
                    return res.status(401).json({
                        success: false,
                        message: "UI string with this key already exists",
                    });
                }

                const data = {
                    ui_string_key: req.body.ui_string_key.trim(),
                };

                await UiString.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await UiString.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "UI string updated successfully",
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
                const stringData = await UiString.findByPk(req.params.id);
                if (!stringData) {
                    return res.status(204).json({
                        success: true,
                        message: "UI string not found",
                    });
                }

                await UiString.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "UI string deleted successfully",
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
module.exports = uiStringController;
