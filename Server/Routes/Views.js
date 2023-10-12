const express = require("express");
const {
  createViewController,
  deleteViewController,
  getAllViewsController,
} = require("../Controllers/Views.controller.js");
const {userExists} = require("../middlewares/userTypeCheck")

const router = express.Router({ mergeParams: true });

router
  .route("/:orgId")
  .post(userExists, createViewController)
  .get(userExists, getAllViewsController)

  router.route("/:viewID")
  .delete(userExists, deleteViewController)

module.exports = router;
