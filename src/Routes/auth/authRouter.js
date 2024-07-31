
const express = require('express')
const router = express.Router()

const AuthController = require('../../Controller/auth/AuthController')
const middlewareControler = require('../../MiddleWare/middlewareControler')
const { asyncHandler } = require('../../Utils/asyncHandler')


router.post('/login', asyncHandler(AuthController.login))
router.post('/refresh', asyncHandler(AuthController.requestRefreshToken));
router.get('/validateToken', asyncHandler(AuthController.validateToken));

// router.post('/change-password', middlewareControler.verifyToken, AuthControler.changePassword)

// router.post('/reset-password', AuthControler.resetPassword)

module.exports = router