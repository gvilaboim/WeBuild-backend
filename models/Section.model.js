// models/Section.js

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const sectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    renderOrder: Number,
    subsections: [
      {
        components: [{ type: Schema.Types.ObjectId, ref: "Component" }],
      },
    ],
    numberOfColumns: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Section = model("Section", sectionSchema);

module.exports = Section;