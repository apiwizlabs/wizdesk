const { Schema, Types } = require("mongoose");
const {AttachmentsSchema} = require("../Models/Attachments");

const OrganisationSchema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true,
    auto: true,
  },
  name: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Organisation name required"],
  },
  workspaceName: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Organisation work space name required"],
  },
  website: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Organisation Website Link required"],
    validate: {
      validator: function (website) {
        const websiteLinkRegex = /^(http:\/\/|https:\/\/)?(www\.)?[a-zA-Z0-9]+\.[a-zA-Z]{2,}([a-zA-Z0-9\/#]+)?$/;
        return websiteLinkRegex.test(website);
      },
      message: "Please Enter a valid email",
    },
  },
   plan: {
    type: String,
    required: [true, "Organisation plan is required"],
    uppercase: true,
    trim: true,
    enum: [
    "GROWTH",
    "ENTERPRISE",
    ],
  },
   emailDomains: {
    type: [String],
    validate:{
      validator:  (v) => {
        const domainRegex = /^([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;
        if(Array.isArray(v) && v.length > 0){
          const listOfDomainV = v.map(item => domainRegex.test(item))
          if(listOfDomainV.includes(false)) return false
          return true;
        }else{return false}
      },
    },
},
  logoImage: {
      type: AttachmentsSchema,
  },
  supportUsers: {
    type: [{
        type: Types.ObjectId,
        ref: "users",
    }],
    validate: v => Array.isArray(v) && v.length > 0,

  },
  idPrefix:{
    type: String,
    unique: true,
    required: true,
  },
  tickets: [
    {
      type: Types.ObjectId,
      ref: "tickets",
    }
  ],
  clientUsers: [
    {
      type: Types.ObjectId,
      ref: "users"
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },

},  {
  timestamps: { createdAt: "cts", updatedAt: "mts" },
});

module.exports = { OrganisationSchema }
