const express = require("express");
const Router = express.Router();
const testS3Controller = require('../http/Controllers/TestS3Controller');
// const { serverStorageimage } = require("../http/middlewares/awsS3Middleware");

// Test endpoint for S3 image upload (AWS SDK v3 compatible)
// POST /api/testS3/upload-image
// Use multipart/form-data with field name "image"
// Router.post("/upload-image", serverStorageimage.single("image"), testS3Controller().testImageUpload);

// Test endpoint to check S3 connection status
// GET /api/testS3/connection
Router.get("/connection", testS3Controller().testS3Connection);

// Test endpoint to check if file exists in S3
// POST /api/testS3/check-file
// Body: { "filePath": "path/to/file.jpg" }
Router.post("/check-file", testS3Controller().testCheckFileExists);

// Test endpoint to delete file from S3
// POST /api/testS3/delete-file
// Body: { "filePath": "path/to/file.jpg" }
Router.post("/delete-file", testS3Controller().testDeleteFile);

module.exports = Router;

