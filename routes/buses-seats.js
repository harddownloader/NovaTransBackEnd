const express = require("express");
const {
  getAllBusSeats,
  getBusSeatsById
} = require('../controllers/buses-seats');

const router = express.Router();

router.get("/", getAllBusSeats);
router.get("/:busSeatsId", getBusSeatsById);

module.exports = router;
