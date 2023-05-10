const { BusSeats } = require('../models/BusSeats');

exports.getAllBusSeats = async (req, res) => {
  const busSeats = await BusSeats.find({});

  res.json(busSeats);
}

exports.getBusSeatsById = async (req, res) => {
  const busSeatsId = req.params.busSeatsId;
  const busSeats = await BusSeats.findOne({_id: busSeatsId});

  if (!busSeats) res.status(404).json({
    error: "Not found"
  })

  res.json(busSeats);
}
