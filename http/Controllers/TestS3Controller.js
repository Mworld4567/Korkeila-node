const logError = require("../../logger/log");
const { uploadInS3Image, checkFileExists, deleteFromBucket, saveToBucket } = require("../middlewares/awsS3Middleware");
const SiteSetting = require("../../Models/SiteSetting");

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

                // Validate that file was properly uploaded
                if (!req.file.key) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed: S3 key is missing",
                    });
                }

                // Construct CloudFront URL
                // Files are stored in public/ subfolder, but CloudFront URL should not include 'public/' prefix
                // Example: S3 key = public/testS3/image/file.jpg -> CloudFront URL = https://d42za7xj4jbwi.cloudfront.net/testS3/image/file.jpg
                const cloudfrontUrl = process.env.AWS_URL
                
                // Remove 'public/' prefix from the key for CloudFront URL
                let urlPath = req.file.key;
                if (urlPath.startsWith('public/')) {
                    urlPath = urlPath.substring(7); // Remove 'public/' (7 characters)
                }
                
                // Ensure CloudFront URL ends with '/' and path doesn't start with '/'
                const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
                const fileUrl = `${baseUrl}${urlPath}`;

                return res.status(200).json({
                    success: true,
                    message: "Image uploaded to S3 successfully",
                    data: {
                        originalName: req.file.originalname || 'unknown',
                        fileName: req.file.key,
                        fileSize: req.file.size || 0,
                        mimeType: req.file.mimetype || 'application/octet-stream',
                        url: fileUrl, // Permanent public S3 URL
                        bucket: req.file.bucket,
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
                    return res.status(409).json({
                        success: true,
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
                    return res.status(409).json({
                        success: true,
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

        // Test endpoint to get presigned URL for a file
        // testGetPresignedUrl: async (req, res) => {
        //     try {
        //         const { fileKey, expiresIn } = req.body;

        //         if (!fileKey) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: "Please provide fileKey in request body",
        //             });
        //         }

        //         const expirationTime = expiresIn || 3600; // Default 1 hour
        //         const presignedUrl = await getPresignedUrl(fileKey, expirationTime);

        //         return res.status(200).json({
        //             success: true,
        //             message: "Presigned URL generated successfully",
        //             data: {
        //                 fileKey: fileKey,
        //                 presignedUrl: presignedUrl,
        //                 expiresIn: expirationTime,
        //                 expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString(),
        //             },
        //         });
        //     } catch (error) {
        //         console.log("Get Presigned URL Error:", error);
        //         logError(error, req);
        //         return res.status(500).json({
        //             success: false,
        //             message: "Failed to generate presigned URL",
        //             error: error.message,
        //         });
        //     }
        // },

        // Test endpoint for S3 CSV/Excel upload using multer middleware
        testCsvUpload: async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Please upload a CSV or Excel file (csv/xlsx/xls)",
                    });
                }

                // Validate that file was properly uploaded
                if (!req.file.key) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed: S3 key is missing",
                    });
                }

                // Construct CloudFront URL
                const cloudfrontUrl = process.env.AWS_URL
                
                // Handle different key formats
                // CSV upload middleware includes bucket name in key: bucket-name/testS3/csv/filename.csv
                // Image upload uses: public/testS3/image/filename.jpg
                let urlPath = req.file.key;
                
                // Remove bucket name prefix if present (bucket name is at the start)
                const bucketName = process.env.AWS_BUCKET_NAME;
                if (bucketName && urlPath.startsWith(`${bucketName}/`)) {
                    urlPath = urlPath.substring(bucketName.length + 1);
                }
                
                // Remove 'public/' prefix if present
                if (urlPath.startsWith('public/')) {
                    urlPath = urlPath.substring(7); // Remove 'public/' (7 characters)
                }
                
                // Ensure CloudFront URL ends with '/' and path doesn't start with '/'
                const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
                const fileUrl = `${baseUrl}${urlPath}`;

                return res.status(200).json({
                    success: true,
                    message: "CSV/Excel file uploaded to S3 successfully",
                    data: {
                        originalName: req.file.originalname || 'unknown',
                        fileName: req.file.key,
                        fileSize: req.file.size || 0,
                        mimeType: req.file.mimetype || 'application/octet-stream',
                        url: fileUrl, // Permanent public S3 URL
                        bucket: req.file.bucket,
                    },
                });
            } catch (error) {
                console.log("S3 CSV Upload Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload CSV/Excel file to S3",
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

        // Temporary API to store logo name and logo URL in site settings table
        storeSiteLogo: async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Please upload an image file (jpeg/png/jpg)",
                    });
                }

                // Validate that file was properly uploaded
                if (!req.file.key) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed: S3 key is missing",
                    });
                }

                // Construct CloudFront URL
                // Files are stored in public/ subfolder, but CloudFront URL should not include 'public/' prefix
                const cloudfrontUrl = process.env.AWS_URL;
                
                // Remove 'public/' prefix from the key for CloudFront URL
                let urlPath = req.file.key;
                if (urlPath.startsWith('public/')) {
                    urlPath = urlPath.substring(7); // Remove 'public/' (7 characters)
                }
                
                // Ensure CloudFront URL ends with '/' and path doesn't start with '/'
                const baseUrl = cloudfrontUrl.endsWith('/') ? cloudfrontUrl : `${cloudfrontUrl}/`;
                const fileUrl = `${baseUrl}${urlPath}`;

                // Use original filename as logo_name, or extract from key
                const logoName = req.file.originalname || req.file.key.split('/').pop() || 'logo';
                const logoUrl = fileUrl;

                // Check if site setting record exists (get first record if any)
                let siteSetting = await SiteSetting.findOne({ order: [['id', 'ASC']] });

                if (siteSetting) {
                    // Update existing record
                    siteSetting.site_logo_name = logoName;
                    siteSetting.site_logo_url = logoUrl;
                    await siteSetting.save();
                } else {
                    // Create new record
                    siteSetting = await SiteSetting.create({
                        site_logo_name: logoName,
                        site_logo_url: logoUrl,
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Logo uploaded and stored successfully",
                    data: siteSetting,
                });
            } catch (error) {
                console.log("Store Site Logo Error:", error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload and store logo",
                    error: error.message,
                });
            }
        },
    };
};

module.exports = testS3Controller;

