const { Schema, model} = require('mongoose');

const GradeSchema = new Schema({
  // student: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User',
  //   require: true
  // },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    require: true

  },
  // semester: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'Semester',
  //   require: true

  // },
  midScore: {
    type: Number,
    require: true

  },
  finalScore: {
    type: Number,
    require: true

  },
  averageScore: {
    type: Number,
  },

  status: {
    type: String,
    enum: ['Pass', 'Fail']
  },

  transcript: {
    type: Schema.Types.ObjectId,
    ref: 'Transcript',
    require: true,
    // index: true
  }

}, {
  timestamps: true,
  collection: 'grades'
});

GradeSchema.pre('save', function(next) {
  this.averageScore = parseFloat(this.midScore * 0.3 + this.finalScore * 0.7).toFixed(2);
  this.status = this.averageScore >= 4.0 ? 'Pass' : 'Fail';
  next();
});

const Grade = model('Grade', GradeSchema);
module.exports = Grade;
