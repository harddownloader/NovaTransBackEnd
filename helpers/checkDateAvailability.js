const {
  typeEnumRegularTrip,
  typeEnumSimpleTrip,
} = require("../models/Bus");


exports.checkDateAvailability = date => {
  return new Date(date) < new Date() ? false : true;
};


exports.checkSimpleTripDate = (bus) => {
  return Boolean(
    bus.type === typeEnumSimpleTrip &&
    bus?.wayStations &&
    Array.isArray(bus.wayStations) &&
    bus.wayStations.length
  );
}


exports.checkRegularTripDate = (bus) => {
  return Boolean(
    bus.type === typeEnumRegularTrip &&
    bus?.wayStations &&
    Array.isArray(bus.wayStations) &&
    bus.wayStations.length
  );
}


exports.setAvailabilityStatusForSimpleTrips = (bus) => {
  const start = bus.wayStations[0];
  const dateTimeStr = `${start.date}T${start.time}:00`;

  if(!exports.checkDateAvailability(dateTimeStr)) {
    bus.isAvailable = false;
  }

  return bus;
}


exports.setAvailabilityStatusForRegularTrips = (bus) => {
  const dateTimeStr = `${bus.regularDateEnd}T00:00:00`;

  if(!exports.checkDateAvailability(dateTimeStr)) {
    bus.isAvailable = false;
  }

  return bus;
}
