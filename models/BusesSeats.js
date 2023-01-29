const mongoose = require("mongoose");

const busSeatsSchema = new mongoose.Schema({
  seatsCount: {
    type: Number,
    maxlength: 3,
    default: 59,
    required: true
  },
  countBlocksInRow: {
    type: Number,
    default: 6,
    required: true
  },
  countSeatsInRow: {
    type: Number,
    default: 4,
    required: true
  },
  rows: {
    type: Number,
    max : 50,
    min: 0,
    default: 18,
    required: true
  },
  countFreeSeatsInRow: {
    type: Number,
    default: 2,
    required: true
  },
  busElements: {
    driverCoordinates: {
      type: Number,
      default: 0
    },
    firstDoorCoordinates: {
      type: Number,
      default: 4
    },
    secondDoorCoordinates: {
      type: Number,
      default: 46
    },
    wcCoordinates: {
      type: Number,
      default: 40
    },
    barCoordinates: {
      type: Number,
      default: 52
    },
  },
  seatsForBusElements: {
    type: Number,
    default: 8, // the number is put down by the selection method
    required: true
  },
  // this is the number of additional rows to place the bus elements
  additionalRowsForBusElements: {
    type: Number,
    default: 3,
    required: true
  },
}, { timestamps: true });

module.exports = {
  BusesSeats: mongoose.model("BusesSeats", busSeatsSchema),
}
