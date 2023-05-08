const mongoose = require('mongoose')
const { Schema, model } = mongoose

const subsectionSchema = new Schema({
  name: {
    type: String,
    default: 'empty subsection',
  },
  components: [{ type: Schema.Types.ObjectId, ref: 'Component', default: [] }],
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
  { timestamps: true }
)

const Section = model('Section', sectionSchema)
module.exports = Section
