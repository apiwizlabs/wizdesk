const { Schema, Types } = require("mongoose");

const AttachmentsSchema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true,
    auto: true,
  },
  fileKey: {
    type: String,
    trim: true,
    required: [true, "attachment file key required"]
  },
  fileUrl: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: String,
    trim: true,
  },
});

module.exports = { AttachmentsSchema }
