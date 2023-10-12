const multer = require("multer");
var fs = require("fs");
const path = require('path');

var dir = "./public/images";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}


const fileStorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, dir)
  },
  filename: function (req, file, cb) {
          cb(null, Date.now() + "-" + file.originalname)
  }
});

const multi_upload = multer({
    storage: fileStorageEngine,
    limits: { fileSize: 50 * 1000 * 1000, files: 3 } 
    //fileSize is a limit to each files size.
    //files limits the number of files that can be sent in one go.
  })

const upload = multer({ 
  storage: fileStorageEngine,   
  fileFilter: function (req, file, callback) {
  var ext = path.extname(file.originalname);
  if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== 'svg') {
      return callback(new Error('Only images are allowed'))
  }
  callback(null, true)
}, });
    
// module.exports = upload;
module.exports = {multi_upload, upload};