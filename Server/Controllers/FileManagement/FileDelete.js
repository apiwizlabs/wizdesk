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

const deleteFile = (fileKey) => {

    const deleteParams = {
        Bucket: bucketName,
        Key: fileKey,
    }

     return s3.deleteObject(deleteParams).promise()
}

const deleteFiles = (fileKeys) => {

  const params = {
    Bucket: bucketName,
    Delete: {
        Objects: fileKeys,
        Quiet: true
    }
};

console.log("AWS PARAMSS :::",JSON.stringify(params));


  return s3.deleteObjects(params).promise();

}

module.exports = { deleteFile, deleteFiles }