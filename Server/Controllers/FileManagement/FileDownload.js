const AWS = require("aws-sdk");
const fs = require("fs");
const config = require("../../config");
const path = require("path");
const fetch = require("node-fetch");
const { Blob } = require("buffer");
const stream = require('stream');

const bucketName = config.AWS_BUCKET_NAME;
const region = config.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const downloadImage = async (req, res) => {
  try {
    const fileKey = req.params.fileKey;
    const filePath = path.join(fileKey);

    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName,
    };


    return s3.getObject(downloadParams, (err, data) => {
      if (err) console.error(err);
      fs.writeFileSync(filePath, data.Body);

     return res.download(filePath, function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error in downloading file"
          })
        } else {
          fs.unlink(filePath, function (err) {
              if (err) {
                  console.error(err);
                  return res.status(500).json({
                    success: false,
                    message: "Error in downloading file"
                  })
              }
          });
        }
      })
    });
    
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
};

const decryptText = (password) => {
  const jsDecrypt = new JSEncrypt();
  jsDecrypt.setPrivateKey(process.env.PRIVATE_KEY);
  return jsDecrypt.decrypt(password);
};

const s3UploadPromise = (params) => {
  let _options = {partSize: 40 * 1024 * 1024, queueSize: 1}
  let _upload = s3.upload(params, _options)
  
  _upload.on('httpUploadProgress', (progress) => {
    logger.info(`progress of ${params.Key} :`, JSON.stringify(progress))
  })
  return _upload.promise();
}

const getJiraAttachment = async ({fileName, fileId, apiKey, jiraEmail, domainUrl}) => {
  const filePath = path.join(fileName);
  const fetchUrl = `${domainUrl}/rest/api/3/attachment/content/${fileId}` 
  // 'https://underwatergluglug.atlassian.net/rest/api/3/attachment/content/10001'
  // 'shivanipothirajan@gmail.com:ATATT3xFfGF0Falq8dQiixACuulwLchkAC8uoknUZkToZrbp-JleFN78Ql4KUSVkZ7RkT6VnXWn1aF2Jb03-Rmx_HtL0ouHo8-O5cAfCarIFaLRwJg8YJm46XS-3y7H4rI_5PUg2ftswD7xG0myjf3nL0iGUF-spuApfbt_mN0jVVJcTjS-3oFQ=F8F598C4'
const authHeader = `${jiraEmail}:${apiKey}`



return fetch(fetchUrl, {
  method: 'GET',
  headers: {
      'Authorization': `Basic ${Buffer.from(authHeader).toString('base64')}`,
      'Accept': 'application/json',
  },
})
  .then(response => {
      logger.info(`Response ATTACHMENTS: ${response.status} ${response.statusText}`);
      
      if (response.status === 404 || response.status === 403) {
          throw new Error("Please check your JIRA credentials.");
      }
      //52428800 - larger than 50 mb
      const contentLength = Number(response.headers.get('content-length'));
      logger.info("CONTENT LENGTH: ", contentLength)
      if(contentLength <= 52428800){
        return response.body;
      }
      else{
        debugger;
        logger.info("debuggerrr")
        throw new Error("Attachment is greater than 50MB");
      }

  })
  .then((pass) => {
      const uploadParams = {
          Bucket: bucketName,
          Body: pass, 
          Key: fileName,
      };
      return s3UploadPromise(uploadParams)
     
  })
  .then(uploadedRes => {
      logger.info("uploaded res:::: ", uploadedRes);
      return { success: true, data: uploadedRes };
  })
  .catch(err => {
      logger.info("An error occurred", JSON.stringify(err));
      if(err.message === "Attachment is greater than 50MB"){
        return {success: false, attachmentError: true, fileName: fileName, fileId: fileId}
      }
      return { success: false };
  });
}

module.exports = { downloadImage, getJiraAttachment };
