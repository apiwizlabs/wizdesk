const mongoose = require("mongoose");
const config = require("../config.js")
let db = null
const DBURL = config.DB_URL;

const connectToDatabase = async () => {
return new Promise((resolve, reject) => {
  if(db)
  {
    resolve(db);
    return db;
  }
  else {
    try {
        mongoose.connect(DBURL, 
            {useNewUrlParser: true}, 
            function (err, _db) {
                if(err){
                    reject(err);
                    logger.error("Database Connection Refused")
                    return err;
                  }
            
                  db = _db
                  logger.info("APIwiz Database connected")
                  resolve(_db);
                  return _db
            }
        );
    }
    catch(err) {
      logger.info(err)
      return err;
    }
  }
})
};

module.exports = connectToDatabase;
