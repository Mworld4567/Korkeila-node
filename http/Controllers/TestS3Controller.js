const logError = require("../../logger/log");
// const { uploadInS3Image, checkFileExists, deleteFromBucket, saveToBucket } = require("../middlewares/awsS3Middleware");

const testS3Controller = () => {
    return {
        // Test endpoint for S3 image upload using multer middleware
        testImageUpload: async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Please upload an image file (jpeg/png/jpg)",
                    });
                }

                // The file is already uploaded to S3 by the middleware
                // req.file.location contains the S3 URL
                const fileUrl = req.file.location || `${process.env.AWS_URL}${req.file.key}`;

                return res.status(200).json({
                    success: true,
                    message: "Image uploaded to S3 successfully",
                    data: {
                        originalName: req.file.originalname,
                        fileName: req.file.key,
                        fileSize: req.file.size,
                        mimeType: req.file.mimetype,
                        s3Url: fileUrl,
                        bucket: req.file.bucket,
                        location: req.file.location,
                    },
                });
            } catch (error) {
                console.log("S3 Upload Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload image to S3",
                    error: error.message,
                });
            }
        },

        // Test endpoint to check if a file exists in S3
        testCheckFileExists: async (req, res) => {
            try {
                const { filePath } = req.body;

                if (!filePath) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide filePath in request body",
                    });
                }

                const exists = await checkFileExists(filePath);

                return res.status(200).json({
                    success: true,
                    message: "File existence check completed",
                    data: {
                        filePath: filePath,
                        exists: exists,
                    },
                });
            } catch (error) {
                console.log("Check File Exists Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check file existence",
                    error: error.message,
                });
            }
        },

        // Test endpoint to delete a file from S3
        testDeleteFile: async (req, res) => {
            try {
                const { filePath } = req.body;

                if (!filePath) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide filePath in request body",
                    });
                }

                const deleted = await deleteFromBucket(filePath);

                return res.status(200).json({
                    success: true,
                    message: "File deleted from S3 successfully",
                    data: {
                        filePath: filePath,
                        deleted: deleted,
                    },
                });
            } catch (error) {
                console.log("Delete File Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete file from S3",
                    error: error.message,
                });
            }
        },

        // Test endpoint to get S3 connection status
        testS3Connection: async (req, res) => {
            try {
                return res.status(200).json({
                    success: true,
                    message: "S3 configuration check",
                    data: {
                        awsRegion: process.env.AWS_REGION || "Not configured",
                        awsBucketName: process.env.AWS_BUCKET_NAME || "Not configured",
                        awsUrl: process.env.AWS_URL || "Not configured",
                        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                        hasSecretKey: !!process.env.AWS_SECRET_KEY,
                    },
                });
            } catch (error) {
                console.log("S3 Connection Test Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check S3 connection",
                    error: error.message,
                });
            }
        },
    };
};

module.exports = testS3Controller;

