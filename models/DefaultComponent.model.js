// models/Component.js

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const defaultComponentSchema = new Schema(
  {
    type: {
      type: String,
      lowercase: true,
      trim: true,
    },
    navLinks: {
      type: Array,
    },
    name: {
      type: String,
    },
    category: {
      type: String,
    },
    layout: {
      type: Object,
    },
    bgColor: {
      type: Object,
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
    htmltag: {
      type: String
    },
    src: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const DefaultComponent = model("DefaultComponent", defaultComponentSchema);

module.exports = DefaultComponent;