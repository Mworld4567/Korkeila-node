const logError = require("../../logger/log");
const Category = require("../../Models/Category");
const StyleMaster = require("../../Models/StyleMaster");
const { Op } = require("sequelize");
const SubCategory = require("../../Models/SubCategory");

const styleMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.style_name || req.body.style_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter style name",
                    });
                }

                if (!req.body.style_code || req.body.style_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter style code",
                    });
                }

                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category master id",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category id",
                    });
                }

                const existingStyle = await StyleMaster.findOne({
                    where: {
                        style_code: req.body.style_code.trim(),
                        category_id: req.body.category_id,
                        sub_category_id: req.body.sub_category_id
                    }
                });

                if (existingStyle) {
                    return res.status(409).json({
                        success: false,
                        message: "Style code already exists",
                    });
                }

                const data = {
                    style_name: req.body.style_name.trim(),
                    style_code: req.body.style_code.trim(),
                    category_id: req.body.category_id,
                    sub_category_id: req.body.sub_category_id
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
                    order: [['id', 'DESC']],
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code']
                        },
                        {
                            model: SubCategory,
                            as: 'sub_category',
                            attributes: ['id', 'sub_category_name', 'sub_category_code']
                        }
                    ]
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
                const mydata = await StyleMaster.findByPk(req.params.id, {
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code']
                        },
                        {
                            model: SubCategory,
                            as: 'sub_category',
                            attributes: ['id', 'sub_category_name', 'sub_category_code']
                        }
                    ]
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
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
                    return res.status(409).json({
                        success: true,
                        message: "Style master not found",
                    });
                }

                if (!req.body.style_name || req.body.style_name === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter style name",
                    });
                }

                if (!req.body.style_code || req.body.style_code === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter style code",
                    });
                }

                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter category id",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter sub category id",
                    });
                }

                const existingStyle = await StyleMaster.findOne({
                    where: {
                        style_code: req.body.style_code.trim(),
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });

                if (existingStyle) {
                    return res.status(409).json({
                        success: false,
                        message: "Style code already exists",
                    });
                }

                const data = {
                    style_name: req.body.style_name.trim(),
                    style_code: req.body.style_code.trim(),
                    category_id: req.body.category_id,
                    sub_category_id: req.body.sub_category_id
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
                    return res.status(409).json({
                        success: true,
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
        styleMasterDropdown: async (req, res) => {
            try {
                const styleMasterData = await StyleMaster.findAll({
                    attributes: ['id', 'style_name'],
                    where: {
                        category_id: req.query.category_id
                    }
                });
                return res.status(200).json({
                    success: true,
                    message: "Style master dropdown fetched successfully",
                    data: styleMasterData,
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

