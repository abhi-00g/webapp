// const AWS = require('aws-sdk');
// require('dotenv').config();

// const s3 = new AWS.S3({
//     region: process.env.AWS_REGION || 'us-east-1',
//     credentials: new AWS.EnvironmentCredentials('AWS'),
// });

// const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'your-s3-bucket-name';
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { File } = require("../config/database");
require("dotenv").config();

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1"
    // IAM Role will be used automatically
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;


/**
 * Update File Metadata API: `/v1/files/:id`
 */
async function updateFile(req, res) {
    try {
        console.log("Updating file metadata...");
        const { id } = req.params;
        const { fileName } = req.body;

        // Check if file exists
        const file = await File.findByPk(id);
        if (!file) {
            console.error(`File not found: ${id}`);
            return res.status(404).json({ message: "File not found." });
        }

        // Update metadata
        try {
            file.fileName = fileName || file.fileName; // Allow only metadata updates
            await file.save();
            console.log(`File metadata updated successfully: ${id}`);

            return res.status(200).json({
                id: file.id,
                file_name: file.fileName,
                url: file.fileUrl,
                upload_date: file.uploadDate
            });

        } catch (dbError) {
            console.error("Database update error:", dbError);
            return res.status(422).json({ message: "Database error while updating file metadata." });
        }

    } catch (error) {
        console.error("Unexpected error updating file:", error);
        return res.status(520).json({ message: "Unknown error occurred." });
    }
}

/**
 * Delete File API: `/v1/files/:id`
 */
async function deleteFile(s3Url) {
    try {
        if (!s3Url) {
            throw new Error("Invalid S3 URL");
        }

        console.log("Deleting file from S3:", s3Url);
        let key;
        try {
            if (s3Url.includes('.s3.amazonaws.com/')) {
                key = s3Url.split('.s3.amazonaws.com/')[1]; 
            } else {
                const url = new URL(s3Url);
                key = decodeURIComponent(url.pathname.substring(1));
            }

            console.log("Extracted S3 Key:", key);

            if (!key) {
                throw new Error("Failed to extract a valid key from S3 URL.");
            }
        } catch (urlError) {
            console.error("Error extracting S3 key:", urlError);
            throw new Error("Invalid S3 URL format.");
        }

        // Delete from S3
        const params = { Bucket: BUCKET_NAME, Key: key };

        try {
            await s3.send(new DeleteObjectCommand(params));
            console.log("File deleted successfully from S3.");
        } catch (s3Error) {
            console.error("S3 delete error:", s3Error);
            throw new Error("S3 service unavailable.");
        }
    } catch (error) {
        console.error("Unexpected error deleting file:", error);
        throw error;
    }
}
// async function deleteFile(req, res) {
//     try {
//         const file = await File.findByPk(req.params.id);

//         if (!file) {
//             return res.status(404).json({ message: "File not found." });
//         }

//         // Delete from S3
//         const params = {
//             Bucket: BUCKET_NAME,
//             Key: file.id
//         };

//         try {
//             await s3.send(new DeleteObjectCommand(params));
//         } catch (s3Error) {
//             console.error("S3 delete error:", s3Error);
//             return res.status(503).json({ message: "S3 service unavailable, please try again later." });
//         }

//         // Delete from database
//         try {
//             await file.destroy();
//         } catch (dbError) {
//             console.error("Database delete error:", dbError);
//             return res.status(422).json({ message: "Error deleting file from database." });
//         }

//         return res.status(204).send();

//     } catch (error) {
//         console.error("Unexpected error deleting file:", error);
//         return res.status(520).json({ message: "Unknown error occurred." });
//     }
// }


module.exports = { updateFile, deleteFile };

























































































































































































































































































































































































































































































































































































































































































































































































































































