const config = require("../config");
const dbConnect = require("../db/db.connect");
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const { PendingUserSchema } = require("../Models/PendingUsers");
const {UserSchema} = require("../Models/Users");
const {OrganisationSchema} = require("../Models/Organisation");
const ejs = require("ejs");

const sendEmail = ({inviteEmail, token}) => {
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
    const inviteLink = config.BASE_URL+ 'signup/' + token
    let transporter = nodemailer.createTransport(transportObject)

    return new Promise((resolve, reject) => {
      ejs.renderFile(
        "emailTemplate/inviteEmail.ejs",
        {inviteUserLink: inviteLink},
        (err, data) => {
          if (err) {
            logger.info(err);
            reject(err); 
          } else {
            const emailMessage = {
              from: config.MAIL_FROM,
              to: [inviteEmail],
              subject: "Invitation To Sign Up for Wizdesk ",
              text: "Hello! Please Click on the button to sign up for the app",
              html: data,
          }
    
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

const disableInvite = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }3

        const {inviteId} = req.params;
        const pendingUserModel = db.model("invited-users", PendingUserSchema);

        await pendingUserModel.findOneAndUpdate({_id: inviteId}, {enabled: false});
        return res.status(200).json({
            success: true,
          });
        
    }catch (err) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
    }
}

const enableInvite = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const {inviteId} = req.params;
        const pendingUserModel = db.model("invited-users", PendingUserSchema);

        await pendingUserModel.findOneAndUpdate({_id: inviteId}, {enabled: true})
        return res.status(200).json({
            success: true,
          });

        
    }catch (err) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
      }
}

const resendInvite = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const {inviteEmail, orgId} = req.params;
        const pendingUserModel = db.model("invited-users", PendingUserSchema);
        const userModel = db.model("users", UserSchema);

        const isEmailPresent = await pendingUserModel.exists({ email: inviteEmail });
        const isUserAlreadyPresent = await userModel.exists({ email: inviteEmail });

        if(isEmailPresent && !isUserAlreadyPresent ){
           const linkToken = jwt.sign({ inviteeEmail: inviteEmail, orgId }, process.env.JWT_SECRET, {expiresIn: config.INVITE_EXPIRY })
           const transportObject = {
            host: config.MAIL_HOST,
            port: config.MAIL_PORT,
            secure: false,
            auth: {
                user: config.MAIL_USER,
                pass: config.MAIL_PASSWORD
            }
        }
        const inviteLink = config.BASE_URL+ 'signup/' + linkToken
        let transporter = nodemailer.createTransport(transportObject)
        ejs.renderFile("emailTemplate/inviteEmail.ejs", {inviteUserLink: inviteLink}, async function (err, data){
            if(err){
                logger.info(err)
            }else{
                const emailMessage = {
                    from: config.MAIL_FROM,
                    to: [inviteEmail],
                    subject: "Invitation To Join The apiwiz Ticket Management System",
                    text: "Hello! Please Click on the button to sign up for the app",
                    html: data,
                }
    
                await transporter.sendMail(emailMessage);    
                return res.status(200).send();

            }
        })

        }else{
            return res.status(400).json({
                success: false,
                message: "Invalid Email Resend Invite",
              });
        }


    }catch (err) {
        logger.info(err)
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
      }
}

const sendEmailRegisterInvite = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }

        const {inviteEmails} = req.body;
        const orgId = req.params.orgId;
        const pendingUserModel = db.model("invited-users", PendingUserSchema);
        const userModel = db.model("users", UserSchema);
        const orgModel = db.model("organisations", OrganisationSchema);

        const currentOrg = await orgModel.findOne({_id: orgId})
        const isInvalidDomainPresent = inviteEmails.map(domain => {
            const emailDomain = domain.split('@')[1]
            if( !config.DEFAULT_ITORIX_CLIENT_USER.includes(domain) && (emailDomain === "itorix.com" || emailDomain === "apiwiz.com")) return false
            else{
                return currentOrg.emailDomains.includes(emailDomain)
            }
            }).includes(false)

        if(isInvalidDomainPresent){
            return res.status(401).json({
                success: false,
                message: "Invites contain invalid email domains.",
              });
        }

        const promises = inviteEmails.map(async (inviteeEmail)=>{

            const isEmailPresent = await pendingUserModel.exists({ email: inviteeEmail });
            const isUserAlreadyPresent = await userModel.exists({ email: inviteeEmail });

            if(isUserAlreadyPresent){
                return Promise.reject(`${inviteeEmail} has Already Signed Up`)
            }
            if(isEmailPresent){
                return Promise.reject(`${inviteeEmail} was Already Invited`)                
            }

                const linkToken = jwt.sign({ inviteeEmail, orgId }, process.env.JWT_SECRET, {expiresIn: config.INVITE_EXPIRY })
                const token = req.headers.authorization.split(" ")[1];
                const {email} = jwt.decode(token)
                const docToSave = new pendingUserModel({ email: inviteeEmail, organizationId: orgId, invitedBy: email, userSignedUp: false });
                await docToSave.save();
                return sendEmail({token: linkToken, inviteEmail: inviteeEmail})
        })

        const executedPromises = await Promise.allSettled(promises)
        console.log(executedPromises, "EXECUTED PROMISES")
        return res.status(200).json({
            success: true,
            data: executedPromises
          });
     
    }catch (err) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
      }
}

const failedImportEmail = async ({importerEmail, orgName, isAttachmentRequired}) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
    logger.info("import failed email notification block.", JSON.stringify(importerEmail))
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
    let emailVariables = {importerName: importerEmail, orgName, baseUrl: config.BASE_URL, emailBody: "Please Re-Check the JIRA credentials that you've entered and Try Again or contact Wizdesk Support."}
    if(!isAttachmentRequired){
      emailVariables.emailBody = "Please feel free to contact Wizdesk Support."
    }


return new Promise((resolve, reject) => {
  ejs.renderFile(
    "emailTemplate/failedImport.ejs",
    emailVariables,
    (err, data) => {
      if (err) {
        logger.info(err);
        reject(err); 
      } else {
        console.log(importerEmail, "IMPORTER EMAIL")
        const emailMessage = {
            from: config.MAIL_FROM,
            to: importerEmail,
            subject: "Tickets Import has Failed",
            text: "Please Raise an issue or try again later.",
            html: data,
        }

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

    
}catch (err) {
    return {emailSuccess: false}
  }
}

module.exports={sendEmailRegisterInvite, resendInvite, disableInvite, enableInvite, failedImportEmail};