const express = require("express");
const {
  createNewTicket,
  getTicketById,
  deleteTicketById,
  updateTicketById,
  deleteCommentById,
  createMultipleTickets,
  getAllTickets,
  deleteAttachmentById,
  getFilteredTickets,
  getTicketsByOrgId,
  getUserDisplayName,
  importMultipleTickets
} = require("../Controllers/Tickets.controller.js");
const {verifyClient, isSupportOrAdminUser} = require("../middlewares/userTypeCheck")
const {multi_upload} = require("../common")

const router = express.Router({ mergeParams: true });

router
  .route("/org/:orgId")
  .post(verifyClient, createNewTicket)
  .get(verifyClient, getTicketsByOrgId)

router
  .route(`/download/:orgId`)
  .get(verifyClient, getFilteredTickets)

router
  .route("/:ticketId")
  .get(verifyClient, getTicketById)
  .put(verifyClient, updateTicketById)

router.route("/:ticketId/:orgId")
  .delete(verifyClient, deleteTicketById)

router
  .route("/multiple/org/:orgId")
  .post(verifyClient, createMultipleTickets)

router
  .route("/import/:orgId")
  .post(verifyClient, importMultipleTickets)

  // router
  // .route("/:ticketId/:attachmentId")

  // router.route("/comments/:commentId").delete(deleteCommentById)

  router.route("/").get(isSupportOrAdminUser, getAllTickets)
  router.route("/jira/username/:accountId").get(isSupportOrAdminUser, getUserDisplayName)


module.exports = router;
