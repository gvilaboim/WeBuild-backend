// models/Subsection.js

const mongoose = require('mongoose')
const { Schema, model } = mongoose
const Component = require('./Component.model')

const subsectionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  components: [{ type: Schema.Types.ObjectId, ref: 'Component' }],
})

const sectionSchema = new Schema(
  {
    name: {
      type: String,
      default: 'empty section',
    },
    renderOrder: Number,
    subsections: [subsectionSchema],
  },
  {
    timestamps: true,
  }
)

const Section = model('Section', sectionSchema)

module.exports = Section
