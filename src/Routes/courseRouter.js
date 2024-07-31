const router = require("express").Router()
const CourseController = require('../Controller/courses/CourseController')
const middlewareControler = require('../MiddleWare/middlewareControler')

const { asyncHandler } = require('../Utils/asyncHandler')

router.get('/getAll', middlewareControler.verifyToken, asyncHandler(CourseController.getAllCourse))
router.get('/:id', middlewareControler.verifyToken, asyncHandler(CourseController.getCourse))
router.post('/add-course', middlewareControler.verifyTokenIsAdmin, asyncHandler(CourseController.createCourse))
router.delete('/delete/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(CourseController.deleteCourse))
router.put('/update/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(CourseController.updateCourse))

// Lấy các kỳ học của môn học
router.get('/:courseId/semesters',middlewareControler.verifyToken, asyncHandler(CourseController.getSemestersByCourse))

module.exports = router