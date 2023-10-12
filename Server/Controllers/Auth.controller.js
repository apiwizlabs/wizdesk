const jwt = require("jsonwebtoken");
const config = require("../config");
const dbConnect = require("../db/db.connect");
const { UserSchema } = require("../Models/Users");
const {OrganisationSchema} = require("../Models/Organisation");
const {PendingUserSchema} = require("../Models/PendingUsers");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require('bcryptjs');
const JSEncrypt = require('node-jsencrypt');
const nodemailer = require('nodemailer');
const ejs = require("ejs");
const { unlock } = require("../Routes/Tickets");


async function verify(token) {
    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email_verified, email, name, hd } = payload;
      if (email_verified) {
        return {
          verified: true,
          email,
          name,
          hd,
        };
      } else{
        return {
            verified: false,
        }
      }
    } catch (err) {
      logger.error(err, "ERROR")
      return {
        verified: false,
      };
    }
  }

  const isValidPhonenumber = (value) => {
    return (/^\d{7,}$/).test(value.replace(/[\s()+\-\.]|ext/gi, ''));
  }

  const decryptPassword = (password) => {
    const jsDecrypt = new JSEncrypt();
    jsDecrypt.setPrivateKey(process.env.PRIVATE_KEY);
    return jsDecrypt.decrypt(password);
  };

  const passwordValidator = (decryptedPassword) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*~`;:><,/."'?&#^)(+=\-_}{[\]])[a-zA-Z\d@$#+=^()|`~.><,/:;"'!%*?&\-_}{[\]^()]{6,}$/;
    return passwordRegex.test(decryptedPassword);
  }

  const getUserByEmailController = async (req, res) => {
    try {
        let db = await dbConnect();
        if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
  
        return;
      }
      const {userEmail} = req.params
      const userListModel = db.model("users", UserSchema);
      const orgModel = db.model("organisations", OrganisationSchema);
      const usersData = await userListModel.findOne({email: userEmail}).populate({path: "assignedOrganisations",orgModel});
      return res.status(200).json({
        success: true,
        data: usersData,
      });
    } catch (err) {
     return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
};
  const updateUserByEmailController = async (req, res) => {
    try {
        let db = await dbConnect();
        if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
  
        return;
      }
      const {userEmail} = req.params
      const {name, phone} = req.body;
      console.log(name, phone, "name n phone");
      const userListModel = db.model("users", UserSchema);
      const usersData = await userListModel.findOneAndUpdate({email: userEmail}, {name, phone});
      return res.status(200).json({
        success: true,
        data: usersData,
      });
    } catch (err) {
     return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
};

  const resetPasswordInitializer = async (req, res) => {
    try{
      let db = await dbConnect();
      if (!db) {
      res.status(400).json({
        message: "DB client not found",
      }); return; } 

      const {emailId} = req.body;

      const userListModel = db.model("users", UserSchema);
      const isUserPresent = await userListModel.findOne({ email: emailId });

      if(isUserPresent && (!isUserPresent.isDeleted || isUserPresent.type === "ADMIN USER") && (!isUserPresent.isLocked || isUserPresent.type === "ADMIN USER")){

        const transportObject = {
          host: config.MAIL_HOST,
          port: config.MAIL_PORT,
          secure: false,
          auth: {
              user: config.MAIL_USER,
              pass: config.MAIL_PASSWORD
          }
      }
  
      const resetToken = jwt.sign({ emailId: emailId, date: Date.now() }, process.env.JWT_SECRET, {expiresIn: config.RESET_EXPIRY })
  
      const resetPswdLink = config.BASE_URL + "reset/" + resetToken
      let transporter = nodemailer.createTransport(transportObject)
      const resetEmail = new Promise((resolve, reject) => {
        ejs.renderFile(
          "emailTemplate/resetPassword.ejs",
          {resetLink: resetPswdLink},
          (err, data) => {
            if (err) {
              logger.info(err);
              reject(err); 
            } else {
              const emailMessage = {
                from: config.MAIL_FROM,
                to: [emailId],
                subject: "Reg: Password Reset",
                text: "Click on the button to Reset your password",
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

      const resp = await resetEmail;
      return res.status(200).json({
        success: true,
        data: resp,
      });  

      }else{
        return res.status(401).json({
          success: false,
          message: "User not present",
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
  const resetPasswordController = async (req, res) => {
    try{
      let db = await dbConnect();
      if (!db) {
      res.status(400).json({
        message: "DB client not found",
      }); return; } 

      const {emailId, password, resetToken} = req.body;
      const decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET);

      const userListModel = db.model("users", UserSchema);
      const isUserPresent = await userListModel.findOne({ email: emailId });

      if(isUserPresent && isUserPresent.email === decodedToken.emailId && (!isUserPresent.isLocked || isUserPresent.type === "ADMIN USER") && (!isUserPresent.isDeleted || isUserPresent.type === "ADMIN USER")){
        const saltRounds = 10;
        const decryptedPassword = decryptPassword(password);
        if(!passwordValidator(decryptedPassword)) {
          return res.status(401).json({
            success: false,
            message: "Invalid Password",
        });
        }
        const hashedPassword = await bcrypt.hash(decryptedPassword, saltRounds)
        userListModel.findByIdAndUpdate(isUserPresent._id.toString(), {password: hashedPassword},  
        (err, data)=>{
          if (err) {
            return res.status(500).json({
                success: false,
                message: "Error in updating pending users with success",
                errorMessage: err.message,
            }); }
          else if (data){
            return res.status(200).json({
              success: true,
              message: "Password updated",
          });}
         })
      }else{
        return res.status(401).json({
          success: false,
          message: "User does not exist",
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


  
  const googleLoginController = async (req, res) => {
    try {
      const loginObj = req.body;
      const { verified, email, name, hd } = await verify(loginObj.token);
      if (verified) {
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
  
          return;
        }
  
        const userListModel = db.model("users", UserSchema);
        let updateObject = {
          lastLogin: Date.now()
        }

        const isUserPresent = await userListModel.findOne({ email });
        if( (isUserPresent && !isUserPresent.isLocked && !isUserPresent.isDeleted ) || (isUserPresent && isUserPresent.type === "ADMIN USER")){
          if(!config.DEFAULT_ITORIX_CLIENT_USER.includes(isUserPresent.email) && (hd === "itorix.com" || hd === "apiwiz.com")){
            const type = "SUPPORT USER";
            userListModel.findByIdAndUpdate(
                isUserPresent._id.toString(),
                {
                  ...updateObject
                },
                {new: true, runValidators: true},
                (err, data) => {
                  if (err) {
                    return res.status(500).json({
                      success: false,
                      message: "Error in logging in",
                      errorMessage: err.message
                    });
                  } else if (data) {
                    return res.status(200).json({
                      success: true,
                      data: {
                        token: jwt.sign({ email, type }, process.env.JWT_SECRET, {
                          expiresIn: config.TOKEN_EXPIRY,
                        }),
                      },
                    });
                  }
                }
              );
          }else{
            const orgModel = db.model("organisations", OrganisationSchema);
            const orgPresent = await orgModel.findOne({ _id: isUserPresent.organizationId });
            const domainCheck = orgPresent.emailDomains.includes(hd) || orgPresent.emailDomains.includes(email.split('@')[1])
            if(domainCheck && orgPresent){
              const type = "CLIENT USER";
              userListModel.findByIdAndUpdate(
                isUserPresent._id.toString(),
                {
                  ...updateObject
                },
                {new: true, runValidators: true},
                (err, data) => {
                  if (err) {
                    return res.status(500).json({
                      success: false,
                      message: "Error in logging in",
                      errorMessage: err.message
                    });
                  } else if (data) {
                    return res.status(200).json({
                      success: true,
                      data: {
                        token: jwt.sign({ email, type, orgId: isUserPresent.organizationId  }, process.env.JWT_SECRET, {
                          expiresIn: config.TOKEN_EXPIRY,
                        }),
                      },
                    });
                  }
                }
              );
            }
          }
        }
        else if(!isUserPresent){
          if(hd === "itorix.com" || hd === "apiwiz.com"){
            let type = "SUPPORT USER"
            let userToSave = new userListModel({ name, email, type });
            userToSave.save((err, data) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Error in registering user",
                  errorMessage: err.message,
                });
              }
              if (data) {
                return res.status(200).json({
                  success: true,
                  data: {
                    token: jwt.sign({ email, type }, process.env.JWT_SECRET, {
                      expiresIn: config.TOKEN_EXPIRY,
                    }),
                  },
                });
              }
            });
          }else{
            return res.status(401).json({
              success: false,
              message: "Invalid Credentials",
              errorMessage: err.message
            });
          }

        }else{
          logger.info("Invalid User")
          return res.status(401).json({
            success: false,
            message: "Invalid User",
          });
        }
      } 
      else {
        logger.info("User cannot be verified:")
        return res.status(403).json({
          success: false,
          message: "User cannot be verified",
        });
      }
    } catch (err) {
      logger.info('login error:',{err})
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  };


  const basicLoginController = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
 
        const {encryptedPassword, email} = req.body;

        const userListModel = db.model("users", UserSchema);
  
        const userProfile = await userListModel.findOne({ email });

        if(!((userProfile && !userProfile.isLocked && !userProfile.isDeleted) || userProfile?.type === "ADMIN USER")){
          return res.status(401).json({
            success: false,
            message: "Your Profile has either been locked or deleted",
          });
        }
            const decryptedPassword = decryptPassword(encryptedPassword);
            
            //try skip decrypt step and skip password validator step:todo
            const isValidPassword = await bcrypt.compare(decryptedPassword, userProfile.password);
            if(!isValidPassword){
                return res.status(401).json({
                    success: false,
                    message: "Incorrect Credentials",
                  });
            }else if(isValidPassword){
              userProfile.lastLogin = Date.now();
              await userProfile.save();
              const type = userProfile.type
              return res.status(200).json({
                success: true,
                data: {
                  token: jwt.sign({ email, type, orgId: userProfile.organizationId }, process.env.JWT_SECRET, {
                    expiresIn: config.TOKEN_EXPIRY,
                  }),
                },
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

  const registerDummyController = async (req, res) => {
    try{
        let db = await dbConnect();
        if (!db) {
          res.status(400).json({
            message: "DB client not found",
          });
          return;
        }
        const saltRounds = 10;
        const {encryptedPassword, email, name, type} = req.body;
        const userListModel = db.model("users", UserSchema);
        const decryptedPassword = decryptPassword(encryptedPassword);
        const hashedPassword = await bcrypt.hash(decryptedPassword, saltRounds)
        const userToSave = new userListModel({ name, email, type, password: hashedPassword });
        userToSave.save((err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error in registering user",
              errorMessage: err.message,
            });
          }
          if (data) {
            return res.status(200).json({
              success: true,
              data: {
                token: jwt.sign({ email, type }, process.env.JWT_SECRET, {
                  expiresIn: config.TOKEN_EXPIRY,
                }),
              },
            });
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

  const getAllSupportUsers = async (req, res) => {
        try {
            let db = await dbConnect();
            if (!db) {
            res.status(400).json({
              message: "DB client not found",
            });
      
            return;
          }
          const userListModel = db.model("users", UserSchema);
          const usersData = await userListModel.find({});
          const supportUsersData = usersData.filter((userData) => userData.type === "SUPPORT USER" || userData.type === "ADMIN USER")
          return res.status(200).json({
            success: true,
            data: supportUsersData,
          });
        } catch (err) {
         return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
    };

  const getAllClientUsers = async (req, res) => {
        try {
            let db = await dbConnect();
            if (!db) {
            res.status(400).json({
              message: "DB client not found",
            });
            return;
          }
          const userListModel = db.model("users", UserSchema);
          const orgModel = db.model("organisations", OrganisationSchema);
          const usersData = await userListModel.find({}).populate({ path: "organizationId", orgModel });
          const clientUsersData = usersData.filter((userData) => userData.type === "CLIENT USER")
          return res.status(200).json({
            success: true,
            data: clientUsersData,
          });
        } catch (err) {
         return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
    };

    const getAllInvites = async (req, res) => {
      try{
          let db = await dbConnect();
          if (!db) {
            res.status(400).json({
              message: "DB client not found",
            });
            return;
          }
  
          const invitesModel = db.model("invited-users", PendingUserSchema);
          const orgModel = db.model("organisations", OrganisationSchema);
          const invitedData = await invitesModel.find({}).populate({ path: "organizationId", orgModel });
          return res.status(200).json({
            success: true,
            data: invitedData,
          });
      }catch (err) {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errorMessage: err.message,
          });
        }
  }

const signupController = async (req, res) => {
  try{

    let db = await dbConnect();
    if (!db) {
    res.status(400).json({
      message: "DB client not found",
    });

    return;
  }
  const saltRounds = 10;
  const {password, name, inviteToken} = req.body;
  const decodedToken = jwt.verify(inviteToken, process.env.JWT_SECRET);
  const userListModel = db.model("users", UserSchema);


  const isUserPresent = await userListModel.exists({ email: decodedToken.inviteeEmail });
  if(isUserPresent){
    return res.status(201).json({
      success: true,
      data: "Already Signed Up. Please Login."
    });
  }

  const orgListModel = db.model("organisations", OrganisationSchema)
  const pendingUsersModel = db.model("invited-users", PendingUserSchema);

  const userOrganisation = await orgListModel.findOne({_id: decodedToken.orgId})
  const inviteeEmailDomain = decodedToken.inviteeEmail.split("@")[1];
  const domainCheck = userOrganisation.emailDomains.includes(inviteeEmailDomain)
  const isEmailInPending = await pendingUsersModel.findOne({ email: decodedToken.inviteeEmail});

  if(!(userOrganisation && domainCheck && isEmailInPending.enabled)){
    return res.status(401).json({
      success: false,
      message: "Invalid Signup",
      errorMessage: err.message,
    });
  }

    const decryptedPassword = decryptPassword(password);
  if(!passwordValidator(decryptedPassword)) {
    return res.status(401).json({
      success: false,
      message: "Invalid Password Entered",
    });
  }

    const hashedPassword = await bcrypt.hash(decryptedPassword, saltRounds)
    const userObj = {
      name, 
      email: decodedToken.inviteeEmail,
      type: "CLIENT USER",
      organizationId: decodedToken.orgId,
      password: hashedPassword,
    }

    const userToSave = new userListModel({...userObj});
    const savedUser = await userToSave.save();
    isEmailInPending.userSignedUp = true;
    await isEmailInPending.save();
    userOrganisation.clientUsers.push(savedUser._id);
    await userOrganisation.save();
    return res.status(200).json({
      success: true,
      data: {
        token: jwt.sign({ email : decodedToken.inviteeEmail, type: "CLIENT USER", orgId: decodedToken.orgId }, process.env.JWT_SECRET, {
          expiresIn: config.TOKEN_EXPIRY,
        }),
      },
    });   

  }catch (err) {
    logger.info(err)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

const googleSignupController = async (req, res) => {
  try{

    let db = await dbConnect();
    if (!db) {
    res.status(400).json({
      message: "DB client not found",
    }); return; } 

    const signupObj = req.body;
    const { verified, email, name, hd } = await verify(signupObj.token);

    if (verified) {
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const inviteToken = signupObj.inviteToken;
      const decodedToken = jwt.verify(inviteToken, process.env.JWT_SECRET);

      const userListModel = db.model("users", UserSchema);
      const orgListModel = db.model("organisations", OrganisationSchema)
      const pendingUsersModel = db.model("invited-users", PendingUserSchema);

      const isUserPresent = await userListModel.exists({ email });

    
      if (isUserPresent) {
        return res.status(201).json({
          success: true,
          data: "Already Signed Up. Please Login."
        });
      } 
      else if(!isUserPresent) {   

        const isOrganisationPresent = await orgListModel.findOne({_id: decodedToken.orgId})
        const domainCheck = isOrganisationPresent.emailDomains.includes(hd) || isOrganisationPresent.emailDomains.includes(decodedToken.inviteeEmail.split('@')[1]) 
        const isEmailInPending = await pendingUsersModel.findOne({ email: decodedToken.inviteeEmail});
        if(!(isOrganisationPresent && domainCheck && isEmailInPending.enabled )){
          return res.status(401).json({
            success: false,
            message: "Invalid User invite data",
          });
        }
          const userObj = {
            name, 
            email: decodedToken.inviteeEmail,
            type: "CLIENT USER",
            organizationId: decodedToken.orgId,
          }
    
          const type = "CLIENT USER"
          let userToSave = new userListModel(userObj);
          const savedUser = await userToSave.save();
          isEmailInPending.userSignedUp = true;
          await isEmailInPending.save();
          isOrganisationPresent.clientUsers.push(savedUser._id)
          await isOrganisationPresent.save()

          return res.status(200).json({
            success: true,
            data: {
              token: jwt.sign({ email : decodedToken.inviteeEmail, type: type, orgId: decodedToken.orgId }, process.env.JWT_SECRET, {
                expiresIn: config.TOKEN_EXPIRY,
              }),
            },
          });
          
      }
      else{
            return res.status(401).json({
              success: false,
              message: "User not registered",
            });
      }
    } 
    else {
      return res.status(401).json({
        success: false,
        message: "User cannot be verified",
      });
    }


}catch (err) {
    logger.info(err)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}


  const getSupportUsersByOrg = async (req, res) => {
    try {
        let db = await dbConnect();
        if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
  
        return;
      }
      const {orgId} = req.params;
      const orgModel = db.model("organisations", OrganisationSchema);
      const userModel = db.model("users", UserSchema);
      const currOrg = await orgModel.findOne({_id: orgId}).populate({ path: "supportUsers", userModel });
      const supportUsersData = currOrg.supportUsers
      return res.status(200).json({
        success: true,
        data: supportUsersData,
      });
    } catch (err) {
      logger.info(err)
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
};

const lockUserById = async (req, res) => {
  try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const {userId}= req.params;
      const usersModel = db.model("users", UserSchema);
      const orgModel = db.model("organisations", OrganisationSchema);
      const lockedUser = await usersModel.findOne({_id: userId}).populate({
        path: 'assignedOrganisations', 
        model: orgModel, 
        select: "supportUsers name",
        populate:{
          path: 'supportUsers',
          model: 'users',
          select: 'isDeleted isLocked'
        }
      });

      if(lockedUser.type !== "ADMIN USER"){
        if(lockedUser.type === "SUPPORT USER"){
          const orgList = lockedUser?.assignedOrganisations
          if(orgList.length > 0){
            for(let i = 0; i < orgList.length; i++ ){
              const orgSupportUsers = orgList[i].supportUsers
              if(orgSupportUsers.length <= 1){
                return res.status(401).json({
                  success: false,
                  message: `${lockedUser.name} is the only support user for ${orgList[i].name}`,
                })
              }else if(orgSupportUsers.length > 1){
                const validUsers = orgSupportUsers.filter(user => {
                  if(user.isLocked || user.isDeleted){
                    if(user._id === userId){
                      return res.status(200).json({
                        success: true,
                        message: "User Deleted",
                      })
                    }
                  }
                    return !(user.isLocked || user.isDeleted)
                })
                // const validUsers = orgSupportUsers.filter(user => !(user.isLocked || user.isDeleted));
                console.log(validUsers, "VALID USERS LOCKK")
                if(validUsers.length <= 1){
                  return res.status(401).json({
                    success: false,
                    message: `${lockedUser.name} is the only valid support user for ${orgList[i].name}`,
                  })
                }
              }
            }
          }
        }

        lockedUser.isLocked = true;
        await lockedUser.save()
        return res.status(200).json({
          success: true,
          message: "User locked",
        })
      }else{
        return res.status(401).json({
          success: false,
          message: "Admin User Cannot be Locked",
          errorMessage: err.message,
        });
      }

  }catch (err) {
    console.log(err)
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
}

const deleteUserById = async (req, res) => {
  try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const {userId}= req.params;
      const usersModel = db.model("users", UserSchema);
      const orgModel = db.model("organisations", OrganisationSchema);
      const deletedUser = await usersModel.findOne({_id: userId}).populate({
        path: 'assignedOrganisations', 
        model: orgModel, 
        select: "supportUsers name",
        populate:{
          path: 'supportUsers',
          model: 'users',
          select: 'isDeleted isLocked'
        }
      });
      if(deletedUser.type !== "ADMIN USER"){
        if(deletedUser.type === "SUPPORT USER"){
          const orgList = deletedUser?.assignedOrganisations
          if(orgList.length > 0){
            for(let i = 0; i < orgList.length; i++ ){
              const orgSupportUsers = orgList[i].supportUsers
              if(orgSupportUsers.length <= 1){
                return res.status(401).json({
                  success: true,
                  message: `${deletedUser.name} is the only support user for ${orgList[i].name}`,
                })
              }else if(orgSupportUsers.length > 1){
                const validUsers = orgSupportUsers.filter(user => !(user.isLocked || user.isDeleted))

                if(deletedUser.isLocked){
                  deletedUser.isDeleted = true;
                  await deletedUser.save();
                  return res.status(200).json({
                    success: true,
                    message: "User Deleted",
                  })
                }

                if(validUsers.length <= 1){
                  return res.status(401).json({
                    success: true,
                    message: `${deletedUser.name} is the only valid support user for ${orgList[i].name}`,
                  })
                }
                
              }
            }
          }
        }
        deletedUser.isDeleted = true;
        await deletedUser.save();
        return res.status(200).json({
          success: true,
          message: "User Deleted",
        })
      }else{
        return res.status(401).json({
          success: false,
          message: "Admin User Cannot be Deleted",
        })
      }
  }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
}
const unlockUserById = async (req, res) => {
  try{
      let db = await dbConnect();
      if (!db) {
        res.status(400).json({
          message: "DB client not found",
        });
        return;
      }
      const {userId}= req.params;
      const usersModel = db.model("users", UserSchema);
      const unlockUser = await usersModel.findOne({_id: userId});
      unlockUser.isLocked = false;
      await unlockUser.save()
      return res.status(200).json({
        success: true,
        message: "User Unlocked",
      })

  }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
}
  

module.exports = {deleteUserById, getUserByEmailController,getAllInvites, lockUserById, unlockUserById ,getAllClientUsers, updateUserByEmailController, googleLoginController, resetPasswordController, resetPasswordInitializer ,getSupportUsersByOrg, googleSignupController, basicLoginController, registerDummyController, getAllSupportUsers, signupController };
  