const { Schema, model } = require('mongoose')


const TeacherModel = new Schema({
  mgv: {
    type: String,
    required: true,
    unique: true, // Đảm bảo mgv là duy nhất
  },
  fullname: String,
  password: String,
  isGV: Boolean,
  isAdmin: Boolean,
  classrooms: [{
    type: Schema.Types.ObjectId,
    ref: 'Classroom',
  }],
})

const Teacher = model("Teacher", TeacherModel)
module.exports =  Teacher