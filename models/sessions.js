import mongoose from "mongoose";

const sessions_schema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: [true, "SESSION ID IS REQUIRED"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

sessions_schema.index({ id: 1 });
const sessions = mongoose.model("Sessions", sessions_schema);
export default sessions;
