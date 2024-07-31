const { Schema, model } = require("mongoose")


const CourseSchema = new Schema({
  deleted: Boolean,
  name: String,
  code: String,
  credit: {
    type: Number,
  },
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major'
  }

}, {
  timestamps: true,
  collection: 'courses'
})


const Course = model("Course", CourseSchema)

module.exports = Course