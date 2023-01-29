const { BusesSeats } = require("./../../models/BusesSeats");

// if we don't know the number of rows
// p.s. useful function for future
function getNumberOfRows(config) {
  let rows = Math.floor(config.seatsCount / config.countSeatsInRow);
  const remainder = config.seatsCount % config.countSeatsInRow;

  if ( remainder !== 0 ) {
    rows += 1;
  }

  return rows + config.additionalRowsForBusElements;
}

async function createStarterTemplate() {
  const starterConfig = {
    seatsCount: 59,
    countBlocksInRow: 6,
    countSeatsInRow: 4,
    rows: 18,
    countFreeSeatsInRow: 2,
    busElements: {
      driverCoordinates: 0,
      firstDoorCoordinates: 4,
      secondDoorCoordinates: 46,
      wcCoordinates: 40,
      barCoordinates: 52,
    },
    seatsForBusElements: 8, // the number is put down by the selection method
    additionalRowsForBusElements: 3, // this is the number of additional rows to place the bus elements
  };

  const allFreeSeats = starterConfig.rows * starterConfig.countFreeSeatsInRow;
  const allBlocksCount = starterConfig.seatsCount + allFreeSeats + starterConfig.seatsForBusElements;
  starterConfig.allBlocksCount = allBlocksCount;

  const newBusesSeats = new BusesSeats(starterConfig);

  const savedBusesSeats = await newBusesSeats.save();

  return savedBusesSeats;
}

module.exports = {
  createStarterTemplate,
}
