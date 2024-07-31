const AuthRouter = require('./auth/authRouter')
const UserRouter = require('./userRouter')
const CourseRouter = require('./courseRouter')
const SemesterRouter = require('./semesterRouter')
const TeacherRouter = require('./teacherRouter')
const RegisterRouter = require('./registerRouter')
const GradeRouter = require('./gradeRouter')
const CourseToSemesterRouter = require('./CourseToSemesterRouter')
const MajorRouter = require('./majorRouter')
const TranscriptRouter = require('./transcriptRouter')
const initRoute = (app) => {
  app.use('/api/auth', AuthRouter)
  app.use('/api/user', UserRouter)
  app.use('/api/course', CourseRouter)
  app.use('/api/semester', SemesterRouter)
  app.use('/api/teacher', TeacherRouter)
  app.use('/api/register', RegisterRouter)
  app.use('/api/grade', GradeRouter)
  app.use('/api/courseToSemester', CourseToSemesterRouter)
  app.use('/api/major', MajorRouter)
  app.use('/api/transcript', TranscriptRouter)
}

module.exports = initRoute