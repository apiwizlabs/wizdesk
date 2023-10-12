const { Schema, Types } = require("mongoose");

const ViewSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      auto: true,
    },
    viewName: {
      type: String,
      trim: true,
      required: [true, "View name required"],
    },
    priority: { type: Array },
    type: { type: Array },
    status:  { type: Array },
    assignee: [{
      type: Types.ObjectId,
      ref: "users"
    }],
    globalView: {type: Boolean},
    organization: {type: String},
    viewType: {
      type: String,
      enum: [
      "INTERNAL",
      "EXTERNAL", ""]
    },
    createdBy: {
        type: String,
        required: [true, "View Creator Email required"],
        trim: true,
        lowercase: true,
        validate: {
          validator: function (email) {
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return emailRegex.test(email);
          },
          message: "Please Enter a valid email",
        },
      },
  }
);

ViewSchema.pre('save', function(next){
  if(this.priority.length > 0 || this.type.length > 0 || this.status.length > 0 || this.assignee.length > 0){
    return next()
  }else{
    return next(new Error("Need to contain filters"))
  }
})

module.exports = {ViewSchema};
