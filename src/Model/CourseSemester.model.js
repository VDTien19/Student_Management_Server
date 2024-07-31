const { Schema, model } = require('mongoose');

const courseSemesterSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true }
}, {
  timestamps: true,
  collection: 'course_semesters'
});

const CourseSemester = model('CourseSemester', courseSemesterSchema);

module.exports = CourseSemester;