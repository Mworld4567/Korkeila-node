const multer = require("multer");
const fs = require("fs");
const { S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const colors = require('colors');
const csvFilter = (req, file, cb) => {
  console.log(file.mimetype);
  if (
    file.mimetype.includes("text/csv") ||
    file.mimetype.includes("xlsx") ||
    file.mimetype.includes("application/vnd.ms-excel")
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Please upload only csv file."));
  }
};

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("image/jpeg") ||
    file.mimetype.includes("image/png") ||
    file.mimetype.includes("image/jpg")
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Please upload only jpeg/png/jpg file."));
  }
};

const sitesettingFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("image/jpeg") ||
    file.mimetype.includes("image/png") ||
    file.mimetype.includes("image/jpg") ||
    file.mimetype.includes("image/svg")
  ) {
    cb(null, true);
  } else {
    const error = new Error("Please upload only jpeg/png/jpg/svg file.");
    error.status = 400;
    cb(error, false);
  }
};

// for server upload
if (!fs.existsSync(__basedir + "/public/uploads")) {
  fs.mkdirSync(__basedir + "/public/uploads", {
    recursive: true,
  });
}
let serverStorage = multer.diskStorage({
  fileFilter: imageFilter,
  destination: (req, file, cb) => {
    cb(null, __basedir + "/public/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    if (req.locals) {
      cb(null, req.locals.image_file);
    } else {
      cb(null, file.originalname);
    }
  },
});
const S3CONFIG = {
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
  region: process.env.AWS_REGION || 'eu-north-1',
};
// for aws s3 upload
const s3 = new S3Client(S3CONFIG);
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

let uploadInS3File = multer({
  fileFilter: csvFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      // Handle undefined originalname
      const originalName = file.originalname || `file_${Date.now()}.csv`;
      // Handle undefined baseUrl segment
      const baseUrlParts = req.baseUrl ? req.baseUrl.split("/") : [];
      const routeName = baseUrlParts[2] || "testS3";
      
      // Store files in public/ subfolder: public/{routeName}/csv/{filename}
      const s3Key = `${routeName}/csv/${originalName}`;
      console.log("S3 Key:", s3Key);
      cb(null, s3Key);
    }
  }),
});
let uploadInS3FileDownload = multer({
  fileFilter: csvFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/design/csv/${file.originalname}`
      );
      cb(
        null,
        `${BUCKET_NAME}/design/csv/${file.originalname}`
      );
    },
  }),
});

let uploadInS3FileForAll = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
      console.log(file, "awsS3Middleware");
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/csv/${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/csv/${
          file.originalname
        }`
      );
    },
  }),
});

let uploadInS3FileVideo = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
      console.log(file, "awsS3Middleware");
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
    },
  }),
});
let uploadSiteSettingInS3Image = multer({
  fileFilter: sitesettingFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
    },
  }),
});

let uploadInS3Image = multer({
  fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      // Handle undefined originalname
      const originalName = file.originalname || `file_${Date.now()}`;
      // Handle undefined baseUrl segment
      const baseUrlParts = req.baseUrl ? req.baseUrl.split("/") : [];
      const routeName = baseUrlParts[2] || "testS3";
      
      // Store files in public/ subfolder: public/{routeName}/image/{filename}
      const s3Key = `public/${routeName}/image/${originalName}`;
      console.log("S3 Key:", s3Key);
      cb(null, s3Key);
    },
  }),
});

let uploadInS3ImageZip = multer({
  fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentEncoding: "gzip",
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/image/${
          file.originalname
        }`
      );
    },
  }),
});

// let serverStorageimage = multer({
//     storage: multer.diskStorage({
//         fileFilter: imageFilter,
//         destination: (req, file, cb) => {
//             cb(null, __basedir + "/public/uploads/");
//         },
//         filename: (req, file, cb) => {
//             console.log(file.originalname);
//             if (req.locals) {
//                 cb(null, req.locals.image_file);
//             } else {
//                 cb(null, file.originalname);
//             }
//         },
//     })

// });
let serverStorageimage = multer({
  storage: multer.diskStorage({
    fileFilter: imageFilter,
    destination: (req, file, cb) => {
      cb(null, __basedir + "/public/uploads/");
    },
    filename: (req, file, cb) => {
      // const originalName = file.originalname;
      const lastDotIndex = file.originalname.lastIndexOf('.');
      const namePart = file.originalname.substring(0, lastDotIndex);
      const extension1 = file.originalname.substring(lastDotIndex + 1);
      const modifiedName = namePart.replace(/\./g, '_') + '.' + extension1;
      const parts = modifiedName.split(".");
      const extension = parts[1].toLowerCase();
      const currentDate = new Date();
      const concatenatedNumber = `${currentDate.getDate().toString().padStart(2, '0')}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getFullYear()}${currentDate.getHours().toString().padStart(2, '0')}${currentDate.getMinutes().toString().padStart(2, '0')}${currentDate.getSeconds().toString().padStart(2, '0')}`;
      const image_file_name = parts[0] + "." + extension;
      console.log(colors.green("\n ImageNameInAWS=>") + colors.magenta(image_file_name), "\n")
      if (req.locals) {
        cb(null, req.locals.image_file);
      } else {
        cb(null, image_file_name);
      }
    },
  }),
});

let uploadInS3VoiceFile = multer({
  // fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/voice-comment/${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/voice-comment/${
          file.originalname
        }`
      );
    },
  }),
});

let uploadInS3Document = multer({
  // fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      const lastDotIndex = file.originalname.lastIndexOf(".");
      const namePart = file.originalname.substring(0, lastDotIndex);
      const extension1 = file.originalname.substring(lastDotIndex + 1);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const modifiedName = namePart.replace(/\./g, "_") + "_" + timestamp + "." + extension1;
      const parts = modifiedName.split(".");
      const extension = parts[1].toLowerCase();
      const image_file_name = parts[0] + "." + extension;
      file.originalname = image_file_name;
      console.log(colors.green("\n ImageNameInAWS=>") + colors.magenta(image_file_name), "\n");
      cb(
        null,
        `${BUCKET_NAME}/${req.baseUrl.split("/")[2]}/document/${
          image_file_name
        }`
      );
    },
  }),
});
let uploadSalesPurchaseDocsInS3 = multer({
  // fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      cb(
        null,
        `${BUCKET_NAME}/${
          req.baseUrl.split("/")[2]
        }/document/${Date.now()}${Math.round(Math.random() * 1e3)}_${
          file.originalname
        }`
      );
    },
  }),
});

let uploadCamDocsInS3 = multer({
  // fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${
          req.baseUrl.split("/")[2]
        }/stl/${Date.now()}${Math.round(Math.random() * 1e3)}_${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${
          req.baseUrl.split("/")[2]
        }/stl/${Date.now()}${Math.round(Math.random() * 1e3)}_${
          file.originalname
        }`
      );
    },
  }),
});

let uploadReferenceImagesInS3 = multer({
  fileFilter: imageFilter,
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      console.log(
        `${BUCKET_NAME}/${
          req.baseUrl.split("/")[2]
        }/image/${Date.now()}${Math.round(Math.random() * 1e3)}_${
          file.originalname
        }`
      );
      cb(
        null,
        `${BUCKET_NAME}/${
          req.baseUrl.split("/")[2]
        }/image/${Date.now()}${Math.round(Math.random() * 1e3)}_${
          file.originalname
        }`
      );
    },
  }),
});

// Multer middleware for design files - accepts any file type, multiple files
let uploadDesignFilesInS3 = multer({
  // No fileFilter - accepts any file type
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (req, file, cb) => {
      // Handle undefined originalname
      const originalName = file.originalname || `file_${Date.now()}`;
      // Handle undefined baseUrl segment
      const baseUrlParts = req.baseUrl ? req.baseUrl.split("/") : [];
      const routeName = baseUrlParts[2] || "design";
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e3);
      const uniqueFileName = `${timestamp}${random}_${originalName}`;
      
      // Store files in public/ subfolder: public/{routeName}/image/{filename}
      const s3Key = `public/${routeName}/image/${uniqueFileName}`;
      console.log("Design File S3 Key:", s3Key);
      cb(null, s3Key);
    },
  }),
});

/**
 * To delete a file from path
 * ex. https://vkjdev.s3.ap-south-1.amazonaws.com/vkjdev/newsandupdates/image/xyz.jpg
 * @param {string} file file name with path ex: /newsandupdates/image/xyz.jpg
 * @returns {Promise<boolean>}
 */
let deleteFromBucket = async (file) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: [BUCKET_NAME, file].join("/"),
    };
    const command = new DeleteObjectCommand(params);
    const data = await s3.send(command);
    console.log(
      "************this is 'deleteFromBucket fn'**********\n",
      "Key:",
      params.Key,
      "data:",
      data
    );
    return true;
  } catch (err) {
    throw err;
  }
};
/**
 * To delete multiple files by key
 * ref:https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property
 * @param {Array} KeyArray
 * @returns {Promise<boolean>}
 */
let deleteMultipleFromBucket = async (KeyArray) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: KeyArray /*[
                    {
                        Key: "HappyFace.jpg",
                        // VersionId: "2LWg7lQLnY41.maGB5Z6SWW.dcq0vx7b"
                    },
                    {
                        Key: "HappyFace.jpg",
                        // VersionId: "yoz3HB.ZhCS_tKVEmIOr7qYyyAaZSKVd"
                    }
                ],*/,
        Quiet: false,
      },
    };
    const command = new DeleteObjectsCommand(params);
    const data = await s3.send(command);
    /*
            data = {
             Deleted: [
                {
               Key: "HappyFace.jpg", 
               VersionId: "yoz3HB.ZhCS_tKVEmIOr7qYyyAaZSKVd"
              }, 
                {
               Key: "HappyFace.jpg", 
               VersionId: "2LWg7lQLnY41.maGB5Z6SWW.dcq0vx7b"
              }
             ]
            }
            */
    return true;
  } catch (err) {
    throw err;
  }
};
/**
 * To get file object from s3
 * @param {string} file
 * @returns
 */
let getS3Object = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key, // ✅ ONLY key
  };
  return await s3.send(new GetObjectCommand(params));
};


/**
 * To upload a file to s3 bucket
 * @param {string} file file name
 * @param {string} folder path
 * @returns {Promise<boolean}
 */
let saveToBucket = async (file) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${BUCKET_NAME}/${file.path}`,
      Body: file.data,
      ContentType: file.type,
      // ACL removed - bucket has "Block Public ACLs" enabled
      // File will be accessible via presigned URL
    };
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    return true;
  } catch (err) {
    throw err;
  }
};
/**
 * To check file exists from s3
 * @param {string} file
 * @returns
 */
let checkFileExists = async (file) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${BUCKET_NAME}/${file}`,
    };
    const command = new HeadObjectCommand(params);
    await s3.send(command);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Generate a presigned URL for accessing an S3 object
 * @param {string} key - The S3 key (path) of the object
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
let getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn });
    return url;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  uploadInS3Document,
  uploadSalesPurchaseDocsInS3,
  uploadInS3Image,
  uploadInS3File,
  uploadInS3VoiceFile,
  uploadInS3FileDownload,
  uploadCamDocsInS3,
  uploadReferenceImagesInS3,
  uploadDesignFilesInS3,
  deleteFromBucket,
  deleteMultipleFromBucket,
  getS3Object,
  saveToBucket,
  checkFileExists,
  getPresignedUrl,
  sitesettingFilter,
  uploadSiteSettingInS3Image,
  serverStorage,
  uploadInS3ImageZip,
  serverStorageimage,
  uploadInS3FileForAll,
  uploadInS3FileVideo,
};
