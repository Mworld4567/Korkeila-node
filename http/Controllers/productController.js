const logError = require("../../logger/log");
const Product = require("../../Models/Product");
const Category = require("../../Models/Category");
const SubCategory = require("../../Models/SubCategory");
const StyleMaster = require("../../Models/StyleMaster");
const { Op } = require("sequelize");
const { deleteFromBucket } = require("../middlewares/awsS3Middleware");

// Helper function to extract filename from URL or key
const extractFilename = (imagePath) => {
    if (!imagePath) return null;

    // If it's already just a filename/key (no http/https), return as is
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
        // Remove 'public/' prefix if present
        return imagePath.startsWith('public/') ? imagePath.substring(7) : imagePath;
    }

    // Extract filename from full URL
    const url = new URL(imagePath);
    let path = url.pathname;
    // Remove leading slash
    if (path.startsWith('/')) {
        path = path.substring(1);
    }
    return path;
};

// Helper function to construct full URL from filename
const constructImageUrl = (filename) => {
    if (!filename) return null;

    // If it's already a full URL, return as is (for backward compatibility)
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    const cloudfrontUrl = process.env.AWS_URL;
    const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
    return `${baseUrl}${filename}`;
};

const productController = () => {
    return {
        create: async (req, res) => {
            try {

                // Validate required fields
                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category ID",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter sub category ID",
                    });
                }

                if (!req.body.style_id || req.body.style_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style ID",
                    });
                }

                // Handle image - store only filename/key in database
                let product_image = null;
                if (req.file && req.file.key) {
                    // Image uploaded as file - extract and store only the key/filename
                    let urlPath = req.file.key;
                    if (urlPath.startsWith('public/')) {
                        urlPath = urlPath.substring(7);
                    }
                    product_image = urlPath;
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text (filename or URL) - extract filename
                    product_image = extractFilename(req.body.image.trim());
                } else {
                    return res.status(401).json({
                        success: false,
                        message: "Please provide product image",
                    });
                }

                // Get is_display value, default to 1 if not provided
                const is_display = req.body.is_display !== undefined ? parseInt(req.body.is_display) : 1;

                const data = {
                    category_id: parseInt(req.body.category_id),
                    category_name: req.body.category_name,
                    sub_category_id: parseInt(req.body.sub_category_id),
                    sub_category_name: req.body.sub_category_name,
                    style_id: parseInt(req.body.style_id),
                    style_name: req.body.style_name,
                    image: product_image, // Store only filename/key
                    is_display: is_display,
                };

                // Construct full URL for response
               const product = await Product.create(data);
                data.id = product.id;

                return res.status(200).json({
                    success: true,
                    message: "Product created successfully",
                    data: data,
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
                const mydata = await Product.findAll({
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                // Construct full URLs for images dynamically
                const dataWithUrls = mydata.map(item => {
                    const itemData = item.toJSON();
                    itemData.image = constructImageUrl(itemData.image);
                    return itemData;
                });

                return res.status(200).json({
                    success: true,
                    message: "Products fetched successfully",
                    data: dataWithUrls,
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
                const mydata = await Product.findByPk(req.params.id, {
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        }
                    ]
                });

                if (!mydata) {
                    return res.status(204).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Construct full URL for image dynamically
                const responseData = mydata.toJSON();
                responseData.image = constructImageUrl(responseData.image);

                return res.status(200).json({
                    success: true,
                    message: "Product fetched successfully",
                    data: responseData,
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
                const productData = await Product.findByPk(req.params.id);
                if (!productData) {
                    return res.status(204).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Validate required fields
                if (!req.body.category_id || req.body.category_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter category ID",
                    });
                }

                if (!req.body.sub_category_id || req.body.sub_category_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter sub category ID",
                    });
                }

                if (!req.body.style_id || req.body.style_id === "") {
                    return res.status(401).json({
                        success: false,
                        message: "Please enter style ID",
                    });
                }

                let product_image = productData.image; // Keep existing filename

                // Handle new image upload
                if (req.file && req.file.key) {
                    // Delete old image from S3 if exists
                    if (productData.image) {
                        try {
                            const oldKey = productData.image;
                            const fullOldKey = oldKey.startsWith('public/') ? oldKey : `public/${oldKey}`;
                            await deleteFromBucket(fullOldKey);
                        } catch (deleteError) {
                            console.log("Error deleting old image:", deleteError);
                            // Continue even if deletion fails
                        }
                    }

                    // Store only filename/key
                    let urlPath = req.file.key;
                    if (urlPath.startsWith('public/')) {
                        urlPath = urlPath.substring(7);
                    }
                    product_image = urlPath;
                } else if (req.body.image && req.body.image !== "") {
                    // Image provided as text - extract filename
                    product_image = extractFilename(req.body.image.trim());
                }

                // Get is_display value
                const is_display = req.body.is_display !== undefined ? parseInt(req.body.is_display) : productData.is_display;

                const data = {
                    category_id: parseInt(req.body.category_id),
                    sub_category_id: parseInt(req.body.sub_category_id),
                    style_id: parseInt(req.body.style_id),
                    image: product_image, // Store only filename/key
                    is_display: is_display,
                };

                await Product.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await Product.findByPk(req.params.id, {
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'category_name', 'category_code', 'image']
                        },
                        {
                            model: SubCategory,
                            as: 'subCategory',
                            attributes: ['id', 'sub_category_name', 'sub_category_code', 'category_id']
                        },
                        {
                            model: StyleMaster,
                            as: 'style',
                            attributes: ['id', 'style_name', 'style_code', 'category_id', 'sub_category_id']
                        }
                    ]
                });

                // Construct full URL for response
                const responseData = updatedData.toJSON();
                responseData.image = constructImageUrl(responseData.image);

                return res.status(200).json({
                    success: true,
                    message: "Product updated successfully",
                    data: responseData,
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
                const productData = await Product.findByPk(req.params.id);
                if (!productData) {
                    return res.status(204).json({
                        success: true,
                        message: "Product not found",
                    });
                }

                // Delete image from S3 if exists
                if (productData.image) {
                    try {
                        const oldKey = productData.image;
                        const fullOldKey = oldKey.startsWith('public/') ? oldKey : `public/${oldKey}`;
                        await deleteFromBucket(fullOldKey);
                    } catch (deleteError) {
                        console.log("Error deleting image from S3:", deleteError);
                        // Continue even if deletion fails
                    }
                }

                await Product.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Product deleted successfully",
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

module.exports = productController;

