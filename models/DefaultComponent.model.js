// models/Component.js

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const defaultComponentSchema = new Schema(
  {
    type: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    htmltag: {
      type: String,
      required: true,
      default: "div",
    },
    name: {
      type: String,
    },
    category: {
      type: String,
    },
    //navbar
    brand: {
      type: Object,
    },
    navLinks: {
      type: Array,
    },
    //other comps
    layout: {
      type: Object,
    },
    bgColor: {
      type: Object,
    },
    text: {
      type: String
    },
    style: {
      type: Object
    },
  },
  {
    timestamps: true,
  }
);

const DefaultComponent = model("DefaultComponent", defaultComponentSchema);

module.exports = DefaultComponent;