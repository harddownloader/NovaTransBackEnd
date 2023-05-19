const router = require("express").Router();
const {
  requireSuperAdminSignIn,
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
  .post(requireSuperAdminSignIn, add);

router
  .route("/:id")
  .get(requireSuperAdminSignIn, read)
  .put(requireSuperAdminSignIn, update)
  .delete(requireSuperAdminSignIn, remove);

router.param("id", categoryById);

module.exports = router;
