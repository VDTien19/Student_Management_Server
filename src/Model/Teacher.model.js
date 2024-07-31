const { Schema, model } = require('mongoose')


const TeacherModel = new Schema({
  mgv: String,
  fullname: String,
  password: String,
  isGV: Boolean,
  isAdmin: Boolean,
})

const Teacher = model("Teacher", TeacherModel)
module.exports =  Teacher