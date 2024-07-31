const Course = require('../../Model/Course.model');
const Semester = require('../../Model/Semester.model');
const CourseSemester = require('../../Model/CourseSemester.model');
const { NotFoundError } = require('../../core/error.response');


const CourseSemesterController = {
  // Thêm môn học vào kỳ học
  addCourseToSemester: async (req, res) => {
    const { courseId, semesterId } = req.body;

    console.log("csid:", req.body)
    const course = await Course.findById(courseId);
    const semester = await Semester.findById(semesterId);

    if (!course)
      throw new NotFoundError('Course not found')
    if (!semester)
      throw new NotFoundError('Course not found')

    const courseSemester = await CourseSemester.create({
      courseId: course._id,
      semesterId: semester._id
    });

    res.status(201).json(courseSemester);

  },

  // Xóa môn học khỏi kỳ học
  removeCourseFromSemester: async (req, res) => {
    const { courseId, semesterId } = req.body;

    const courseSemester = await CourseSemester.findOneAndDelete({ courseId, semesterId });
    if (!courseSemester)
      throw new NotFoundError('Course not found in this semester');

    res.json({ message: 'Course removed from semester' });

  },

  // Lấy các môn học theo kỳ học
  getCoursesBySemester: async (req, res) => {
    const { semesterId } = req.params;
    const courseSemesters = await CourseSemester.find({ semesterId })
      .populate('courseId')
      // .populate('semesterId');  // chỉ dùng khi có nhiều k�� học cho môn học

    console.log(courseSemesters);
    res.json(courseSemesters.map(cs => cs.courseId));
  },

  // Lấy các kỳ học theo môn học
  getSemestersByCourse: async (req, res) => {
    const { courseId } = req.params;
    const courseSemesters = await CourseSemester.find({ courseId })
      .populate('semesterId');
    
    console.log(courseSemesters);
    res.json(courseSemesters.map(cs => cs.semesterId));

  }

}

module.exports = CourseSemesterController;
