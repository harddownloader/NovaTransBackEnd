const router = require("express").Router();

const {
  bookingById,
  searchBookingById,
  getOwnerBookings,
  changeVerificationStatus,
  postBooking,
  postBookingMulti,
  postSold,
  deleteBooking,
  getAllBookings,
  getAllBookingsByBusId,
} = require("../controllers/booking");

const { checkUserSignIn } = require("../controllers/auth-user");
const {
  requireOwnerSignIn,
  isBookingOwner,
  requireSuperAdminSignIn
} = require("../controllers/auth-owner");
const { busBySlug } = require("../controllers/bus");

router.get("/my", requireOwnerSignIn, getOwnerBookings);
router.get("/all", requireSuperAdminSignIn, getAllBookings);
router.get("/byBusId/:busId", requireOwnerSignIn, getAllBookingsByBusId);

router.post("/sold/:busSlug", requireOwnerSignIn, postSold);
router.post("/book/:busSlug", checkUserSignIn, postBooking);
router.post("/multi-book", checkUserSignIn, postBookingMulti);

router.get('/:bookingId', searchBookingById);
router.patch("/:bookingId", requireOwnerSignIn, changeVerificationStatus);
router.delete("/:bookingId", requireOwnerSignIn, isBookingOwner, deleteBooking);

router.param("busSlug", busBySlug);
router.param("bookingId", bookingById);



module.exports = router;
