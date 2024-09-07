const router = require("express").Router()
const FacultyController = require('../Controller/faculty/FacultyController')
const middlewareControler = require('../MiddleWare/middlewareControler')

const { asyncHandler } = require('../Utils/asyncHandler')

router.get('/getAll', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.getAllFaculties));
router.get('/:id', middlewareControler.verifyToken, asyncHandler(FacultyController.getFacultyById));
router.post('/create', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.createFaculty));
router.put('/update/:facultyId', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.updateFaculty));
router.delete('/delete/:facultyId', middlewareControler.verifyTokenIsAdmin, asyncHandler(FacultyController.deleteFaculty));

module.exports = router;