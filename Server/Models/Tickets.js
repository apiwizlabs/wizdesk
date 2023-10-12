const { Schema, Types } = require("mongoose");
const {CommentsSchema} = require("../Models/Comments");
const {AttachmentsSchema} = require("../Models/Attachments");
const {OrganisationSchema} = require("../Models/Organisation");
const {UserSchema} = require("../Models/Users")
const dbConnect = require("../db/db.connect");
const { CounterSchema } = require("./Counter");

const TicketSchema = new Schema(
    {
        _id: {
            type: Types.ObjectId,
            required: true,
            auto: true,
        },
        name: {
            type: String,
            trim: true,
            required: [true, "Task name required"],
        },
        description: {
            type: String,
            trim: true,
            // required: [true, "Task description required"],
        },
        type: {
            type: String,
            required: [true, "Task type is required"],
            uppercase: true,
            trim: true,
            enum: [
            "INCIDENT",
            "TASK",
            "QUERY",
            "BUG",
            "STORY"
            ],
        },
        priority: {
            type: String,
            trim: true,
            uppercase: true,
            required: [true, "Task priority required"],
            enum: ["CRITICAL", "MAJOR", "MINOR", "ENHANCEMENT"],
        },
        status: {
            type: String,
            trim: true,
            uppercase: true,
            required: [true, "Task status required"],
            enum: [
            "READY",
            "IN PROGRESS",
            "USER VALIDATION",
            "DONE",
            ],
        },
        createdBy: {
            type: Types.ObjectId,
            ref: "users"
          },
        // {
        //     type: String,
        //     required: [true, "Ticket Assignee Email required"],
        //     trim: true,
        //     lowercase: true,
            // validate: {
            //   validator: function (email) {
            //     const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            //     return emailRegex.test(email);
            //   },
            //   message: "Ticket Created By email is invalid",
            // },
        assignee: {
                type: Types.ObjectId,
                ref: "users"
              },            
            // type: String,
            // required: [true, "Ticket Assignee Email required"],
            // trim: true,
            // lowercase: true,
            // validate: {
            //   validator: function (email) {
            //     const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            //     return emailRegex.test(email);
            //   },
            //   message: "Ticket Assignee Email is invalid",
            // },
       organization: {
            type: Types.ObjectId,
            ref: "organisations",
            required: [true, "Task Organization required"]
        },
        orgName: {
            type: String,
            required: [true, "Organization name Task required"]
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isImported:{
            type: Boolean,
            default: false,
        },
        attachments: {
            type: [AttachmentsSchema],
            default: [],
        },
        comments: {
            type: [CommentsSchema],
            default: [],
        },
        labels: [{
            type: String
        }],
        shortSeqID:{
            type: String,
            unique: true,
        },
        //linked tixkets 
        parentTickets: [
            {
              type: Types.ObjectId,
              ref: "tickets",
            }
          ],
        childrenTickets : [
            {
              type: Types.ObjectId,
              ref: "tickets",
            }
          ]
    },
    { timestamps: { createdAt: "cts", updatedAt: "mts" } }
);

TicketSchema.index({ shortSeqID: 1 }, { unique: true });



// TicketSchema.pre('save', async function (next){
//     try{
//     let db = await dbConnect();
//     const ticketsModel = db.model("tickets", TicketSchema);
//     const countersModel = db.model("counters", CounterSchema);
//     const orgModel = db.model("organisations", OrganisationSchema);

//     const counterDocument = await countersModel.findByIdAndUpdate(this.organization, {$inc: {counter: 1} }, {upsert: true});
//     console.log("ticket create counter collection ",counterDocument)
//     const orgDocument = await orgModel.findOne({_id: this.organization});
//     this.sortSeqID = `${orgDocument.idPrefix}-${counterDocument.counter + 1}`;

//     // const foundDoc = await ticketsModel.find({organization: this.organization}).sort('-shortSeqID').collation({locale: "en_US", numericOrdering: true}).findOne()
//     let lastId = 0;
//     if(foundDoc && foundDoc.shortSeqID){
//         lastId = parseInt(foundDoc.shortSeqID.split("-")[1]);
//     }
//     const newId = `${ticketOrg.idPrefix}-${lastId + 1}`;
//     this.shortSeqID = newId;
//     next()
//   }catch(error){
//     if (error.code === 11000) {
//         ticket.shortSeqID = generateNewId(ticket.organization); // Implement your ID generation logic here
//         ticket.save();
//       } else {
//         next(error);
//       }
//   }}
//   )


// TicketSchema.pre('insertMany', async function (next, docs){
   
//     const ticketsModel = db.model("tickets", TicketSchema);
//     console.log("count: ", this.count())

//     const orgModel = db.model("organisations", OrganisationSchema);
//     // const orgModel = db.model("organisations", OrganisationSchema);
//     const ticketOrg = await orgModel.findOne({_id: docs[0].organization});
//     const foundDoc = await ticketsModel.find({organization: docs[0].organization}).sort('-shortSeqID').collation({locale: "en_US", numericOrdering: true}).findOne()
//     let lastId = 0;
//     if(foundDoc && foundDoc.shortSeqID){
//         lastId = parseInt(foundDoc.shortSeqID.split("-")[1]);
//     }
//     for(let i = 0; i < docs.length; i++){
//         docs[i].shortSeqID = `${ticketOrg.idPrefix}-${lastId + i + 1}`
//     }

//     // const newId = `${ticketOrg.idPrefix}-${lastId + 1}`;
//     // this.shortSeqID = newId;
//     next()
//   })

// TicketSchema.index({createdAt: 1 }, {expireAfterSeconds: 10});

module.exports = { TicketSchema }

