const router = require("express").Router()
const middlewareControler = require('../MiddleWare/middlewareControler')
const TeacherController = require("../Controller/user/TeacherController")

router.get('/getAll',middlewareControler.verifyTokenIsAdminOrGV, TeacherController.getAll)
router.get('/:teacherId', middlewareControler.verifyTokenIsAdminOrGV, TeacherController.getTeacher)
router.post('/create-teacher',middlewareControler.verifyTokenIsAdmin, TeacherController.createTeacher)
router.put('/update/:teacherId', middlewareControler.verifyTokenIsAdmin, TeacherController.updateTeacher)

// Route để lấy tất cả sinh viên mà giáo viên quản lý
router.get('/:teacherId/students', middlewareControler.verifyTokenIsAdminOrGV, TeacherController.getAllStudentsByTeacher);

module.exports = router