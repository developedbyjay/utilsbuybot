import mongoose from "mongoose";

const user_schema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: [true, "Users must have a id"],
  },
  email: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  points: {
    type: Number,
    default: 0,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  total_wallet: {
    type: Number,
    default: 0,
  },
  account_name: {
    type: String,
  },
  account_number: {
    type: [Object],
  },
  active: {
    type: Boolean,
    default: false,
  },
  roles: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  unique_key: {
    type: String,
  },
  isBan: {
    type: Boolean,
    default: false,
  },
  referral: {
    type: Number,
  },
  token: {
    type: String,
  },
  count: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

user_schema.index({ id: 1, account_number: 1, email: 1, phone_number: 1 });
const user = mongoose.model("Users", user_schema);
export default user;
