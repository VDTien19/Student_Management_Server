const express = require('express');
const middlewareControler = require('../MiddleWare/middlewareControler');

const CourseSemesterController = require('../Controller/CourseSemesterController')
const { asyncHandler } = require('../Utils/asyncHandler');
const router = express.Router();

router.post('/add', middlewareControler.verifyTokenIsAdmin, asyncHandler(CourseSemesterController.addCourseToSemester))

router.delete('/',middlewareControler.verifyTokenIsAdmin, asyncHandler(CourseSemesterController.removeCourseFromSemester));

router.get('/:semesterId/courses',middlewareControler.verifyToken, asyncHandler(CourseSemesterController.getCoursesBySemester));

router.get('/:courseId/semesters',middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(CourseSemesterController.getSemestersByCourse));

module.exports = router