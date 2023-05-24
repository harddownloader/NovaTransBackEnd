const Guest = require("../models/Guest");
const mongoose = require("mongoose");

exports.getAllGuests = async (req, res) => {
  const guests = await Guest.find().sort({ created: -1 }).select("name email phone createdAt updatedAt");

  res.json(guests);
};

/*
* it gets guest ids array
* return array of guests
* */
exports.getGuestsByIds = async (req, res) => {
  const ids = JSON.parse(req.params.ids);

  const guests = await Guest.find({
    "_id": { $in: [
        ...ids.map((id) => mongoose.Types.ObjectId(id))
      ]}
  });

  res.json(guests);
}
