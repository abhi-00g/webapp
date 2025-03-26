const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: new AWS.EnvironmentCredentials('AWS'),
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'your-s3-bucket-name';

/**
 * Uploads a file to S3 and returns the public URL
 */
async function uploadFile(file, key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            originalName: file.originalname
        }
    };

    const result = await s3.upload(params).promise();
    return result.Location;
}

/**
 * Deletes a file from S3 using its stored key
 */
async function deleteFile(key) {
    try {
        if (!key) {
            throw new Error('S3 key not provided for deletion');
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log('File deleted from S3:', key);
    } catch (err) {
        console.error('S3 delete error:', err);
        throw err;
    }
}

module.exports = { uploadFile, deleteFile };