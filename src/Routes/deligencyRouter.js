const express = require('express');
const router = express.Router();
const DiligenceController = require('../Controller/diligency/DiligencyController');
const middlewareControler = require('../MiddleWare/middlewareControler');

const { asyncHandler } = require('../Utils/asyncHandler');

// Lấy tất cả các bản ghi chuyên cần
router.get('/getAll', middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(DiligenceController.getAllDiligencies));

// Lấy bản ghi chuyên cần của một sinh viên
router.get('/student/:studentId', middlewareControler.verifyToken, asyncHandler(DiligenceController.getStudentDiligency));

// Tạo bản ghi chuyên cần mới
router.post('/create/:studentId', middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(DiligenceController.createDiligency));

// Cập nhật bản ghi chuyên cần
router.put('/update/:id',middlewareControler.verifyTokenIsAdminOrGV, asyncHandler(DiligenceController.updateDiligency));

// Xóa bản ghi chuyên cần
router.delete('/delete/:id',middlewareControler.verifyTokenIsAdmin, asyncHandler(DiligenceController.deleteDiligency));

module.exports = router;