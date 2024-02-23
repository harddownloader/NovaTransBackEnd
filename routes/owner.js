const express = require("express");
const router = express.Router();
const { ownerById, read, update, getAllOwners } = require("../controllers/owner");
const { requireOwnerSignIn, isAuth } = require("../controllers/auth-owner");
const { uploadOwnerAvatar } = require("../helpers")

router.get("/", getAllOwners)

router.get("/:ownerId", read);

/*
 * TODO:
 *  1. replace PUT to PATCH
 *  */
router.put("/:ownerId", requireOwnerSignIn, isAuth, uploadOwnerAvatar, update)

router.param("ownerId", ownerById);

module.exports = router;
