const Bus = require("../models/Bus");
const _ = require("lodash");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { checkDateAvailability } = require("../helpers");

exports.busBySlug = async (req, res, next, slug) => {
  const bus = await Bus.findOne({ slug }).populate("owner", "name role");
  if (!bus) {
    return res.status(400).json({
      error: "Bus not found"
    });
  }
  req.bus = bus; // adds bus object in req with bus info
  next();
};

exports.read = (req, res) => {
  return res.json(req.bus);
};

exports.getBuses = async (req, res) => {
  const buses = await Bus.find()
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(buses);
};

exports.getAllAvailableBuses = async (req, res) => {
  const buses = await Bus.find({ isAvailable: true })
    .populate("owner", "name phone")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(buses);
};

exports.getAllUnavailableBuses = async (req, res) => {
  const buses = await Bus.find({ isAvailable: false })
    .populate("owner", "name phone")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(buses);
};

exports.getAvailableBusesOfOwner = async (req, res) => {
  const buses = await Bus.find({ owner: req.ownerauth, isAvailable: true })
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(buses);
};

exports.getUnavailableBusesOfOwner = async (req, res) => {
  const buses = await Bus.find({ owner: req.ownerauth, isAvailable: false })
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(buses);
};

exports.searchBus = async (req, res) => {
  if (_.size(req.query) < 1)
    return res.status(400).json({ error: "Invalid query" });

  const { startLocation, endLocation, journeyDate } = req.query;

  const journeyDateFrom = new Date(journeyDate)
  const journeyDateTo = new Date(journeyDate)
  journeyDateTo.setMonth(journeyDateTo.getMonth() + 1)

  const buses = await Bus.find({
    // startLocation,
    // endLocation,
    wayStations: {
      $all: [
        { "$elemMatch": {"cityId": startLocation}},
        { "$elemMatch": {"cityId": endLocation}},
      ]
    },
   
    journeyDateObj: {
      $gte: journeyDateFrom,
      $lt: journeyDateTo,
    },
    isAvailable: true
  })
    .populate("travel", "name")
    .populate("startLocation", "name")
    .populate("endLocation", "name");

  const result = buses.filter(bus => {
    const startIndx = bus.wayStations.findIndex(station => station.cityId === startLocation)
    const endIndx = bus.wayStations.findIndex(station => station.cityId === endLocation)

    return startIndx < endIndx
  })
  return res.json(result);
};

exports.searchBusByFilter = async (req, res) => {
  const { startLocation, endLocation, journeyDate, travel, type } = req.body;
  const bus = await Bus.find({
    startLocation,
    endLocation,
    journeyDate,
    isAvailable: true,
    travel: { $in: travel },
    type: { $in: type }
  })
    .populate("travel", "name")
    .populate("startLocation", "name")
    .populate("endLocation", "name");
  res.json(bus);
};

exports.create = async (req, res) => {

  const busExists = await Bus.findOne({ busNumber: req.body.busNumber });
  if (busExists)
    return res.status(403).json({
      error: "Bus is already added!"
    });

  if (req.file !== undefined) {
    const { filename: image } = req.file;

    //Compress image
    await sharp(req.file.path)
      .resize(800)
      .jpeg({ quality: 100 })
      .toFile(path.resolve(req.file.destination, "resized", image));
    fs.unlinkSync(req.file.path);
    req.body.image = "busimage/resized/" + image;
  }

  // boardingPoints and droppingPoints we can delete
  if (req.body.boardingPoints) {
    req.body.boardingPoints = req.body.boardingPoints.split(",");
  }

  if (req.body.droppingPoints) {
    req.body.droppingPoints = req.body.droppingPoints.split(",");
  }

  if (req?.body) req.body = prepareBody(req.body)

  const bus = new Bus(req.body);

  if (!checkDateAvailability(req.body.journeyDate)) {
    bus.isAvailable = false;
  }

  bus.owner = req.ownerauth;

  await bus.save();

  res.json(bus);
};

exports.update = async (req, res) => {

  if (req?.body) req.body = prepareBody(req.body) 

  if (req.file !== undefined) {
    const { filename: image } = req.file;

    // Compress image
    await sharp(req.file.path)
      .resize(800)
      .jpeg({ quality: 100 })
      .toFile(path.resolve(req.file.destination, "resized", image));
    fs.unlinkSync(req.file.path);
    req.body.image = "busimage/resized/" + image;
  }

  let bus = req.bus;
  bus = _.extend(bus, req.body);

  if (!checkDateAvailability(req.body.journeyDate)) {
    bus.isAvailable = false;
  }

  await bus.save();

  res.json(bus);
};

exports.remove = async (req, res) => {
  let bus = req.bus;
  await bus.remove();
  res.json({ message: "Bus removed successfully" });
};

// body Builder
function prepareBody(body) {
  // decrypt objects and arrays
  if (body?.wayStations) body.wayStations = getWayStations(body.wayStations)
  // set date journery like object (for searching tickets)
  if (body?.journeyDate) body.journeyDateObj = new Date(body.journeyDate)

  return body
}

function getWayStations(wayStations) {
  if (Array.isArray(wayStations)) {
    // if it has some stations
    wayStations = wayStations.map(station => JSON.parse(station))
  } else if (
    typeof wayStations === 'string'
  ) {
    // if it has a station
    wayStations = JSON.parse(wayStations)
  }

  return wayStations
}