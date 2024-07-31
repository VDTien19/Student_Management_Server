const { Schema, model } = require('mongoose')


const User = new Schema({
  deleted: {
    type: Boolean,
    default: false
  },
  gvcn: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  fullname: String,
  firstName: String,
  lastName: String,
  msv: String,
  password: String,
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major'
  },
  year: String,
  isAdmin: Boolean,
  isGV: Boolean,
  dob: String,
  phone: String,
  email: String,
  gender: String,
  country: String,
  address: String,
  class: String,
  parent: {
    fatherName: String,
    motherName: String,
    fatherJob: String,
    motherJob: String,
    parentPhone: String,
    nation: String,
    presentAddress: String,
    permanentAddress: String
  }
})
const UserModel = model("User", User)
module.exports = UserModel