const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const Component = require("./Component.model");

const websiteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String
    },
    category: {
      type: String
    },
    url: {
      type: String
    },
    navbar: {
      type: [Component.schema]
    },
    body: {
      type: [Component.schema]
    },
    footer: {
      type: [Component.schema]
    },
  },
  {
    timestamps: true
  }
);

const Website = model("Website", websiteSchema);

module.exports = Website;