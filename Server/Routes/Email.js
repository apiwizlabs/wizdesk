const express = require("express")
const {sendEmailRegisterInvite,failedImportEmail, resendInvite, disableInvite, enableInvite} = require("../Controllers/Email.controller")
const {isSupportOrAdminUser, verifyClient} = require("../middlewares/userTypeCheck")

const router = express.Router();

router.route("/inviteUser/:orgId").post(isSupportOrAdminUser, sendEmailRegisterInvite);
router.route("/resendInvite/:inviteEmail/:orgId").post(isSupportOrAdminUser, resendInvite);
router.route("/disableInvite/:inviteId").post(isSupportOrAdminUser, disableInvite);
router.route("/enableInvite/:inviteId").post(isSupportOrAdminUser, enableInvite);
router.route("/failedImport/:importerEmail/:orgId").post(verifyClient, failedImportEmail)

module.exports = router