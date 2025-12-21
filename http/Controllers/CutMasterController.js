const logError = require("../../logger/log");
const CutMaster = require("../../Models/CutMaster");
const { Op } = require("sequelize");
const { deleteFromBucket } = require("../middlewares/awsS3Middleware");
const { extractFilename, constructImageUrl } = require("../../helpers/imageHelper");

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

                // Handle image - store only filename (last part) in database
                let cut_image = null;
                if (req.file && req.file.key) {
                    // Image uploaded as file - extract only the filename (last part)
                    cut_image = extractFilename(req.file.key);
                } else if (req.body.cut_image && req.body.cut_image !== "") {
                    // Image provided as text (filename or URL) - extract only filename
                    cut_image = extractFilename(req.body.cut_image.trim());
                }

                const data = {
                    cut_name: req.body.cut_name.trim(),
                    cut_code: req.body.cut_code.trim(),
                    cut_image: cut_image,
                };

                const mydata = await CutMaster.create(data);

                // Construct full URL for response
                const responseData = mydata.toJSON();
                responseData.cut_image = constructImageUrl(responseData.cut_image, 'cutMaster');

                return res.status(200).json({
                    success: true,
                    message: "Cut master created successfully",
                    data: responseData,
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

                // Construct full URLs for images dynamically
                const dataWithUrls = mydata.map(item => {
                    const itemData = item.toJSON();
                    itemData.cut_image = constructImageUrl(itemData.cut_image, 'cutMaster');
                    return itemData;
                });

                return res.status(200).json({
                    success: true,
                    message: "Cut master fetched successfully",
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
                const mydata = await CutMaster.findByPk(req.params.id);

                if (!mydata) {
                    return res.status(204).json({
                        success: true,
                        message: "Cut master not found",
                    });
                }

                // Construct full URL for image dynamically
                const responseData = mydata.toJSON();
                responseData.cut_image = constructImageUrl(responseData.cut_image);

                return res.status(200).json({
                    success: true,
                    message: "Cut master fetched successfully",
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
                const cutData = await CutMaster.findByPk(req.params.id);
                if (!cutData) {
                    return res.status(204).json({
                        success: true,
                        message: "Cut master not found",
                    });
                }

                if (!req.body.cut_name || req.body.cut_name === "") {
                    return res.status(204).json({
                        success: true,
                        message: "Please enter cut name",
                    });
                }

                if (!req.body.cut_code || req.body.cut_code === "") {
                    return res.status(204).json({
                        success: true,
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

                // Handle image - always extract only filename (last part), even from existing data
                let cut_image = null;
                
                // Handle new image upload
                if (req.file && req.file.key) {
                    // Delete old image from S3 if exists
                    if (cutData.cut_image) {
                        try {
                            // Extract filename from old value (might be URL, path, or just filename)
                            const oldFilename = extractFilename(cutData.cut_image);
                            // Construct full S3 key for deletion: public/cutMaster/image/{filename}
                            const fullOldKey = `public/cutMaster/image/${oldFilename}`;
                            await deleteFromBucket(fullOldKey);
                        } catch (deleteError) {
                            console.log("Error deleting old image:", deleteError);
                            // Continue even if deletion fails
                        }
                    }
                    
                    // Store only filename (last part)
                    cut_image = extractFilename(req.file.key);
                } else if (req.body.cut_image && req.body.cut_image !== "") {
                    // Image provided as text - extract only filename
                    cut_image = extractFilename(req.body.cut_image.trim());
                } else if (cutData.cut_image) {
                    // No new image provided, but existing image exists - extract only filename from it (might be URL or path)
                    cut_image = extractFilename(cutData.cut_image);
                }

                const data = {
                    cut_name: req.body.cut_name.trim(),
                    cut_code: req.body.cut_code.trim(),
                    cut_image: cut_image,
                };

                await CutMaster.update(data, {
                    where: { id: req.params.id }
                });

                const updatedData = await CutMaster.findByPk(req.params.id);

                // Construct full URL for response
                const responseData = updatedData.toJSON();
                responseData.cut_image = constructImageUrl(responseData.cut_image, 'cutMaster');

                return res.status(200).json({
                    success: true,
                    message: "Cut master updated successfully",
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
                const cutData = await CutMaster.findByPk(req.params.id);
                if (!cutData) {
                    return res.status(204).json({
                        success: true,
                        message: "Cut master not found",
                    });
                }

                // Delete image from S3 if exists
                if (cutData.cut_image) {
                    try {
                        // Extract filename from stored value (might be URL, path, or just filename)
                        const filename = extractFilename(cutData.cut_image);
                        // Construct full S3 key for deletion: public/cutMaster/image/{filename}
                        const fullOldKey = `public/cutMaster/image/${filename}`;
                        await deleteFromBucket(fullOldKey);
                    } catch (deleteError) {
                        console.log("Error deleting image from S3:", deleteError);
                        // Continue even if deletion fails
                    }
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

