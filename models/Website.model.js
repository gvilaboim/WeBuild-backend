const mongoose = require('mongoose')
const { Schema, model } = mongoose

const Component = require('./Component.model')
const Section = require('./Section.model')

const visitorSchema = new Schema(
  {
    website: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
    },
    location: {
      type: String,
    },
    country: {
      type: String,
    },
    country_code: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const Visitor = model('Visitor', visitorSchema)

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
    visitors: {
      type: [visitorSchema],
      default: [],
    },
    navbar: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Component' }],
    },
    pages: [
      {
        menu: {
          type: String,
          required: true,
        },
        sections: {
          type: [Section.schema],
          required: true,
          validate: {
            validator: function (sections) {
              return sections.length >= 2
            },
            message: `A page must have at least 2 sections`,
          },
        },
      },
    ],
    footer: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Component' }],
    },
    background: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

const Website = model('Website', websiteSchema)

module.exports = { Website, Visitor }
