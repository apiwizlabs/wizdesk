const { Schema, Types } = require("mongoose");
const {AttachmentsSchema} = require("../Models/Attachments");

const CommentsSchema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true,
    auto: true,
  },
  text: {
    type: String,
    trim: true,
    required: [true, "Comment message required"],
  },
  attachments:{
    type: [AttachmentsSchema],
    default: [],
  },
  createdBy: {
    type: String,
    required: [true, "Comment creator Email required"],
    trim: true,
    validate: {
      validator: function (email) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
      },
      message: "Please Enter a valid email",
    },
  },
  cts: {
    default: Date.now,
    type: Date,
    immutable: true,
  }
});

module.exports = { CommentsSchema }
