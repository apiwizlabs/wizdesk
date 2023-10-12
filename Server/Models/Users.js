const { Schema, Types } = require("mongoose");

const UserSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      auto: true,
    },
    name: {
      type: String,
      trim: true,
      required: [true, "User name required"],
    },
    email: {
      type: String,
      required: [true, "User Email required"],
      unique: true,
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
    password: {
      type: String,
      trim: true,
    },
    organizationId:  {
        type: Types.ObjectId,
        ref: "organisations",
      },
    assignedOrganisations : [{
      type: Types.ObjectId,
      ref: "organisations"
    }],
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (ph) {
          return (/^\d{7,}$/).test(ph.replace(/[\s()+\-\.]|ext/gi, ''))
        },
        message: "Please Enter a valid phone number",
      },
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    type: {
        type: String,
        required: [true, "User type is required"],
        uppercase: true,
        trim: true,
        enum: [
        "CLIENT USER",
        "SUPPORT USER",
        "ADMIN USER",
        ],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
  }
);

UserSchema.pre('save', function(next){
  if(this.type === "CLIENT USER"){
    if(!this.organizationId ){
      return next(new Error("organisation id needs to be present for clients"))
    }
  }
  next()
})

module.exports = {UserSchema};
