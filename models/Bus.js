const slug = require("mongoose-slug-generator");
const mongoose = require("mongoose");
mongoose.plugin(slug);

const { ObjectId } = mongoose.Schema;

const StationSchema = new mongoose.Schema({
  id: String,
  date: String,
  dateObj: Date,
  time: String,
  city: String,
  cityId: String,
  station: String,
});

const typeEnumSimpleTrip = "обычный";
const typeEnumRegularTrip = "регулярный";
const typeEnum = [
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
    category: {type: ObjectId, ref: "Category"},
    owner: {
      type: ObjectId,
      ref: "Owner"
    },
    wayStations: [StationSchema],
    slug: {
      type: String,
      slug: "name",
      unique: true,
      slug_padding_size: 3
    },
    busSeatsId: {
      type: ObjectId,
      ref: "BusesSeats"
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
