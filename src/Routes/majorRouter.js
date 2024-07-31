

const express = require('express')
const router = express.Router()

const MiddlewareController = require('../MiddleWare/middlewareControler');
const MajorController = require('../Controller/Majors/index');
const { asyncHandler } = require('../Utils/asyncHandler')

router.get('/getAll', MiddlewareController.verifyToken, asyncHandler(MajorController.getAllMajor))
router.get('/:id', MiddlewareController.verifyToken, asyncHandler(MajorController.getMajor))
router.post('/create', MiddlewareController.verifyTokenIsAdmin, asyncHandler(MajorController.createMajor))
router.put('/update/:id', MiddlewareController.verifyTokenIsAdmin, asyncHandler(MajorController.updateMajor))
router.delete('/delete/:id', MiddlewareController.verifyTokenIsAdmin, asyncHandler(MajorController.deleteMajor))

module.exports = router