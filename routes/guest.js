const express = require("express");
const router = express.Router();
const {
  getAllGuests,
  getGuestsByIds,
} = require("../controllers/guest");

router.get("/", getAllGuests);
router.get("/byIds/:ids", getGuestsByIds);

module.exports = router;
