const express = require("express")
const { googleLoginController, deleteUserById, lockUserById, unlockUserById ,updateUserByEmailController, getAllClientUsers, basicLoginController, getUserByEmailController, resetPasswordController, resetPasswordInitializer, googleSignupController, getSupportUsersByOrg, registerDummyController, getAllSupportUsers, signupController, getAllInvites } = require("../Controllers/Auth.controller")
const {isSupportOrAdminUser, verifyClient, isAdminUser, userExists} = require("../middlewares/userTypeCheck")

const router = express.Router();

router.route("/login").post(googleLoginController);
router.route("/basiclogin").post(basicLoginController);
// router.route("/dummysignup").post(isSupportOrAdminUser, registerDummyController);
router.route("/signup").post(signupController);
router.route("/google/signup").post(googleSignupController);
router.route("/reset").post(resetPasswordInitializer);
router.route("/reset/password").post(resetPasswordController);
router.route("/user/:userEmail")
.get(userExists, getUserByEmailController)
.post(userExists, updateUserByEmailController)
router.route("/lock/:userId").post(isAdminUser,lockUserById );
router.route("/unlock/:userId").post(isAdminUser,unlockUserById );
router.route("/delete/:userId").post(isAdminUser,deleteUserById );

router.route("/support").get(isSupportOrAdminUser, getAllSupportUsers);
router.route("/client").get(isSupportOrAdminUser, getAllClientUsers);
router.route("/invites").get(isSupportOrAdminUser, getAllInvites);
router.route("/support/:orgId").get(verifyClient, getSupportUsersByOrg);

module.exports = router