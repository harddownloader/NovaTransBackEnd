const moment = require("moment");
const {
  Bus,
  typeEnumSimpleTrip,
  typeEnumRegularTrip
} = require("../../models/Bus");
const { Booking } = require("../../models/Booking");
const _ = require("lodash");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const {
  checkSimpleTripDate,
  checkRegularTripDate,
  setAvailabilityStatusForSimpleTrips,
  setAvailabilityStatusForRegularTrips,
} = require("../../helpers");


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

    console.log({busesL: buses?.length})
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

    const {
        startLocation,
        endLocation,
        journeyDate,
        returnStartLocation=null,
        returnEndLocation=null,
        returnJourneyDate=null,
    } = req.query;

    const journeyDateFrom = new Date(journeyDate)
    const journeyDateTo = new Date(journeyDate)
    journeyDateTo.setMonth(journeyDateTo.getMonth() + 1)

    const result  = {

        oneWayTickets: await BusesSearcher({
            isRoundTrip: false,
            start: startLocation,
            end: endLocation,
            dateFrom: journeyDateFrom,
            dateTo: journeyDateTo
        }).search().then(instance => instance.filter().build())
    }

    if (
        returnStartLocation &&
        returnEndLocation &&
        returnJourneyDate
    ) {
        const returnJourneyDateFrom = new Date(returnJourneyDate)
        const returnJourneyDateTo = new Date(returnJourneyDate)
        returnJourneyDateTo.setMonth(returnJourneyDateTo.getMonth() + 1)

        result.returnTickets = await BusesSearcher({
            isRoundTrip: true,
            start: returnStartLocation,
            end: returnEndLocation,
            dateFrom: returnJourneyDateFrom,
            dateTo: returnJourneyDateTo
        }).search().then(instance => instance.filter().build())
    }

    return res.json(result);
};

function BusesSearcher({ start, end, dateFrom, dateTo, isRoundTrip }) {
    return {
        isRoundTrip: isRoundTrip,
        tickets: [],
        search: async function () {
            let searchReq
            if (!this.isRoundTrip) searchReq = {
                wayStations: {
                    $all: [
                        { "$elemMatch": {"cityId": start}},
                        { "$elemMatch": {"cityId": end}},
                    ]
                },

                journeyDateObj: {
                    $gte: dateFrom,
                    $lt: dateTo,
                },
                isAvailable: true,
                type: typeEnumSimpleTrip,
            }
            else searchReq = {
                wayStations: {
                    $all: [
                        { "$elemMatch": {"cityId": start}},
                        { "$elemMatch": {"cityId": end}},
                    ]
                },

                journeyDateObj: {
                    $gte: dateFrom,
                    $lt: dateTo,
                },
                isAvailable: true,
                type: typeEnumSimpleTrip,
            }

            this.tickets = await Bus.find(searchReq)
                .populate("travel", "name")
                .populate("startLocation", "name")
                .populate("endLocation", "name");

            return this
        },
        filter: function() {
            const newTicketsList = this.tickets.filter((bus) => {
                const startIndx = bus.wayStations.findIndex(station => station.cityId === start)
                const endIndx = bus.wayStations.findIndex(station => station.cityId === end)

                return startIndx < endIndx
            })

            this.tickets = newTicketsList

            return this
        },
        build: function () {
            return this.tickets
        }
    }
}

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


const createTrip = async (req, res) => {

    // checking if the same 'busNumber' already exists
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

    // check date for simple trips
    if (
      checkSimpleTripDate(req.body)
    ) {
      setAvailabilityStatusForSimpleTrips(req.body);

      // check date for regular trips
    } else if (
      checkRegularTripDate(req.body)
    ) {
      setAvailabilityStatusForRegularTrips(req.body);
    }

    bus.owner = req.ownerauth;

    await bus.save();

    return bus;
};


/*
* create trip endpoint
*/
exports.create = async (req, res) => {
  const bus = await createTrip(req, res);

  await generateChildren(bus);

  res.json(bus);
}

exports.update = async (req, res) => {
    // console.log('update req', req.body)
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

    // check date for simple trips
    if (
      checkSimpleTripDate(bus)
    ) {
      setAvailabilityStatusForSimpleTrips(bus);

      // check date for regular trips
    } else if (
      checkRegularTripDate(bus)
    ) {
      setAvailabilityStatusForRegularTrips(bus);
    }

    await bus.save();

    const isRmAllChildren = true;
    await generateChildren(bus, isRmAllChildren);

    res.json(bus);
};


// rm all children
function deleteAllChildren(isRmAllChildren, busId) {
  const promise = new Promise(async (resolve, reject) => {
    if (isRmAllChildren) {
      const allCreatedBuses = await Bus.find({ parentId: busId });
      await Promise.all(allCreatedBuses.map(async (trip) => {
        Booking.deleteMany({bus: trip._id}, function (err) {
          if (!err) {
            console.log('All bookings of children removed');
            resolve(true);
          } else {
            console.log('Removing bookings of children - error');
            reject(false);
          }
        });
      }));

      await Bus.deleteMany({ parentId: busId }, function (err) {
        if (!err) {
          console.log('All children removed');
          resolve(true);
        } else {
          console.log('Removing children - error');
          reject(false);
        }
      });
    } else {
      resolve(true);
    }
  });

  return promise;
}


async function generateChildren(bus, isRmAllChildren=false) {
  if (
    bus?.type === typeEnumRegularTrip &&
    bus?.wayStations?.length >= 2
  ) {

    if (
      !bus?.regularDateStart ||
      !bus?.regularDateEnd ||
      !bus?.regularDaysOfTheWeek?.length
    ) {
      console.log('you do not have all the data for scheduled flights');
      return;
    }


    await deleteAllChildren(isRmAllChildren, bus._id);

    // create all children again

    /**
     * end - records are created only up to this date
     * daysOfTheWeek - array of days(number 0-6) - 1 (Monday), 2 (Tue.), 3 (Wednesday), ... 6 (Saturday), 0 (Sunday)
     */
    const start = moment(bus.regularDateStart + ' ' + bus.wayStations[0].time), // first day or range //
      end = moment(bus.regularDateEnd + ' ' + '23:59'), // last day or range
      daysOfTheWeek = [...new Set(bus.regularDaysOfTheWeek)]; // array with unique numbers - [1,2,3,4,5,6,0]


    daysOfTheWeek.map(async (dayOfTheWeek) => {
      const daysInRange = [];
      const currentDate = start.clone();
      // we start counting from a week ago to take into account the dates in the current week
      const current = currentDate.day(currentDate.day() - 7);

      while (current.day(7 + dayOfTheWeek).isSameOrBefore(end)) {
        // we don't take into account dates that have already passed
        if (current.isSameOrAfter(moment())) {
          // and we work only with future dates
          daysInRange.push(current.clone());
        }
      }

      await daysInRange.map(async (day) => {
        const dayMomentObj = moment(day);
        const dayStr = dayMomentObj.format("YYYY-MM-DD");
        const dayOfDepartureFromTemplate = moment(bus.wayStations[0].date);

        const daysDiff = dayMomentObj.diff(dayOfDepartureFromTemplate, 'days');

        const trip = {
          parentId: bus._id,
          isAvailable: true,
          seatsAvailable: bus.numberOfSeats,
          numberOfSeats: bus.numberOfSeats,
          bookedSeat: [],
          soldSeat: [],
          features: bus?.features,
          name: `${bus?.name} ${dayStr}`,
          fare: bus.fare,
          busNumber: `${bus?.busNumber} ${dayStr} ${bus._id}`, // нельзя, чтобы повторялся
          journeyDate: dayStr, //bus?.journeyDate, // !
          journeyDateObj: dayMomentObj,//bus?.journeyDateObj, //!
          departure_time: bus?.departure_time,
          arrivalDate: bus?.arrivalDate, // !
          arrival_time: bus?.arrival_time,
          carrierBrand: bus?.carrierBrand,
          carrierBus: bus?.carrierBus,
          image: bus?.image,

          createdAt: bus.createdAt,
          updatedAt: bus.updatedAt,
          slug: `${bus.slug}-${dayStr}-${bus._id}`,
          endLocation: bus?.endLocation,
          travel: bus?.travel,
          startLocation: bus?.startLocation,

          type: typeEnumSimpleTrip,
        };

        const wayStations = bus.wayStations.map((station) => {
          return {
            city: station.city,
            station: station.station,
            time: station.time,
            cityId: station.cityId,
            date: moment(station.date).add(daysDiff, 'days').format("YYYY-MM-DD")
          };
        });

        trip.wayStations = wayStations;

        await createTrip({
          ownerauth: bus.owner,
          body: {
            ...trip,
            wayStations: JSON.stringify(wayStations)
          }
        });
      }) // for daysInRange
    }) // for daysOfTheWeek
  } // end if

  return '';
}


async function removeBus(req, res) {
  let bus = req.bus;

  // remove simple trips of regular trip
  if(bus.type === typeEnumRegularTrip) {
    const isRmAllChildren = true;
    await deleteAllChildren(isRmAllChildren, bus._id);
  }

  // remove reserved bus bookings
  Booking.deleteMany({ bus: bus._id }, function(err) {
    if (!err) {
      console.log('All bookings by trip removed');
    }
    else {
      console.log('Removing all bookings by trip - error');
    }
  });

  // remove current trip
  const rmBus = await bus.remove();
  return rmBus;
};


exports.remove = async (req, res) => {
  await removeBus(req, res);
  res.json({ message: "Bus removed successfully" });
}

// body Builder
function prepareBody(body) {
    // decrypt objects and arrays
    if (body?.wayStations) body.wayStations = getWayStations(body.wayStations);
    // set date journey like object (for searching tickets)
    if (body?.journeyDate) body.journeyDateObj = new Date(body.journeyDate);

    return body;
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
