const Booking = require("../models/Booking");
const { Bus } = require("../models/Bus");
const Guest = require("../models/Guest");
const _ = require("lodash");

exports.bookingById = async (req, res, next, id) => {
  const booking = await Booking.findById(id).populate("bus owner guest user");

  if (!booking) {
    return res.status(400).json({
      error: "booking not found"
    });
  }
  req.booking = booking; // adds booking object in req with booking info
  next();
};

exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find({}).populate("bus owner guest user self");

  res.json(bookings);
};

exports.getOwnerBookings = async (req, res) => {
  const bookings = await Booking.find({ owner: req.ownerauth }).populate(
    "bus owner guest user self"
  );

  res.json(bookings);
};

exports.postBooking = async (req, res) => {
  const seats = JSON.parse(req.body?.seatNumber); // array with strings
  const bookData = {...req.body};
  const userauth = req?.userauth;
  const slug = req.bus.slug;

  if (
    !userauth && (
      !req.body?.name ||
      !req.body?.email ||
      !req.body?.phone ||
      !req.body?.address
    )
  ) return res.status(400).json({
    error: "User data isn't correct"
  });

  if (!slug) return res.status(400).json({
    error: "Ticket hasn't slug",
  });

  if (
    !seats?.length ||
    !Array.isArray(seats)
  ) return res.status(400).json({
    error: "Not available"
  });

  
  const bookedTicket = await setNewPostBooking(
    userauth,
    bookData, 
    seats,
    slug
  );  

  res.json(bookedTicket);
};
/**
 * booking tickets by a user/guest
 * @param {*} req 
 * @param {*} res 
 * @returns 
 * body: {
 *  userauth?
 *  
 *  name: 'John',
 *  email: 'john@gmail.com',
 *  phone: 1823673827712,
 *  address: 'Lendersa 8'
 *  tickets: [
 *    {
 *      seats: ['A1', 'A2'],
 *      slug: 'toronto-boston'
 *    }
 *  ]
 * }
 */
exports.postBookingMulti = async (req, res) => {
  const bookData = {...req.body}
  const userauth = req?.userauth
  if (
    !userauth && (
      !req.body?.name ||
      !req.body?.email ||
      !req.body?.phone ||
      !req.body?.address
    )
  ) return res.status(400).json({
    error: "User data isn't correct"
  });

  const tickets = req.body?.tickets;
  if (
    !tickets ||
    !Array.isArray(tickets) ||
    tickets.every((ticket) => Boolean(
      !ticket.seatNumber ||
      !ticket.slug
    ))
  ) return res.status(400).json({
    error: "Uncorrect tickets format",
  });
  

  const allBookedTickets = tickets.map(async (ticket) => {
    const seats = JSON.parse(ticket?.seatNumber); // array with strings
    const slug = ticket?.slug
    if (
      !seats?.length ||
      !Array.isArray(seats)
    ) return res.status(400).json({
      error: "Seats not selected",
    });

    if (!slug) return res.status(400).json({
      error: "Ticket hasn't slug",
    });

    
    const bookedTicket = await setNewPostBooking(
      userauth,
      bookData, 
      seats,
      slug
    );
    return bookedTicket;
  });

  return res.json(allBookedTickets);
}

/**
 * 
 * @param {*} userauth
 * @param {object} bookData 
 * @param {array} seats 
 * @param {string} slug 
 * @returns array
 */
async function setNewPostBooking(userauth, bookData, seats, slug) {
  const allOrders = await Promise.all(seats.map(async (seatTicket) => {
    const booking = new Booking(bookData);
    if (userauth) {
      booking.user = userauth;
    } else {
      const name = bookData.name;
      const email = bookData.email;
      const phone = bookData.phone;
      const address = bookData.address;

      let user = await Guest.findOne({ phone });

      if (user) {
        user = _.extend(user, bookData);
        await user.save();
        booking.guest = user;
      } else {
        const guest = new Guest({ name, email, phone, address });
        await guest.save();
        booking.guest = guest;
      }
    }

    const bus = await Bus.findOne({ slug: slug });
    
    // check
    let isValidSeatNumber = true;
    if (
        typeof seatTicket === 'string' &&
        bus.soldSeat.map(seat => seat.name).includes(seatTicket) ||
        bus.bookedSeat.map(seat => seat.name).includes(seatTicket)
    ) {
      isValidSeatNumber = false;
    }

    if (
      bus.seatsAvailable < (bookData.passengers || booking.passengers) ||
      bus.isAvailable !== true ||
      !isValidSeatNumber
    ) {
      return res.status(400).json({
        error: "Not available"
      });
    }

    bus.seatsAvailable -= bookData.passengers || booking.passengers;

    bus.bookedSeat.push({
      name: seatTicket,
      id: booking._id
    });

    booking.bus = bus;
    booking.owner = bus.owner;

    booking.seatNumber = seatTicket;
    

    await bus.save();
    await booking.save();

    return booking;
  }));

  return allOrders;
}

exports.postSold = async (req, res) => {
  const seats = JSON.parse(req.body?.seatNumber); // array with strings
  if (
    !seats?.length ||
    !Array.isArray(seats)
  ) return res.status(400).json({
    error: "Not available"
  });

  
  const allOrders = await Promise.all(seats.map(async (seatTicket) => {
    const booking = new Booking(req.body);
    booking.self = req.ownerauth;

    const bus = await Bus.findOne({ slug: req.bus.slug });

    // check 
    let isValidSeatNumber = true;
    if (
      typeof seatTicket === 'string' &&
      bus.soldSeat.map(seat => seat.name).includes(seatTicket) ||
      bus.bookedSeat.map(seat => seat.name).includes(seatTicket)
    ) {
      isValidSeatNumber = false;
    }

    if (
      bus.seatsAvailable < booking.passengers ||
      bus.isAvailable !== true ||
      !isValidSeatNumber
    ) {
      return res.status(400).json({
        error: "Not available"
      });
    }

    bus.seatsAvailable -= booking.passengers;

    bus.soldSeat.push({
      name: seatTicket,
      id: booking._id
    });

    booking.bus = bus;
    booking.owner = bus.owner;
    booking.verification = "payed";

    booking.seatNumber = seatTicket;
    
    await bus.save();
    await booking.save();

    return booking;
  }));

  res.json(allOrders);
};

exports.changeVerificationStatus = async (req, res) => {
  const booking = req.booking;

  booking.verification = req.body.verification;

  await booking.save();

  res.json(booking);
};

exports.deleteBooking = async (req, res) => {
  const booking = req.booking;

  const bus = await Bus.findOne({ slug: booking.bus.slug });

  if (booking.verification === "payed") {
    const removeIndexSold = bus.soldSeat
      .map(seat => seat.name.toString())
      .indexOf(booking.seatNumber);

    bus.soldSeat.splice(removeIndexSold, 1);
  } else {
    const removeIndexBook = bus.bookedSeat
      .map(seat => seat.name.toString())
      .indexOf(booking.seatNumber);

    bus.bookedSeat.splice(removeIndexBook, 1);
  }

  await booking.remove();
  await bus.save();

  res.json(booking);
};
