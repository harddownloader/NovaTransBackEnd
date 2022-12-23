const slug = require("mongoose-slug-generator");
const mongoose = require("mongoose");
mongoose.plugin(slug);

const { ObjectId } = mongoose.Schema;

const StationSchema = new mongoose.Schema({
  id: String,
  date: String,
  time: String,
  city: String,
  cityId: String,
  station: String,
});

const typeEnumSimpleTrip = "обычный";
const typeEnumRegularTrip = "регулярный";
const typeEnum = [
  "AC",
  "Delux",
  "Normal",
  "Suspense AC",
  "Suspense Delux",
  typeEnumSimpleTrip,
  typeEnumRegularTrip
];

const busSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32
    },
    type: {
      type: String,
      enum: typeEnum
    },
    regularDateStart: {
      type: String,
      trim: true,
      maxlength: 32
    },
    regularDateEnd: {
      type: String,
      trim: true,
      maxlength: 32
    },
    regularDaysOfTheWeek: {
      type:  [{
        type: Number
      }]
    },
    regularDayOfTheWeek: {
      type: Number,
      trim: true,
      maxlength: 1
    },
    parentId: {
      type: ObjectId,
      ref: "Bus"
    },
    busNumber: {
      type: String,
      trim: true,
      required: true,
      maxlength: 64
    },
    fare: {
      type: Number,
      trim: true,
      required: true,
      maxlength: 32
    },
    features: {
      type: String
    },
    description: {
      type: String,
      maxlength: 2000
    },
    seatsAvailable: {
      type: Number,
      trim: true,
      default: 30,
      maxlength: 32
    },
    bookedSeat: {
      type: []
    },
    soldSeat: {
      type: []
    },
    numberOfSeats: {
      type: Number,
      trim: true,
      default: 30,
      maxlength: 32
    },
    image: {
      type: String
    },
    departure_time: {
      type: String,
      trim: true,
      maxlength: 32
    },
    arrival_time: {
      type: String,
      trim: true,
      maxlength: 32
    },
    carrierBrand: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32
    },
    carrierBus: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    travel: {type: ObjectId, ref: "Travel"},
    startLocation: { type: ObjectId, ref: "Location" },
    endLocation: { type: ObjectId, ref: "Location" },

    journeyDate: {
      type: String,
    },
    journeyDateObj: {
      type: Date,
    },
    arrivalDate: {
      type: String,
    },
    owner: {
      type: ObjectId,
      ref: "Owner"
    },
    boardingPoints: [
      {
        type: String,
        trim: true
      }
    ],
    droppingPoints: [
      {
        type: String,
        trim: true
      }
    ],
    wayStations: [StationSchema],
    slug: {
      type: String,
      slug: "name",
      unique: true,
      slug_padding_size: 3
    }
  },
  { timestamps: true }
);

module.exports = {
  Bus: mongoose.model("Bus", busSchema),
  typeEnumSimpleTrip,
  typeEnumRegularTrip,
  typeEnum
}
