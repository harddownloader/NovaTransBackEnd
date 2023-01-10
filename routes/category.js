const router = require("express").Router();
const {
  requireSuperadminSignin,
} = require("../controllers/auth-owner");
const {
  add,
  update,
  read,
  remove,
  getCategories,
  categoryById
} = require("../controllers/category");

router
  .route("/")
  .get(getCategories)
  .post(requireSuperadminSignin, add);

router
  .route("/:id")
  .get(requireSuperadminSignin, read)
  .put(requireSuperadminSignin, update)
  .delete(requireSuperadminSignin, remove);

router.param("id", categoryById);

module.exports = router;
