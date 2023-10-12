const { isArray } = require("util");
const config = require("../config");
const dbConnect = require("../db/db.connect");
const { OrganisationSchema } = require("../Models/Organisation");
const { TicketSchema } = require("../Models/Tickets");
const {UserSchema} = require("../Models/Users");
const {CounterSchema} = require("../Models/Counter");
const {PendingUserSchema} = require("../Models/PendingUsers");
const { Types } = require("mongoose");

const addOrganisationController = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const domainRegex = /^([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;
        const {name, website, plan, supportUsers, workspaceName, emailDomains, logoImage, idPrefix} = req.body;
        if(supportUsers.length > 0){
        const formattedSupportUsers = supportUsers.reduce((acc, curr)=>{
            return [...acc, {_id: curr.value}]
        },[])
        const supportUserIdList = supportUsers.reduce((acc, curr)=>{
            return [...acc, curr.value]
        },[])
        const usersModel = db.model("users", UserSchema);
        const counterModel = db.model("counters", CounterSchema);
     
        let validEmailDomainList;
        if(Array.isArray(emailDomains) && emailDomains.length > 0){
          validEmailDomainList = emailDomains.filter(domain => domainRegex.test(domain))
        }else{
          return res.status(401).json({
            success: false,
            message: "Atleast one valid email domain name is required",
            errorMessage: err.message,
          });
        }

        const orgListModel = db.model("organisations", OrganisationSchema);
        let newOrgData;
        if(logoImage?.fileKey?.key){
          newOrgData = { name, website, workspaceName, plan, idPrefix, supportUsers: formattedSupportUsers, emailDomains : validEmailDomainList, logoImage: { fileKey : logoImage.fileKey.key, fileUrl: logoImage.fileKey.url} }
        }else{
          newOrgData = { name, website, workspaceName, plan, idPrefix ,supportUsers: formattedSupportUsers, emailDomains : validEmailDomainList }
        }
        const OrgToAdd = new orgListModel(newOrgData);
       

       const savedOrganisation = await OrgToAdd.save();
       await usersModel.updateMany({_id: {$in: supportUserIdList }}, {$push:{ "assignedOrganisations" : savedOrganisation._id}});
       const counterToAdd = new counterModel({
          orgId: savedOrganisation._id,
        })
       await counterToAdd.save();

       return res.status(200).json({
        success: true,
        message: "Organisation successfully created",
      });

      }else{
        return res.status(401).json({
          success: false,
          message: "Organisation requires atleast one support user",
        });
      }
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const deleteOrganisation = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const orgId = req.params.orgId;
        const orgModel = db.model("organisations", OrganisationSchema);
        const invitesModel = db.model("invited-users", PendingUserSchema);
        const ticketModel = db.model("tickets", TicketSchema);
        const userModel = db.model("users", UserSchema);
   
        await ticketModel.deleteMany({organization: orgId});
        await userModel.deleteMany({organizationId: orgId, type: "CLIENT USER" });
        await invitesModel.deleteMany({organizationId: orgId});
        // const currentOrganisationSupportUsers = currentOrganisation.supportUsers.map(item => item.toString())
        await userModel.updateMany({assignedOrganisation: Types.ObjectId(orgId)}, {$pull:{ "assignedOrganisations" : orgId}})
        orgModel.deleteOne({ _id: orgId }, async (err, data) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Error in deleting organisation",
                errorMessage: err.message,
              });
            } else if(data) {
              return res.status(200).send();
            }
          });
       
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const updateOrganisation = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const orgId = req.params.orgId;
        const newOrgContent = req.body;
        const orgModel = db.model("organisations", OrganisationSchema);
        let newSupportUsersId = [];
        const formattedSupportUsers = newOrgContent.supportUsers.reduce((acc, curr)=>{
          newSupportUsersId.push(curr.value)
            return [...acc, {_id: curr.value}]
        },[])

        const usersModel = db.model("users", UserSchema);
       const currentOrganisation = await orgModel.findOne({_id: orgId})
       const currentOrganisationSupportUsers = currentOrganisation.supportUsers.map(item => item.toString())
       await usersModel.updateMany({_id: {$in: currentOrganisationSupportUsers }}, {$pull:{ "assignedOrganisations" : orgId}})
       await usersModel.updateMany({_id: {$in: newSupportUsersId }}, {$push:{ "assignedOrganisations" : orgId}})
       
        newOrgContent.supportUsers = formattedSupportUsers
        newOrgContent.supportUsers = formattedSupportUsers;
        if(newOrgContent?.logoImage?.fileKey?.key){
          newOrgContent.logoImage.fileKey = newOrgContent.logoImage.fileKey.key;
          newOrgContent.logoImage.fileUrl = newOrgContent.logoImage.fileKey.url;
        }

        orgModel.findByIdAndUpdate(orgId, newOrgContent, {new: true, runValidators: true}, (err, data) => {
            if (err) {
              return res.status(401).json({
                success: false,
                message: "Enter Valid Oranisation Details",
                errorMessage: err.message,
              });
            } else if(data) {
              return res.status(200).send();
            }
          });
       
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const getAllOrganisations = async(req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const orgListModel = db.model("organisations", OrganisationSchema);
        const userModel = db.model("users", UserSchema);
        const orgList = await orgListModel.find({}).populate({ path: "supportUsers", userModel });
        return res.status(200).json({
            success: true,
            data: orgList,
          });

    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const getOrganisationById = async(req, res) => {
   try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const { orgId } = req.params;
        
        const orgModel = db.model("organisations", OrganisationSchema);
        const ticketsModel = db.model("tickets", TicketSchema);
        const userModel = db.model("users", UserSchema)
        const orgPresent = await orgModel.exists({_id: orgId})
        if(orgPresent){
          // const orgData = await orgModel.findOne({_id: orgId})
          // .populate({ path: "tickets", model: ticketsModel })
          // .populate({path: "supportUsers", model: userModel })
          // .populate({path: "clientUsers", model: userModel })
          const orgData = await orgModel.findOne({_id: orgId})
          .populate({path: "supportUsers", model: userModel })
          .populate({path: "clientUsers", model: userModel })
          return res.status(200).json({
              success: true,
              data: orgData,
            });
        }else{
          return res.status(404).json({
            success: false,
            errorMessage: "Org Not Found"
          });
        }
       
    }catch (err) {
        logger.info(err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
    }
  }

  module.exports = { addOrganisationController, getAllOrganisations, deleteOrganisation, updateOrganisation, getOrganisationById };
