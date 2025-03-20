const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: new AWS.EnvironmentCredentials('AWS'),
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'your-s3-bucket-name';

async function uploadFile(file) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // S3 URL
}

async function deleteFile(s3_url) {
    const key = s3_url.split(`/${BUCKET_NAME}/`)[1];
    if (!key) {
        throw new Error('Invalid S3 URL format.');
    }
    const params = { Bucket: BUCKET_NAME, Key: decodeURIComponent(key) };
    await s3.deleteObject(params).promise();
}

module.exports = { uploadFile, deleteFile };