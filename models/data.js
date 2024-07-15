import mongoose from "mongoose";

const dataPlanSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: [true, "ID is required"],
    },
    dataplan_id: {
      type: String,
      required: [true, "dataplan_id is required"],
    },
    dataplan2_id: {
      type: String,
      required: [true, "dataplan_id is required"],
    },
    network: {
      type: Number,
      required: [true, "Network is required"],
    },
    plan_type: {
      type: String,
      required: [true, "Plan type is required"],
    },
    month_validate: {
      type: String,
      required: [true, "Month validate is required"],
    },
    plan: {
      type: String,
      required: [true, "Plan is required"],
    },
    plan_amount_1: {
      type: String,
      required: [true, "Plan amount is required"],
    },
    plan_amount_2: {
      type: String,
      required: [true, "Plan amount is required"],
    },
    rate: {
      type: Number,
      required: [true, "Rating is required"],
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    plan_network: {
      type: String,
      required: [true, "Network name is required"],
    },
    name: {
      type: String,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

dataPlanSchema.pre("save", async function (next) {
  if (this.plan_type === "CORPORATE GIFTING") this.plan_type = "CG";
  if (this.plan_type === "GIFTING") this.plan_type = "GT";
  this.name = `${this.plan_type}-${this.plan}`;
  next();
});

// dataPlanSchema.pre(/^find/, function (next) {
//   this.find({ isDisabled: { $ne: true } });
//   next();
// });

const dataplans = mongoose.model("dataplans", dataPlanSchema);
export default dataplans;
