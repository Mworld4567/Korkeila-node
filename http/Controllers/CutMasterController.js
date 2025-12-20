const logError = require("../../logger/log");
const CutMaster = require("../../Models/CutMaster");
const { Op } = require("sequelize");
const { deleteFromBucket } = require("../middlewares/awsS3Middleware");

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

                let cut_image = null;
                if (req.file && req.file.key) {
                    const cloudfrontUrl = process.env.AWS_URL;
                    let urlPath = req.file.key;
                    if (urlPath.startsWith('public/')) {
                        urlPath = urlPath.substring(7);
                    }
                    const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
                    cut_image = `${baseUrl}${urlPath}`;
                }

                const data = {
                    cut_name: req.body.cut_name.trim(),
                    cut_code: req.body.cut_code.trim(),
                    cut_image: cut_image,
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
                    return res.status(204).json({
                        success: true,
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

                let cut_image = cutData.cut_image;
                
                // Handle new image upload
                if (req.file && req.file.key) {
                    // Delete old image from S3 if exists
                    if (cutData.cut_image) {
                        try {
                            const oldKey = cutData.cut_image.replace(process.env.AWS_URL + '/', '').replace(process.env.AWS_URL, '');
                            if (oldKey && !oldKey.startsWith('public/')) {
                                await deleteFromBucket(`public/cutMaster/image/${oldKey.split('/').pop()}`);
                            } else if (oldKey) {
                                await deleteFromBucket(oldKey);
                            }
                        } catch (deleteError) {
                            console.log("Error deleting old image:", deleteError);
                            // Continue even if deletion fails
                        }
                    }
                    
                    // Construct new image URL
                    const cloudfrontUrl = process.env.AWS_URL;
                    let urlPath = req.file.key;
                    if (urlPath.startsWith('public/')) {
                        urlPath = urlPath.substring(7);
                    }
                    const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
                    cut_image = `${baseUrl}${urlPath}`;
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
                    return res.status(204).json({
                        success: true,
                        message: "Cut master not found",
                    });
                }

                // Delete image from S3 if exists
                if (cutData.cut_image) {
                    try {
                        const oldKey = cutData.cut_image.replace(process.env.AWS_URL + '/', '').replace(process.env.AWS_URL, '');
                        if (oldKey && !oldKey.startsWith('public/')) {
                            await deleteFromBucket(`public/cutMaster/image/${oldKey.split('/').pop()}`);
                        } else if (oldKey) {
                            await deleteFromBucket(oldKey);
                        }
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

