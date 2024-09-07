const { Schema, model } = require('mongoose');

const FacultySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  teachers: [{
    type: Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  majors: [{
    type: Schema.Types.ObjectId,
    ref: 'Major'
  }]
}, {
  timestamps: true,
  collection: 'faculties'
});

const FacultyModel = model('Faculty', FacultySchema);
module.exports = FacultyModel;
