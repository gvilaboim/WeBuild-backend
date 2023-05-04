// models/Component.js

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const defaultComponentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    navLinks: {
      type: Array,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    layout: {
      type: Object,
    },
    bgColor: {
      type: Object,
      required: true,
    },
    text: {
      type: String
    },
    border: {
      type: String
    },
    padding: {
      type:String,
    },
    style: {
      type: String
    },
  },
  {
    timestamps: true,
  }
);

const DefaultComponent = model("DefaultComponent", defaultComponentSchema);

module.exports = DefaultComponent;