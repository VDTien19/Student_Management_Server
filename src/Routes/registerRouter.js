const router = require("express").Router()
const RegisterController = require('../Controller/register/RegisterControler')
const middlewareControler = require('../MiddleWare/middlewareControler')

router.post('/add', middlewareControler.verifyToken, RegisterController.register);

module.exports = router