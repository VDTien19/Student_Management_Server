const router = require("express").Router()
const FacultyController = require('../Controller/faculty/FacultyController')
const middlewareControler = require('../MiddleWare/middlewareControler')

const { asyncHandler } = require('../Utils/asyncHandler')

router.get('/getAll', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.getAllFaculties));
router.get('/:id', middlewareControler.verifyToken, asyncHandler(FacultyController.getFacultyById));
router.post('/create', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.createFaculty));
router.put('/update/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.updateFaculty));
router.delete('/delete/:facultyId', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.deleteFaculty));

// get major by faculty
router.get('/:facultyId/majors', middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(FacultyController.getMajorsByFaculty));
// get teacher by faculty
router.get('/:facultyId/teachers', middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(FacultyController.getTeachersByFaculty));

module.exports = router;