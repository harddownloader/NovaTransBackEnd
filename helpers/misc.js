const CronJob = require("cron").CronJob;
const {
  Bus,
} = require("../models/Bus");
const {
  checkSimpleTripDate,
  checkRegularTripDate,
  setAvailabilityStatusForSimpleTrips,
  setAvailabilityStatusForRegularTrips
} = require("./checkDateAvailability");


exports.runEveryMidnight = () => {

  new CronJob(
    "0 0 0 * * *",
    async function() {
      console.log("You will see this message every midnight", new Date());
      const buses = await Bus.find({});

      buses.map(async bus => {
        // check date for simple trips
        if (
          checkSimpleTripDate(bus)
        ) {
          setAvailabilityStatusForSimpleTrips(bus);
           await bus.save();

        // check date for regular trips
        } else if (
          checkRegularTripDate(bus)
        ) {
          setAvailabilityStatusForRegularTrips(bus);
          await bus.save();
        }
      })
    },
    null,
    true,
    "Europe/Kiev" // you need change it after update cron package => "Europe/Kiev" is old name of this timezone, new is "Europe/Kyiv"
  );
};
