const mongoose = require("mongoose");
const uuidv1 = require("uuid/v1");
const crypto = require("crypto");

const USER_ROLES = {
  OWNER: "owner",
  SUPER_ADMIN: "superadmin"
}

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32
    },
    phone: {
      type: Number,
      max: 999999999999,
      required: true
    },
    isVerified: {
      default: false
    },
    email: {
      type: String,
      trim: true
    },
    hashed_password: {
      type: String,
      required: true
    },
    photo: {
      type: String
    },
    salt: String,
    role: {
      type: String,
      enum: [USER_ROLES.OWNER, USER_ROLES.SUPER_ADMIN],
      default: USER_ROLES.OWNER
    }
  },
  { timestamps: true }
);

// virtual field
ownerSchema
  .virtual("password")
  .set(function(password) {
    // create temporary variable called _password
    this._password = password;
    // generate a timestamp
    this.salt = uuidv1();
    // encryptPassword()
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// methods
ownerSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function(password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  }
};

module.exports = {
  Owner: mongoose.model("Owner", ownerSchema),
  USER_ROLES,
};
