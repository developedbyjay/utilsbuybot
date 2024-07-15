import mongoose from "mongoose";

const networkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Network name is required"],
  },
  id: {
    type: Number,
    unique: true,
    required: [true, "Network ID is required"],
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const network = mongoose.model("Network", networkSchema);
export default network;
