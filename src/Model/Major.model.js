const { Schema, model } = require('mongoose')

const MajorSchema = Schema({
  name: String,
  code: String,
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  courses: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'Faculty',  // Liên kết với khoa
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection:'majors'  // collection name in MongoDB is 'majors' not 'major'
})

const MajorModel = model('Major', MajorSchema)

module.exports = MajorModel