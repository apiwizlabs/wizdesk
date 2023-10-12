const express = require("express")
const { addOrganisationController, getAllOrganisations, updateOrganisation,  deleteOrganisation, getOrganisationById } = require("../Controllers/Organisations.controller");
const { isSupportOrAdminUser, isAdminUser, verifyClient } = require("../middlewares/userTypeCheck");

const router = express.Router();

router.route("/")
.post( isSupportOrAdminUser ,addOrganisationController)
.get( isSupportOrAdminUser ,getAllOrganisations)

router.route("/:orgId")
.put( isSupportOrAdminUser , updateOrganisation)
.delete( isAdminUser ,deleteOrganisation)
.get( verifyClient ,getOrganisationById);

module.exports = router