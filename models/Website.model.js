// models/Website.js

const mongoose = require('mongoose')
const { Schema, model } = mongoose

const Component = require('./Component.model')
const Section = require('./Section.model')

const websiteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    // url: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    navbar: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Component' }],
    },
    sections: {
      type: [Section.schema],
      required: true,
      validate: {
        validator: function (sections) {
          return sections.length >= 2
        },
        message: 'A website must have at least 2 sections',
      },
    },
    footer: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Component' }],
    },
  },
  {
    timestamps: true,
  }
)

const Website = model('Website', websiteSchema)

module.exports = Website