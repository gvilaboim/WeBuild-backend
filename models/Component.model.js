// models/Component.js

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const componentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    layout: {
      type: Object,
      required: true,
    },
    bgColor: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Component = model("Component", componentSchema);

module.exports = Component;