const logError = require("../../logger/log");
const CategoryMaster = require("../../Models/CategoryMaster");
const dateFunc = require("../../helpers/dateFunc");
const { Op } = require("sequelize");

const categoryMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.category_name || req.body.category_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category name",
                    });
                }

                if (!req.body.category_code || req.body.category_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category code",
                    });
                }

                const existingCategory = await CategoryMaster.findOne({
                    where: {
                        category_code: req.body.category_code.trim(),
                        deleted_at: null
                    }
                });

                if (existingCategory) {
                    return res.status(401).json({
                        success: false,
                        message: "Category code already exists",
                    });
                }

                const data = {
                    category_name: req.body.category_name.trim(),
                    category_code: req.body.category_code.trim(),
                };

                const mydata = await CategoryMaster.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Category master created successfully",
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
                const mydata = await CategoryMaster.findAll({
                    where: {
                        deleted_at: null
                    },
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Category master fetched successfully",
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
                const mydata = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!mydata) {
                    return res.status(401).json({
                        success: false,
                        message: "Category master not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Category master fetched successfully",
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
                const categoryData = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!categoryData) {
                    return res.status(401).json({
                        success: false,
                        message: "Category master not found",
                    });
                }

                if (!req.body.category_name || req.body.category_name === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category name",
                    });
                }

                if (!req.body.category_code || req.body.category_code === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category code",
                    });
                }

                const existingCategory = await CategoryMaster.findOne({
                    where: {
                        category_code: req.body.category_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingCategory) {
                    return res.status(401).json({
                        success: false,
                        message: "Category code already exists",
                    });
                }

                const data = {
                    category_name: req.body.category_name.trim(),
                    category_code: req.body.category_code.trim(),
                };

                await CategoryMaster.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await CategoryMaster.findByPk(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: "Category master updated successfully",
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
                const categoryData = await CategoryMaster.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!categoryData) {
                    return res.status(401).json({
                        success: false,
                        message: "Category master not found",
                    });
                }

                const dateTime = dateFunc();

                await CategoryMaster.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Category master deleted successfully",
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

module.exports = categoryMasterController;

