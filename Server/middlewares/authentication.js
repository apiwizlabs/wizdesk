
const jwt = require("jsonwebtoken");
const { UserSchema } = require("../Models/Users");
const config = require("../config");
const dbConnect = require("../db/db.connect");


const isAuthenticated = async (req, res, next) => {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET, function (err, decoded){
        if(err){
          logger.info(err)
        }
      });
  
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const usersListModel = db.model("users", UserSchema)
      const isUserExists = await usersListModel.findOne({ email: decoded.email });
      if ((isUserExists && !isUserExists.isLocked && !isUserExists.isDeleted ) || (isUserExists && isUserExists.type=== "ADMIN USER")) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Error in authenticating"
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
  
  module.exports = {isAuthenticated}