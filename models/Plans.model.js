const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const plansSchema = new Schema(
  {
    name: {
        type: String,
      },
      category: {
        type: String,
      },
    duration: {
      type: String,
     
    },
    price : {
        type : Number,
    },
    features: {
      type: Object
    },
  },
  {
    timestamps: true,
  }
);

const Plans = model("Plans", plansSchema);

module.exports = Plans;