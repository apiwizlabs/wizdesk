const { Schema, Types } = require("mongoose");

const PendingUserSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      auto: true,
    },
    email: {
      type: String,
      required: [true, "Invitee Email required"],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          return emailRegex.test(email);
        },
        message: "Please Enter a valid email",
      },
    },
    invitedBy : {
      type: String,
      required: [true, "Invited By Email required"],
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
    organizationId: {
        type: Types.ObjectId,
        ref: "organisations",
        required: [true, "Organisation for user required"],
      },
    userSignedUp: {
      type: Boolean,
      required: [true, "sign up status required"]
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
  }
);

module.exports = {PendingUserSchema};
