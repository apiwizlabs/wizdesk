
const jwt = require("jsonwebtoken");
const { UserSchema } = require("../Models/Users");
const { OrganisationSchema } = require("../Models/Organisation");
const config = require("../config");
const dbConnect = require("../db/db.connect");


const isAdminUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const usersListModel = db.model("users", UserSchema)
      const isUserExists = await usersListModel.findOne({ email: decoded.email });
      if(isUserExists.type === "ADMIN USER"){
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };


const isSupportOrAdminUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const usersListModel = db.model("users", UserSchema)
      const isUserExists = await usersListModel.findOne({ email: decoded.email });
      if(isUserExists?.type === "ADMIN USER" || (isUserExists?.type === "SUPPORT USER" && !isUserExists.isLocked && !isUserExists.isDeleted)){
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin or a support"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };

  const verifyClient = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const usersListModel = db.model("users", UserSchema)
      const isUserExists = await usersListModel.findOne({ email: decoded.email });
      if(isUserExists?.type === "ADMIN USER" || (isUserExists?.type === "SUPPORT USER" && !isUserExists.isLocked && !isUserExists.isDeleted)){
        return next()
      }else if(isUserExists?.type === "CLIENT USER" && !isUserExists.isLocked ){
        const orgId = req.params.orgId;
        if(decoded.orgId === orgId){
          return next()
        }else{
          const ticketId = req.params.ticketId;

          const orgModel = db.model("organisations", OrganisationSchema)
          const org = await orgModel.findOne({ _id: decoded.orgId, tickets: { $in: ticketId } });

          if(org.name){
             return next()
          }else{
            return res.status(403).json({
              success: false,
              message: "Client Unauthorised Access"
            })
          }   
        }
      }else{
        return res.status(403).json({
          success: false,
          message: "Client Unauthorised Access"
        })
      }   
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };


  const userExists = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const usersListModel = db.model("users", UserSchema)
      const isUserExists = await usersListModel.findOne({ email: decoded.email });
      if(isUserExists?.type === "ADMIN USER" || (!isUserExists.isLocked && !isUserExists.isDeleted && (isUserExists?.type === "SUPPORT USER" || isUserExists?.type === "CLIENT USER" ))){
        return next()
      }else{
        return res.status(403).json({
          success: false,
          message: "Unauthorised Access"
        })
      }   
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  }


  module.exports = {isAdminUser, isSupportOrAdminUser, verifyClient, userExists}