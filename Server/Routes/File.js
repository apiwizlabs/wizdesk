const express = require("express");
const {uploadFile} = require("../Controllers/FileManagement/FileUpload");
const {deleteFile, deleteFiles} = require("../Controllers/FileManagement/FileDelete");
const fs = require("fs");
const util = require("util");
const dbConnect = require("../db/db.connect");
const {userExists} = require("../middlewares/userTypeCheck")
const unlinkFile = util.promisify(fs.unlink);
const {multi_upload, upload} = require("../common")
const {downloadImage, getJiraAttachment} = require("../Controllers/FileManagement/FileDownload")
const {TicketSchema} = require("../Models/Tickets");
const router = express.Router();
const logger = require("../utils/logger");

router
  .route("/delete-ticket-attachment/:ticketId")
  .post(userExists, async (req, res) => {
    try{

      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }

      const {ticketId} = req.params
      const {fileKey, fileId} = req.body

      const ticketModel = db.model("tickets", TicketSchema);
      console.log(ticketId, "Ticket IDDD")
      await ticketModel.findOneAndUpdate({_id: ticketId}, {$pull:{ "attachments" : {_id: fileId}}})
      const result = await deleteFile(fileKey);
      console.log(result, ":::: AWS DELETE RESULT")
      return res.status(200).send();

    }catch(err){
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  })
router
  .route("/delete-comment-attachment/:ticketId/:commentId")
  .post(userExists, async (req, res) => {
    try{

      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }

      const {commentId, ticketId} = req.params;
      const {fileKey, fileId} = req.body;

      const ticketModel = db.model("tickets", TicketSchema);
      console.log(ticketId, "Ticket IDDD");
      const r = await ticketModel.findOneAndUpdate({_id: ticketId, 'comments._id': commentId}, {$pull:{ "comments.$.attachments" : {_id: fileId}}});
      console.log(r, "RESP FROM DEL COMM ATT")
      const result = await deleteFile(fileKey);
      console.log(result, ":::: AWS DELETE RESULT")
      return res.status(200).send();

    }catch(err){
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  })
router
  .route("/delete-comment/:ticketId/:commentId")
  .post(userExists, async (req, res) => {
    try{

      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }

      const {ticketId, commentId} = req.params
      const {files} = req.body
   
      const ticketModel = db.model("tickets", TicketSchema);
      console.log(ticketId, "Ticket IDDD");
      await ticketModel.findOneAndUpdate({_id: ticketId}, {$pull: { "comments" : {_id: commentId}}});
      if(files.length > 0){
        const formattedFiles = files.reduce((acc, curr)=>{
          return [...acc, {Key: curr.fileKey}]
        },[]) 
        const result = await deleteFiles(formattedFiles);

      }
      return res.status(200).send();

    }catch(err){
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  })

router
  .route("/upload/multiple")
  .post(userExists, multi_upload.array('file', 3), async (req, res) => {
    try {
        logger.info("Files have been validated");
        const allFiles = req.files;
        const promises = allFiles.map(async (file) => {
            const result = await uploadFile(file);
            await unlinkFile(file.path);
            return result
        })
        const allResults = await Promise.all(promises)
        const uploadedData = allResults.map((result, i) => ({url: result.location, key: result.Key, size: allFiles[i].size.toString()}))
      res.send({
        success: true,
        message: "Files uploaded successfully",
        data: uploadedData,
      });
    } catch (err) {
      logger.info("Files have been validated", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  })

router
  .route("/upload/single")
  .post(userExists, upload.single("file"), async (req, res) => {
    try {

      const result = await uploadFile(req.file);

      // Deleting from local if uploaded in S3 bucket
      await unlinkFile(req.file.path);

      res.send({
        success: true,
        message: "File uploaded successfully",
        data: {
            url: result.Location,
            key: result.Key
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  })

router.route("/jira/:fileName/:fileId").get(getJiraAttachment)

router.route("/view/:fileKey").get(userExists, downloadImage)

module.exports = router;
