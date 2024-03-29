const {
  Booking,
  verificationEnumPayed,
} = require("../models/Booking");
const { Bus } = require("../models/Bus");
const Guest = require("../models/Guest");
const _ = require("lodash");
const { checkIsThisLoggedInUserSuperAdmin } = require("./auth-owner");

exports.bookingById = async (req, res, next, id) => {
  const token = req.headers.authorization;
  let foundOwner = false;
  if (token) foundOwner = await checkIsThisLoggedInUserSuperAdmin(token); // at this moment, foundOwner is false always, cause we use this request from 'client front'

  const bookingRes = Booking.findById(id)
  const booking = (token && foundOwner)
    ? await bookingRes.populate("bus owner guest user")
    : await bookingRes.populate("bus guest user");

  if (!booking) {
    return res.status(400).json({
      error: "booking not found"
    });
  }
  req.booking = booking; // adds booking object in req with booking info
  next();
};

exports.searchBookingById = async (req, res) => {
  res.json(req.booking);
}

exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find({}).populate("bus owner guest user self");

  res.json(bookings);
};

exports.getAllBookingsByBusId = async (req, res) => {
  const bookings = await Booking.find({
    bus: {
      _id: req.params.busId
    }
  });

  res.json(bookings);
}

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
      !req.body?.phone
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
      !req.body?.phone
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

      let user = await Guest.findOne({ phone });

      if (user) {
        user = _.extend(user, bookData);
        await user.save();
        booking.guest = user;
      } else {
        const guest = new Guest({ name, email, phone });
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
  const seats = JSON.parse(req.body)?.seatNumber; // array with strings
  console.warn('here we can have some issues, cause on front side we covert req.body to string');

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
    booking.verification = verificationEnumPayed;

    booking.seatNumber = seatTicket;
    
    await bus.save();
    await booking.save();

    return booking;
  }));

  res.json(allOrders);
};

exports.changeVerificationStatus = async (req, res) => {
  const booking = req.booking;

  if (req.body.verification === verificationEnumPayed) {
    const bus = await Bus.findOne({ slug: booking.bus.slug });
    if (!bus) {
      throw new Error('bus isn\'t found!');
    }

    const currentSeat = await bus.bookedSeat.find((st) => String(st.id) === String(booking._id));
    if (!currentSeat) {
      throw new Error('currentSeat isn\'t found!');
    }

    bus.soldSeat = [
      ...bus.soldSeat,
      currentSeat
    ];
    bus.bookedSeat = [
      ...bus.bookedSeat.filter((st) => String(st.id) !== String(booking._id))
    ];
    await bus.save();
  }

  booking.verification = req.body.verification;

  await booking.save();

  res.json(booking);
};

exports.deleteBooking = async (req, res) => {
  const booking = req.booking;

  const bus = await Bus.findOne({ slug: booking.bus.slug });

  if (booking.verification === verificationEnumPayed) {
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

  bus.seatsAvailable += 1;
  await bus.save();

  res.json(booking);
};
