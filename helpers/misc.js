const CronJob = require("cron").CronJob;
const {
  Bus,
  typeEnumRegularTrip,
  typeEnumSimpleTrip,
} = require("../models/Bus");

exports.checkDateAvailability = date => {
  if (new Date(date) < new Date()) {
    return false;
  } else {
    return true;
  }
};

exports.runEveryMidnight = () => {

  new CronJob(
    "0 0 0 * * *",
    async function() {
      console.log("You will see this message every midnight", new Date());
      const buses = await Bus.find({});

      buses.map(async bus => {
        // check date for simple trips
        if (
           bus.type === typeEnumSimpleTrip &&
           bus?.wayStations &&
           Array.isArray(bus.wayStations) &&
           bus.wayStations.length
        ) {
           const start = bus.wayStations[0]
           const dateTimeStr = `${start.date}T${start.time}:00`

           if(!exports.checkDateAvailability(dateTimeStr)) {
             bus.isAvailable = false;
           }
           await bus.save();

        // check date for regular trips
        } else if (
           bus.type === typeEnumRegularTrip &&
           bus?.wayStations &&
           Array.isArray(bus.wayStations) &&
           bus.wayStations.length
        ) {
          const end = bus.wayStations[bus.wayStations.length - 1]
          const dateTimeStr = `${end.date}T${end.time}:00`

          if(!exports.checkDateAvailability(dateTimeStr)) {
            bus.isAvailable = false;
          }
          await bus.save();
        }
      })
    },
    null,
    true,
    "Europe/Kiev" // you need change it after update cron package => "Europe/Kiev" is old name of this timezone, new is "Europe/Kyiv"
  );
};
