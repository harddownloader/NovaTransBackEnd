const mongoose = require("mongoose");

const busElements = {
  driverCoordinates: {
    type: Number,
    required: true,
  },
  firstDoorCoordinates: {
    type: Number,
    required: true,
  },
  secondDoorCoordinates: {
    type: Number,
    required: true,
  },
  wcCoordinates: {
    type: Number,
    required: true,
  },
  barCoordinates: {
    type: Number,
    required: true,
  }
}

const busSeatsSchema = new mongoose.Schema({
    busElements: busElements,
    seatsCount: {
      type: Number,
      required: true,
    },
    countBlocksInRow: {
      type: Number,
      required: true,
    },
    countSeatsInRow: {
      type: Number,
      required: true,
    },
    rows: {
      type: Number,
      required: true,
    },
    countFreeSeatsInRow: {
      type: Number,
      required: true,
    },
    seatsForBusElements: {
      type: Number,
      required: true,
    },
    additionalRowsForBusElements: {
      type: Number,
      required: true,
    },
    allBlocksCount: {
      type: Number,
      required: true,
    },
  },
  { collection: 'busesseats', timestamps: true }
);

module.exports = {
  BusSeats: mongoose.model("Busseat", busSeatsSchema)
}
