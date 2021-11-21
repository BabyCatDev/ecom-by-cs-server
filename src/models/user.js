const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      max: 40
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      max: 20
    },
    phone: {
      type: String,
      max: 20
    },
    place: {
      type: String,
      max: 150
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is Invalid");
        }
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password cannot contain "Password" !');
        }
      }
    },
    type: {
      type: String,
      default: "online",
      required: true,
      trim: true
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      }
    ],
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

//Hash the plain text password before saving
userSchema.pre("save", async function(next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

//generate token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    {
      _id: user._id.toString()
    },
    process.env.JWT_SECRET
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

//Login username - password
userSchema.statics.findByCredentials = async (username, password) => {
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new Error("Unable to Login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to Login");
  }
  return user;
};

//getPublicProfile
userSchema.methods.toJSON = function() {
  const user = this; //user value gettin' its value from this
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};
// //generatePasswordReset
// userSchema.methods.generatePasswordReset = function () {
//
//   const rng = seedrandom(crypto.randomBytes(64).toString('base64'), { entropy: true });
//   const code = (rng()).toString().substring(3, 9);
//   this.resetPasswordToken = code
//   this.resetPasswordExpires = Date.now() + 3600000 //expires in an hour
// }

//Delete user's Rooms when user is removed
// userSchema.pre('remove', async function (next) {
//   const user = this
//   await Room.deleteMany({ owner: user._id })
//
//   next()
// })

const User = mongoose.model("User", userSchema);

module.exports = User;
