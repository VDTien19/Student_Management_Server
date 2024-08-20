const router = require("express").Router();
const ClassroomController = require('../Controller/classRoom/ClassController');
const middlewareControler = require('../MiddleWare/middlewareControler');

const { asyncHandler } = require('../Utils/asyncHandler');

router.get('/getAll', middlewareControler.verifyToken, asyncHandler(ClassroomController.getAllClassrooms));
router.get('/:id', middlewareControler.verifyToken, asyncHandler(ClassroomController.getClassroomById));
router.post('/create', middlewareControler.verifyTokenIsAdmin, asyncHandler(ClassroomController.createClassroom));
router.delete('/delete/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(ClassroomController.deleteClassroom));
router.put('/update/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(ClassroomController.updateClassroom));
router.get('/deleted-classrooms', middlewareControler.verifyTokenIsAdmin, asyncHandler(ClassroomController.getAllDeletedClassrooms));
router.put('/restore/:id', middlewareControler.verifyTokenIsAdmin, asyncHandler(ClassroomController.restoreClassroom));

module.exports = router;
