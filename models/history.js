import mongoose from "mongoose";

const history_schema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "id is required"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number must be included"],
  },
  network: {
    type: String,
  },
  request: {
    type: String,
    required: [true, "Request must be included"],
  },
  type: {
    type: String,
    enum: ["airtime", "data"],
  },
  status: {
    type: String,
  },
  // DOP ---> date of purchase
  date_created: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

history_schema.index({ id: 1, type: -1 });
const history = mongoose.model("History", history_schema);
export default history;
