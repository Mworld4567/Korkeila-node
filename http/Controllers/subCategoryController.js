const logError = require("../../logger/log");
const SubCategory = require("../../Models/SubCategory");
const Category = require("../../Models/Category");
const dateFunc = require("../../helpers/dateFunc");
const { Op } = require("sequelize");

const subCategoryController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.sub_category_name || req.body.sub_category_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category name",
                    });
                }

                if (!req.body.sub_category_code || req.body.sub_category_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category code",
                    });
                }

                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category id",
                    });
                }

                // Validate category exists
                const category = await Category.findOne({
                    where: {
                        id: req.body.category_id,
                        deleted_at: null
                    }
                });

                if (!category) {
                    return res.status(409).json({
                        success: true,
                        message: "Category not found",
                    });
                }

                const existingSubCategory = await SubCategory.findOne({
                    where: {
                        sub_category_code: req.body.sub_category_code.trim(),
                        category_id: req.body.category_id,
                        deleted_at: null
                    }
                });

                if (existingSubCategory) {
                    return res.status(409).json({
                        success: false,
                        message: "Sub category code already exists for this category",
                    });
                }

                const data = {
                    sub_category_name: req.body.sub_category_name.trim(),
                    sub_category_code: req.body.sub_category_code.trim(),
                    category_id: req.body.category_id,
                };

                const mydata = await SubCategory.create(data);

                const createdData = await SubCategory.findByPk(mydata.id, {
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name', 'category_code']
                    }]
                });

                return res.status(200).json({
                    success: true,
                    message: "Sub category created successfully",
                    data: createdData,
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
                const mydata = await SubCategory.findAll({
                    where: {
                        deleted_at: null,
                    },
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name', 'category_code']
                    }],
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Sub category fetched successfully",
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
                const mydata = await SubCategory.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    },
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name', 'category_code']
                    }]
                });

                if (!mydata) {
                    return res.status(409).json({
                        success: true,
                        message: "Sub category not found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Sub category fetched successfully",
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
        readByCategory: async (req, res) => {
            try {
                if (!req.params.category_id) {
                    return res.status(409).json({
                        success: false,
                        message: "Please provide category id",
                    });
                }

                const mydata = await SubCategory.findAll({
                    where: {
                        category_id: req.params.category_id,
                        deleted_at: null,
                    },
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name', 'category_code']
                    }],
                    order: [['id', 'DESC']]
                });

                return res.status(200).json({
                    success: true,
                    message: "Sub categories fetched successfully",
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
                const subCategoryData = await SubCategory.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!subCategoryData) {
                    return res.status(409).json({
                        success: true,
                        message: "Sub category not found",
                    });
                }

                if (!req.body.sub_category_name || req.body.sub_category_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category name",
                    });
                }

                if (!req.body.sub_category_code || req.body.sub_category_code === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter sub category code",
                    });
                }

                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter category id",
                    });
                }

                // Validate category exists
                const category = await Category.findOne({
                    where: {
                        id: req.body.category_id,
                        deleted_at: null
                    }
                });

                if (!category) {
                    return res.status(409).json({
                        success: true,
                        message: "Category not found",
                    });
                }

                const existingSubCategory = await SubCategory.findOne({
                    where: {
                        sub_category_code: req.body.sub_category_code.trim(),
                        category_id: req.body.category_id,
                        id: { [Op.ne]: parseInt(req.params.id) },
                        deleted_at: null
                    }
                });

                if (existingSubCategory) {
                    return res.status(409).json({
                        success: false,
                        message: "Sub category code already exists for this category",
                    });
                }

                const data = {
                    sub_category_name: req.body.sub_category_name.trim(),
                    sub_category_code: req.body.sub_category_code.trim(),
                    category_id: req.body.category_id,
                };

                await SubCategory.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await SubCategory.findByPk(req.params.id, {
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name', 'category_code']
                    }]
                });

                return res.status(200).json({
                    success: true,
                    message: "Sub category updated successfully",
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
                const subCategoryData = await SubCategory.findOne({
                    where: {
                        id: req.params.id,
                        deleted_at: null
                    }
                });

                if (!subCategoryData) {
                    return res.status(409).json({
                        success: true,
                        message: "Sub category not found",
                    });
                }

                const dateTime = dateFunc();

                await SubCategory.update(
                    { deleted_at: dateTime },
                    { where: { id: req.params.id } }
                );

                return res.status(200).json({
                    success: true,
                    message: "Sub category deleted successfully",
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
        subCategoryDropdown: async (req, res) => {
            try {
                const subCategoryData = await SubCategory.findAll({
                    attributes: ['id', 'sub_category_name'],
                    where: {
                        category_id: req.query.category_id,
                    },
                });

                return res.status(200).json({
                    success: true,
                    message: "Sub category dropdown fetched successfully",
                    data: subCategoryData,
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
        subCategoryListingForEcomHomePage: async (req, res) => {
            try {
                const subCategoryData = await SubCategory.findAll({
                    attributes: ['id', 'sub_category_name'],
                    where: {
                        category_id: req.query.category_id,
                    },
                });
                return res.status(200).json({
                    success: true,
                    message: "Sub category listing for ecom home page fetched successfully",
                    data: subCategoryData,
                });
            }
            catch (error) {
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
module.exports = subCategoryController;
