const config = require("../../config")
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");

const bucketName = config.AWS_BUCKET_NAME;
const region = config.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const uploadFile = (file) => {
    const filestream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: filestream,
        Key: file.filename
    }


    return s3.upload(uploadParams).promise()
}

module.exports = { uploadFile }