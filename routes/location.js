const router = require("express").Router();
const {
  requireSuperAdminSignIn,
} = require("../controllers/auth-owner");
const {
  add,
  update,
  read,
  remove,
  getLocations,
  locationById
} = require("../controllers/location");

router
  .route("/")
  .get(getLocations)
  .post(requireSuperAdminSignIn, add);

router
  .route("/:id")
  .get(requireSuperAdminSignIn, read)
  .put(requireSuperAdminSignIn, update)
  .delete(requireSuperAdminSignIn, remove);

router.param("id", locationById);

module.exports = router;
