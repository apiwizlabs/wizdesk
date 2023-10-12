const config = require("../config");
const dbConnect = require("../db/db.connect");
const {ViewSchema} = require("../Models/Views");
const {UserSchema} = require("../Models/Users");
const jwt = require("jsonwebtoken");


const createViewController = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const token = req.headers.authorization.split(" ")[1];
        const {email} = jwt.decode(token)
        const {priority, type, viewName, status, assignee, globalView} = req.body;
        const {orgId} = req.params
        const viewModel = db.model("views", ViewSchema);
        const userModel = db.model("users", UserSchema);
        const creatorUser = await userModel.findOne({email: email});
        let viewType = ""
        if(globalView){
          if(creatorUser.type === "CLIENT USER"){
            viewType = "EXTERNAL"
          }else{
            viewType = "INTERNAL"
          }
        }
        const ViewToAdd = new viewModel({priority, type, viewName, status, assignee, createdBy: email, globalView, viewType , organization: orgId})
        ViewToAdd.save((err, data) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error in creating view",
                    errorMessage: err.message,
                });
                }
                if (data) {
                return res.status(200).json({
                    success: true,
                    data: ViewToAdd,
                });
                } })
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }
  
const deleteViewController = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const token = req.headers.authorization.split(" ")[1];
        const {email} = jwt.decode(token)
        const {viewID} = req.params;
        const viewModel = db.model("views", ViewSchema);
        viewModel.deleteOne({ _id: viewID, createdBy: email }, async (err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error in deleting custom view",
              errorMessage: err.message,
            });
          } else if(data) {
            return res.status(200).send();
          }
        });
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getAllViewsController = async (req, res) => {
    try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const token = req.headers.authorization.split(" ")[1];
      const {orgId} = req.params
      // logger.info(orgId, "get vww org id")
      const {email} = jwt.decode(token)
      const usersModel = db.model("users", UserSchema);
      const viewModel = db.model("views", ViewSchema);
      const viewsData = await viewModel.find({$or:[ {'createdBy':email}, {'organization': orgId}]}).populate({path: "assignee", model: usersModel, select: "email"});
      return res.status(200).json({
        success: true,
        data: viewsData,
      });
    }catch (err) {
      logger.info(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
  }

  module.exports = { createViewController, getAllViewsController, deleteViewController };
