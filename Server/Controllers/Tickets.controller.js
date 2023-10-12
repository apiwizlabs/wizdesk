const config = require("../config");
const dbConnect = require("../db/db.connect");
const { OrganisationSchema } = require("../Models/Organisation");
const {TicketSchema} = require("../Models/Tickets");
const {UserSchema} = require("../Models/Users");
const {CommentsSchema} = require("../Models/Comments");
const {AttachmentsSchema} = require("../Models/Attachments");
const {CounterSchema} = require("../Models/Counter");
const nodemailer = require('nodemailer');
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { Model } = require("mongoose");
const {getJiraAttachment} = require("./FileManagement/FileDownload");
const fetch = require("node-fetch");
const { Worker, isMainThread } = require('worker_threads');
const logger = require("../utils/logger");
const {failedImportEmail} = require("../Controllers/Email.controller")
const S3 = require("aws-sdk/clients/s3");
const {deleteFiles} = require("../Controllers/FileManagement/FileDelete")

const sendTicketUpdateEmails = async (ticketData, updatedBy, emailRecievers, notificationType = "SOME") => {
  try{
  const transportObject = {
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: false,
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
    }
}

let transporter = nodemailer.createTransport(transportObject)


const ticketLink = config.BASE_URL + 'tickets/' + ticketData.organization + "?ticketId=" + ticketData._id
let ticketContent = "Details belonging to your Ticket"
if (notificationType === "BOTH"){
  ticketContent = "Comments and other details belonging to your Ticket"
}else if(notificationType === "COMM"){
  ticketContent = "Comments belonging to your Ticket"
}else if(notificationType === "SOME"){
  ticketContent = "Details belonging to your Ticket"
}

  const emailVariables = {
    ticketLink: ticketLink,
    orgName: ticketData.orgName ,
    ticketChanger: updatedBy.split("@")[0],
    ticketContent: ticketContent,
    ticketName: ticketData.name
  }

  ejs.renderFile("emailTemplate/updateNotification.ejs", emailVariables, async function (err, data){
    if(err){
        logger.info(err)
    }else{
        const emailMessage = {
            from: config.MAIL_FROM,
            to: emailRecievers,
            subject: `Ticket Updated: ${ticketData.name}`,
            text: "Please Click on the button to go to the ticket",
            html: data,
        }

        return transporter.sendMail(emailMessage);        
    }
})}catch(err){
  logger.error(err)
}
}

const sendAssigneeChangedEmails = async (ticketData, updatedBy, emailReceivers, oldAssignee, newAssignee) => {
  try{
  const transportObject = {
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: false,
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
    }
}

let transporter = nodemailer.createTransport(transportObject);
const ticketLink = config.BASE_URL + 'tickets/' + ticketData.organization + "?ticketId=" + ticketData._id
let ticketContent = `The Assignee has changed from ${oldAssignee} to ${newAssignee}`;
const emailVariables = {
  ticketLink: ticketLink,
  orgName: ticketData.orgName ,
  ticketChanger: updatedBy.split("@")[0],
  ticketContent: ticketContent,
  ticketName: ticketData.name
}
ejs.renderFile("emailTemplate/updateNotification.ejs", emailVariables, async function (err, data){
  if(err){
      logger.info(err)
  }else{
      const emailMessage = {
          from: config.MAIL_FROM,
          to: emailReceivers,
          subject: `Assignee Changed: ${ticketData.name}`,
          text: "Please Click on the button to go to the ticket",
          html: data,
      }

      return transporter.sendMail(emailMessage);        
  }
})}catch(err){
  logger.error(err)
}
}


const importedTicketsEmail = async(ticketOrg, ticketsLength, importer, skippedAttachments) => {
  try{
    logger.info("in in success imort email sender")
  let emailReceivers = [];
  ticketOrg.supportUsers.map(user => emailReceivers.push(user.email))
  ticketOrg.clientUsers.map(user => emailReceivers.push(user.email))
  if(!emailReceivers.includes(importer.email)) emailReceivers.push(importer.email)
  const transportObject = {
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: false,
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
    }
}

const emailVariables = {
  ticketsCount: ticketsLength,
  importerName: importer.name,
  orgName: ticketOrg.name,
  orgLink: config.BASE_URL + "tickets/" + ticketOrg._id,
  skippedAttachments: skippedAttachments.join(" ,")
}



let transporter = nodemailer.createTransport(transportObject)

return new Promise((resolve, reject) => {
  ejs.renderFile(
    "emailTemplate/importedTicketNotification.ejs",
    emailVariables,
    (err, data) => {
      if (err) {
        logger.info(err);
        reject(err); 
      } else {
        const emailMessage = {
          from: config.MAIL_FROM,
          to: emailReceivers,
          subject: `Tickets Have Been Imported to ${ticketOrg.name}`,
          text: "Please Click on the button to go to the tickets",
          html: data,
        };

        transporter.sendMail(emailMessage, (error, info) => {
          if (error) {
            logger.info(error);
            reject(error); 
          } else {
            resolve(info); 
          }
        });
      }
    }
  );
});

}catch(err){
  logger.error(err)
}

}

const sendTicketEmails = async (ticketData, ticketOwner, ticketAssignee, ticketOrg) => {
  try{
  let emailReceivers = [];
  let slaEmailNotification = null;
  let emailVariables = {};
  let slaEmailVariables = {};
  const ticketLink = config.BASE_URL + "tickets/" + ticketOrg._id + "?ticketId=" + ticketData._id


  if(ticketOwner.type === "ADMIN USER" || ticketOwner.type === "SUPPORT USER"){
    emailVariables = {ticketLink: ticketLink, orgName: "APIwiz", ticketCreator: ticketOwner.name, ticketName: ticketData.name }
    ticketOrg.clientUsers.map(user => (!user.isLocked && !user.isDeleted) && emailReceivers.push(user.email));
    ticketOrg.supportUsers.map(user => (!user.isLocked && !user.isDeleted) && emailReceivers.push(user.email));
    ticketOrg.supportUsers.map(user => (!user.isLocked && !user.isDeleted) && console.log("VALID USER :: ",user.email, user.isDeleted, user.isLocked));
    emailReceivers = emailReceivers.filter(user => user !== ticketOwner.email)
    console.log("created ticket emaill::: ",emailReceivers, emailVariables);
  }else if(ticketOwner.type === "CLIENT USER"){
    emailVariables = {ticketLink: ticketLink, orgName: ticketOrg.name, ticketCreator: ticketOwner.name, ticketName: ticketData.name }
    ticketOrg.supportUsers.map(user =>(!user.isLocked && !user.isDeleted) && emailReceivers.push(user.email))
    console.log(emailReceivers, "EMAIL RECEIVERS")
    slaEmailNotification = ticketOwner.email
    slaEmailVariables = {ticketLink: ticketLink, shortId: ticketData.shortSeqID}
  }
  else{
    return Promise.reject()
  }

  if(emailReceivers.length > 0){
    const transportObject = {
      host: config.MAIL_HOST,
      port: config.MAIL_PORT,
      secure: false,
      auth: {
          user: config.MAIL_USER,
          pass: config.MAIL_PASSWORD
      }
  }



  let transporter = nodemailer.createTransport(transportObject)

  if(ticketOwner.type === "CLIENT USER"){
     const slaEmailResp = async () => { ejs.renderFile("emailTemplate/slaTicketNotification.ejs", slaEmailVariables, async function (err, data){
      if(err){
          logger.info(err)
      }else{
          const emailMessage = {
              from: config.MAIL_FROM,
              to: [slaEmailNotification],
              subject: `We have received your ticket: ${ticketData.name}`,
              text: "Please Click on the button to go to the ticket",
              html: data,
          }

         return await transporter.sendMail(emailMessage);        
      }
  })}


  return slaEmailResp().then(()=>{
    ejs.renderFile("emailTemplate/ticketNotification.ejs", emailVariables, async function (err, data){
      if(err){
          logger.info(err)
      }else{
          const emailMessage = {
              from: config.MAIL_FROM,
              to: [emailReceivers],
              subject: `Ticket has been Raised; Priority: ${ticketData.priority}`,
              text: "Please Click on the button to go to the ticket",
              html: data,
          }

          return transporter.sendMail(emailMessage);        
      }
  })
  })
  
  }

  if(ticketOwner.type !== "CLIENT USER"){

  ejs.renderFile("emailTemplate/ticketNotification.ejs", emailVariables, async function (err, data){
      if(err){
          logger.info(err)
      }else{
          const emailMessage = {
              from: config.MAIL_FROM,
              to: [emailReceivers],
              subject: `Ticket has been Raised by Apiwiz for ${ticketOrg.name}; Priority: ${ticketData.priority}`,
              text: "Please Click on the button to go to the ticket",
              html: data,
          }

          return transporter.sendMail(emailMessage)
          .then((res)=>logger.info("ticket create email: ",res))
          .catch(err => logger.error("error while sending create ticket email: ",err));        
      }
  }) }

  }else{
    return Promise.resolve();
  }
}catch(err){
  logger.error(err)
}
}

const getAllTickets = async (req, res) => {
  try{
    let db = await dbConnect();
    if (!db) {
      res.status(400).json({
        message: "DB client not found",
      });
      return;
    }

    const ticketsModel = db.model("tickets", TicketSchema);
    const usersModel = db.model("users", UserSchema);
    const orgModel = db.model("organisations", OrganisationSchema);
    const ticketsData = await ticketsModel.find({})
    .populate({path: "createdBy", model: usersModel, select: "email"})
    .populate({path: "assignee", model: usersModel, select: "email"})
    .populate({path: "organization", model: orgModel, select: "name"})
    return res.status(200).json({
      success: true,
      data: ticketsData,
    });


  }catch (err) {
    logger.info(err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errorMessage: err.message,
  });
}
}

const getUserDisplayName = async (jiraDetails, accountId, res) => {

  try{
    const {domainUrl, apiKey, jiraEmail} = jiraDetails
    const fetchUrl = `${domainUrl}/rest/api/2/user?accountId=${accountId}` 
    const authHeader = `${jiraEmail}:${apiKey}`
    logger.info(
      'in paraaa'
    );

    return fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          authHeader
        ).toString('base64')}`,
        'Accept': 'application/json',
        'family': 4,
      }
    })
    .then(response => {
      logger.info(
        `Response: ${response.status} ${response.statusText} ${accountId}`
      );
      if(response.status === 404 || response.status === 401 || response.status === 403){
        throw new Error("Please Check your JIRA credentials.")
      }
      return response.text();
    })
    .then(text => {
     const displayName = JSON.parse(text).displayName
      return {name: displayName, success: true}
    })
    .catch(err => {
      logger.info(err)
      return {success: false}
    });
    }catch(err){
      logger.info(err)
      return {success: false}
    }

}

const importMultipleTickets = async (req, res) => {
  try{
    let db = await dbConnect();
    if (!db) {
      res.status(400).json({
        message: "DB client not found",
      });
      return;
    }

    const {orgId}= req.params;
    const {clientUser, supportUser, isAttachmentRequired, jiraUserData, rowsList} = req.body;
    const token = req.headers.authorization.split(" ")[1];
    const importerEmail = jwt.decode(token).email
    const orgModel = db.model("organisations", OrganisationSchema);
    const usersModel = db.model("users", UserSchema);
    const foundClientUser = await usersModel.findOne({email: clientUser});
    const foundSupportUser = await usersModel.findOne({email: supportUser});
    const foundOrganisation = await orgModel.findOne({_id: orgId});
    const importerUser = await usersModel.findOne({email: importerEmail })

    if(!rowsList.length > 0){
      return res.status(400).json({
        success: false,
        message: "No data found in uploaded file",
      });
    }else if(rowsList.length > 150){
      return res.status(400).json({
        success: false,
        message: "Cannot import more than 150 tickets at a time.",
      });
    }
    if(isAttachmentRequired){
      if(!(jiraUserData?.domainUrl && jiraUserData?.apiKey && jiraUserData?.jiraEmail)){
        return res.status(400).json({
          success: false,
          message: "Missing Jira credentials for importing",
        });
      }
    }
    if( foundOrganisation?.name && !foundSupportUser?.isLocked && !foundSupportUser?.isDeleted && !foundClientUser?.isLocked && !foundClientUser?.isDeleted && !importerUser?.isLocked && !importerUser.isDeleted ){
      if(isMainThread){
        res.status(200).json({
          success: true,
          message: "Importing Tickets ...",
        });
        console.log(foundSupportUser._id, "SUPP ID", foundClientUser._id )
        logger.info("Import Tickets rowslist looks like::: ",rowsList)
        for(let i = 0; i < rowsList.length; i++){
          if(rowsList[i].Summary.includes("Portal")){
            logger.info("TICKET LOGGER BFR:: ", JSON.stringify(rowsList[i]));
          }
        }
        logger.info("Import Tickets rowslist looks like 123::: ",JSON.stringify(rowsList))

        const worker = new Worker('./Controllers/worker.js', 
        {workerData: 
          { rowsList,
             isAttachmentRequired, 
             jiraUserData,
             foundClientId: foundClientUser._id.toString(), 
             foundClientEmail: clientUser, 
             foundSupportId: foundSupportUser._id.toString(),  
             foundSupportEmail: supportUser, 
             orgId, 
             importerEmail  }})

        
        worker.on('message', async (result) => {
          logger.info(JSON.stringify(result), "WORKER MESSAGE");

          if(result?.success){
            logger.info("Successfully imported tickets");
            worker.terminate();
            return;
          }else{
            logger.info(JSON.stringify(result), "Import tickets has failed");
            try{
              await failedImportEmail({orgName: foundOrganisation.name, importerEmail, isAttachmentRequired});
              logger.info("successfully sent failed import email notification")
            }catch(err){
              logger.info("Failed to send failed import email notification")              
            }
            worker.terminate();
            return;
          }
        });
        
        worker.on('error', async (error) => {
          logger.info(error, "ERRORRR")
          const {emailSuccess} = await failedImportEmail({orgName: foundOrganisation.name, importerEmail, isAttachmentRequired});
          if(emailSuccess){
            logger.info("successfully sent failed import email notification")
          }else{
            logger.info("Failed to send failed import email notification")              
          }
          worker.terminate()
        });
      }
       
    }else{
      return res.status(400).json({
        success: false,
        message: "You need atleast one valid client and support user",
      });
    }

  } catch (err) {
    logger.info(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}

const createMultipleTickets = async ({orgId, ticketsList, importerEmail, skippedAttachments}) => {
  try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }

      const orgModel = db.model("organisations", OrganisationSchema);
      const usersModel = db.model("users", UserSchema);
      const counterModel = db.model("counters", CounterSchema);
      const counterDocument = await counterModel.findOneAndUpdate({orgId: orgId}, {$inc: {counter: ticketsList.length} }, {new: true});
      const startCounter = counterDocument.counter - ticketsList.length + 1;

      const ticketOrganisation = await orgModel.findOne({_id: orgId}).populate({ path: "supportUsers", usersModel }).populate({ path: "clientUsers", usersModel })
      const currentUser = await usersModel.findOne({email: importerEmail})


      const ticketsModel = db.model("tickets", TicketSchema);
      const ModeledTicketsList = ticketsList.map((ticket, i) => new ticketsModel({...ticket, organization: orgId, orgName: ticketOrganisation.name, shortSeqID: `${ticketOrganisation.idPrefix}-${i + startCounter}`}))
      await ticketsModel.insertMany(ModeledTicketsList);
      await orgModel.findByIdAndUpdate(orgId, { $push: { tickets: {$each: ModeledTicketsList}  }})
      await importedTicketsEmail(ticketOrganisation, ticketsList.length, currentUser, skippedAttachments)
      return {success: true};  

  } catch (err) {
    logger.info(err);
    return {success: false}
  }

}



const createNewTicket = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const token = req.headers.authorization.split(" ")[1];
        const {email} = jwt.decode(token)



        const {name, createdBy, assignee, description, status, priority, type, comments, attachments, linkedTickets, labels } = req.body;
        console.log("hi i cross", assignee, createdBy);
        //do formatting in clientside:todo
        const labelsArray = labels.map(label => label.value);
        const {orgId} = req.params
        const orgModel = db.model("organisations", OrganisationSchema);
        const userModel = db.model("users", UserSchema);
        const ticketCreator = await userModel.findOne({email: email});
        const ticketAssignee = await userModel.findOne({email: assignee});
        const isOrgPresent = await orgModel.findOne({_id: orgId}).populate({path: "clientUsers", model: userModel, select: "email isLocked isDeleted"}).populate({path: "supportUsers", model: userModel, select: "email isLocked isDeleted"});

        console.log(ticketCreator, ticketAssignee, "CREATOR N ASSIGNE");

        if (!(isOrgPresent && ticketAssignee && !ticketAssignee.isLocked && !ticketAssignee.isDeleted && ticketCreator)) {
          return res.status(401).json({
            success: false,
            message: "Invalid Ticket Details Provided",
          });
        }

        let ticketToAdd = null;
        const countersModel = db.model("counters", CounterSchema);
        const counterDocument = await countersModel.findOneAndUpdate({orgId: orgId}, {$inc: {counter: 1} }, {new: true});
        const seqId = `${isOrgPresent.idPrefix}-${counterDocument.counter}`;
        const TicketModel = db.model("tickets", TicketSchema);

        let _newTicket = { name, createdBy: ticketCreator._id, assignee: ticketAssignee._id, description, status, priority, type, attachments, organization: orgId, orgName: isOrgPresent.name, labels: labelsArray, shortSeqID: seqId  };
        console.log(_newTicket, "TICKET TO ADD 121")

        if(comments.length > 0 || linkedTickets.length > 0){
          let commentsObj  = (comments||[]).map(comment => ({text: comment.text, createdBy: createdBy, attachments: comment.attachments}))
          let linkedTicketsIdList = (linkedTickets||[]).map(link => link.value)
          _newTicket.comments = commentsObj;
          _newTicket.childrenTickets = linkedTicketsIdList;
          // ticketToAdd = new TicketModel({ name, createdBy, assignee, description, status, priority, type, attachments, comments: commentsObj, organization: orgId, orgName: isOrgPresent.name, childrenTickets: linkedTicketsIdList, labels: labelsArray, shortSeqID: seqId })
        }

        ticketToAdd = new TicketModel(_newTicket);
        console.log(ticketToAdd, "TICKET TO ADD")
        const savedTicketData = await ticketToAdd.save();
        logger.info("New Ticket Create - Success Log");

        //deployment build comment
        try{
        await sendTicketEmails(savedTicketData, ticketCreator, ticketAssignee, isOrgPresent);}
        catch(err){
          console.log(err, "ERROR");
          logger.info("Email Sending Error in ticket creation ::: ",err)
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            // errorMessage: err.message,
          });
        }

        
        isOrgPresent.tickets.push(savedTicketData._id);
        await isOrgPresent.save();
        return res.status(200).json({
          success: true,
          message: "Ticket successfully created",
        });
      
    }catch (err) {
      console.log(err)
      logger.info(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getTicketById = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const {ticketId} = req.params
        const ticketsModel = db.model("tickets", TicketSchema);
        const userModel = db.model("users", UserSchema);
        const ticketExists =  await ticketsModel.exists({_id: ticketId});
        if(ticketExists){
          const ticketData = await ticketsModel.findOne({_id: ticketId}).populate({path: "childrenTickets", ticketsModel }).populate({path: "assignee", model: userModel, select: "email isLocked isDeleted"}).populate({path: "createdBy", model: userModel, select: "email isLocked isDeleted"})
          return res.status(200).json({
              success: true,
              data: ticketData,
            });
        }else{
          return res.status(404).json({
            success: false,
            errorMessage: "Ticket Not Found"
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

  const getFilteredTickets = async (req, res) => {
    try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const typeValues = [
        "TASK",
        "INCIDENT",
        "BUG",
        "STORY",
        "QUERY"
      ] 
      const statusValues = [
        "READY",
        "IN PROGRESS",
        "USER VALIDATION",
        "DONE",
        ]
      const priorityValues = ["CRITICAL", "MAJOR", "MINOR", "ENHANCEMENT"]

      
      const {orgId} = req.params;
      const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";
      let typeFilter = req.query.type !== 'undefined' ? req.query.type.split(",") : typeValues;
      let statusFilter = req.query.status !== 'undefined' ? req.query.status.split(",") : statusValues;
      let priorityFilter = req.query.priority !== 'undefined' ? req.query.priority.split(",") : priorityValues;
      let assigneeFilter = req.query.assignee !== 'undefined' ? req.query.assignee.split(",") : [] ;

      const usersModel = db.model("users", UserSchema);
      const ticketsModel = db.model("tickets", TicketSchema);
      const orgModel = db.model("organisations", OrganisationSchema);

      let filterQuery = {organization: orgId, 
        $or: [
        {name: {$regex: search, $options: "i"}},
        {shortSeqID: {$regex: new RegExp(search), $options: "i"}}
      ]}
      let ticketsData  = []

      if(assigneeFilter.length > 0){
        ticketsData = await ticketsModel.find(filterQuery)
        .where("type").in([...typeFilter])
        .where("priority").in([...priorityFilter])
        .where("status").in([...statusFilter])
        .where("assignee").in([...assigneeFilter])
        .populate({path: "createdBy", model: usersModel, select: "email"})
        .populate({path: "assignee", model: usersModel, select: "email"})
        .populate({path: "organization", model: orgModel, select: "name"})
        console.log(ticketsData, "tickeetss daata")


      }else{
       ticketsData = await ticketsModel.find(filterQuery)
      .where("type").in([...typeFilter])
      .where("priority").in([...priorityFilter])
      .where("status").in([...statusFilter])
      .populate({path: "createdBy", model: usersModel, select: "email"})
      .populate({path: "assignee", model: usersModel, select: "email"})
      .populate({path: "organization", model: orgModel, select: "name"})
      console.log(ticketsData, "tickeetss daata")
      }

      const response = {
        success: true,
        ticketsData
      }

      return res.status(200).json(response);

      // ticketsModel.find({ organization: orgId }, async (err, data) => {
      //   if (err) {
      //     return res.status(500).json({
      //       success: false,
      //       message: "Error in fetching tickets",
      //       errorMessage: err.message,
      //     });
      //   } else if(data) {

      //      return res.status(200).json({
      //       success: true,
      //       data: data,
      //     });

      //   }
      // });

  }catch (err) {
      logger.info(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
  }


  function getDifference(array1, array2) {
    if(array1 && array2){
      return array1.filter(object1 => {
        return !array2.some(object2 => {
          return object1.text === object2.text;
        });
      });
    }
  }


  const updateTicketById = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const {ticketId} = req.params;
        const ticketBody = req.body;
        const ticketsModel = db.model("tickets", TicketSchema);
        const usersModel = db.model("users", UserSchema);
        const token = req.headers.authorization.split(" ")[1];
        let assigneeUser = null;

        // if(typeof ticketBody.assignee === "object"){
        //   if(ticketBody.assignee.isDeleted || ticketBody.assignee.isLocked){
        //     return res.status(400).json({
        //       success: false,
        //       message: "Invalid Assignee",
        //     });
        //   }
        // }else{
        //   assigneeUser = usersModel.findOne({email: ticketBody.assignee})
        //   if(assigneeUser.isLocked || assigneeUser.isDeleted){
        //     return res.status(400).json({
        //       success: false,
        //       message: "Invalid Assignee",
        //     });
        //   }
        // }

        if(typeof ticketBody.assignee !== "object"){
              assigneeUser = await usersModel.findOne({email: ticketBody.assignee})
        }


        const {email} = jwt.decode(token);
        const foundTicket = await ticketsModel.findOne({_id: ticketId}).populate({path: "assignee", model: usersModel, select: "email isDeleted isLocked"});

        if(foundTicket.createdBy != ticketBody.createdBy._id){
          return res.status(400).json({
            success: false,
            message: "Cannot change ticket owner",
          });
        }
  
        const commDifference = [
          ...getDifference(foundTicket.comments, ticketBody.comments),
          ...getDifference(ticketBody.comments, foundTicket.comments)
        ];

        const childrenTicketList = ticketBody.linkedTickets.map(ticket => ticket.value)
        const labelsArray = ticketBody.labels.map(label => label.value)

        console.log(typeof ticketBody.assignee , "BODDDYYY")

        const hasChanged = foundTicket.status !==  ticketBody.status || foundTicket.name !==  ticketBody.name || foundTicket.type !==  ticketBody.type || foundTicket.priority !==  ticketBody.priority
        let hasAssigneeChanged = assigneeUser ? foundTicket.assignee._id != assigneeUser._id : foundTicket.assignee._id != ticketBody.assignee._id;
        const updatedAssigneeId = assigneeUser ? assigneeUser._id : ticketBody.assignee._id;
        console.log(assigneeUser, "updated assignee id");

        console.log(hasAssigneeChanged, hasChanged , updatedAssigneeId, "CHLA CHALY")

        ticketsModel.findByIdAndUpdate(ticketId, {...ticketBody, description: ticketBody.description.text, childrenTickets: childrenTicketList, labels: labelsArray, assignee: updatedAssigneeId}, {new: true, runValidators: true}, (err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error in updating ticket",
              errorMessage: err.message,
            });
          } else if(data) {
            const some = "SOME";
            const both = "BOTH";
            const comm = "COMM";

            let notificationType = some;
            let hasOtherChanges = false;
            if( hasChanged && commDifference.length > 0){
              hasOtherChanges = true;
             notificationType = both;
            }
            else if( hasChanged && !commDifference.length > 0){
              hasOtherChanges = true;
              notificationType = some;
            }
            else if(commDifference.length > 0 && !hasChanged){
              hasOtherChanges = true;
              notificationType = comm; 
            }else if(hasAssigneeChanged){
              hasAssigneeChanged = true; //dummy but needed
            }
            else{
              return res.status(200).send();
            }

            let emailRecievers = [];
            if(assigneeUser && !assigneeUser.isLocked && !assigneeUser.isDeleted){
                emailRecievers.push(assigneeUser.email)
            }else if(ticketBody.assignee && !ticketBody.assignee.isLocked && !ticketBody.assignee.isDeleted){
              emailRecievers.push(ticketBody.assignee.email)
            }
            if(ticketBody.createdBy && !ticketBody.createdBy.isLocked && !ticketBody.createdBy.isDeleted){
              emailRecievers.push(ticketBody.createdBy.email)
            }
            
            if(hasAssigneeChanged){
              let emailRecievers = []
              if(foundTicket.assignee.email && !foundTicket.assignee.isLocked && !foundTicket.assignee.isDeleted){ emailRecievers.push(foundTicket.assignee.email) }
              if(assigneeUser && !assigneeUser.isLocked && !assigneeUser.isDeleted ){ emailRecievers.push(assigneeUser.email)}
              if(!assigneeUser && !ticketBody.assignee.isLocked && !ticketBody.assignee.isDeleted){ emailRecievers.push(ticketBody.assignee.email)} 
              if(!ticketBody.createdBy.isLocked && !ticketBody.createdBy.isDeleted){  emailRecievers.push(ticketBody.createdBy.email) }
              console.log("email for assignee change receivers::: ",emailRecievers);
              let newEmail = assigneeUser ? assigneeUser.email : ticketBody.assignee.email;

              //uncomment later
              sendAssigneeChangedEmails(data, email, emailRecievers, foundTicket.assignee.email, newEmail )
            }
            if(emailRecievers.length > 0 && hasOtherChanges){
              console.log("email for has other changes receivers::: ",emailRecievers);

              //uncomment later
              sendTicketUpdateEmails(data, email, emailRecievers, notificationType).then(()=>{
                return res.status(200).send();
              }).catch((err)=> res.status(400).json({
                success: false,
                message: "Error in sending ticket update notification",
                errorMessage: err.message,
            }))
            }else{
              return res.status(200).send();
            }
      }
      })
    }catch (err) {
        logger.info(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteTicketById = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const {ticketId, orgId} = req.params
        const ticketsModel = db.model("tickets", TicketSchema);
        const orgModel = db.model("organisations", OrganisationSchema);

        await orgModel.findByIdAndUpdate(orgId, {$pull: {tickets: ticketId}}, {new: true, runValidators: true});
       const deletedTicket = await ticketsModel.findOneAndRemove({ _id: ticketId });
        let deletedFileKeys = [];
        if(deletedTicket.attachments.length > 0){
          let descAttachments = deletedTicket.attachments.reduce((acc,curr)=>{
            return [...acc ,curr.fileKey]
          },[])
          // console.log("Attachment File KEy::: ",trial)
          deletedFileKeys.push(...descAttachments)
        }
        const commentsLength = deletedTicket.comments.length
        if( commentsLength > 0){
          for(let i = 0; i < commentsLength ; i++){
            if(deletedTicket.comments[i].attachments.length <= 0) { continue; }
            let commentAttachments = deletedTicket.comments[i].attachments.reduce((acc,curr)=>{
              return [...acc ,curr.fileKey]
            },[])
            if(commentAttachments.length > 0) deletedFileKeys.push(...commentAttachments)
          }
        }
        if(deletedFileKeys.length > 0){
          const awsDeleteObj = deletedFileKeys.reduce((acc, curr)=>{
            return [...acc, {Key: curr}]
          },[])

        await deleteFiles(awsDeleteObj)
        }
       
      return res.status(200).send();

    }catch (err) {
        logger.info(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteCommentById = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const {commentId} = req.params
        const commentsModel = db.model("comments", CommentsSchema);

        commentsModel.deleteOne({ _id: commentId }, async (err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error in deleting comment",
              errorMessage: err.message,
            });
          } else if(data) {
            return res.status(200).send();
          }
        });
    }catch (err) {
        logger.info(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteAttachmentById = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const {attachmentId} = req.params
        const attachmentsModel = db.model("attachments", AttachmentsSchema);

        attachmentsModel.deleteOne({ _id: attachmentId }, async (err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error in deleting attachment",
              errorMessage: err.message,
            });
          } else if(data) {
            return res.status(200).send();
          }
        });
    }catch (err) {
        logger.info(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getTicketsByOrgId = async (req, res) => {
    try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const typeValues = [
        "TASK",
        "INCIDENT",
        "BUG",
        "STORY",
        "QUERY"
      ] 
      const statusValues = [
        "READY",
        "IN PROGRESS",
        "USER VALIDATION",
        "DONE",
        ]
      const priorityValues = ["CRITICAL", "MAJOR", "MINOR", "ENHANCEMENT"]

      
      const {orgId} = req.params;
      const userModel = db.model("users", UserSchema);
      const page = parseInt(req.query.page) -1 || 0;
      const limit = parseInt(req.query.limit) || 5;
      const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";
      let typeFilter = req.query.type && req.query.type !== 'undefined' ? req.query.type.split(",") : typeValues;
      let statusFilter = req.query.status && req.query.status !== 'undefined' ? req.query.status.split(",") : statusValues;
      let priorityFilter = req.query.priority && req.query.priority !== 'undefined' ? req.query.priority.split(",") : priorityValues;
      let assigneeFilter = req.query.assignee && req.query.assignee !== 'undefined' ? req.query.assignee.split(",") : [];

     
      const ticketsModel = db.model("tickets", TicketSchema);
      let filterQuery = {organization: orgId, 
        $or: [
        {name: {$regex: search, $options: "i"}},
        {shortSeqID: {$regex: search, $options: "i"}}
      ]}
      let ticketsData  = [];

      if(assigneeFilter.length > 0){
        ticketsData = await ticketsModel.find(filterQuery)
        .where("type").in([...typeFilter])
        .where("priority").in([...priorityFilter])
        .where("status").in([...statusFilter])
        .where("assignee").in([...assigneeFilter])
        .sort('-cts')
        .skip(page * limit).limit(limit)
        .populate({path: "createdBy", model: userModel, select: "name email isLocked isDeleted"})
        .populate({path: "assignee", model: userModel, select: "name email isLocked isDeleted"});
 
      }else{
       ticketsData = await ticketsModel.find(filterQuery)
      .where("type").in([...typeFilter])
      .where("priority").in([...priorityFilter])
      .where("status").in([...statusFilter])
      .sort('-cts')
      .skip(page * limit).limit(limit)
      .populate({path: "createdBy", model: userModel, select: "name email isLocked isDeleted"})
      .populate({path: "assignee", model: userModel, select: "name email isLocked isDeleted"});
      }

      const total = assigneeFilter.length > 0 ? await ticketsModel.countDocuments({
        organization: orgId,
        type: {$in: [...typeFilter]},
        priority: {$in: [...priorityFilter]},
        status: {$in: [...statusFilter]},
        assignee: {$in: [...assigneeFilter]},
        name: {$regex: search, $options: "i"},

      }) : await ticketsModel.countDocuments({
        organization: orgId,
        type: {$in: [...typeFilter]},
        priority: {$in: [...priorityFilter]},
        status: {$in: [...statusFilter]},
        name: {$regex: search, $options: "i"}
      });
console.log("bro pls",ticketsData);
console.log("akka pls",total)

      const response = {
        success: true,
        total,
        page: page + 1,
        limit,
        types: typeFilter,
        ticketsData
      }
      // ticketsData = await ticketsModel.find(filterQuery)
      console.log("TICKETS DATATAT :::: ", response)

      return res.status(200).json(response);

      // ticketsModel.find({ organization: orgId }, async (err, data) => {
      //   if (err) {
      //     return res.status(500).json({
      //       success: false,
      //       message: "Error in fetching tickets",
      //       errorMessage: err.message,
      //     });
      //   } else if(data) {

      //      return res.status(200).json({
      //       success: true,
      //       data: data,
      //     });

      //   }
      // });

  }catch (err) {
      logger.info(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
  }
  

  module.exports = { createNewTicket, getFilteredTickets, getTicketsByOrgId, getUserDisplayName, importMultipleTickets, createMultipleTickets, getTicketById, updateTicketById, deleteTicketById, deleteCommentById, getAllTickets, deleteAttachmentById };
