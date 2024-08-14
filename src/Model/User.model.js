const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  deleted: {
    type: Boolean,
    default: false
  },
  gvcn: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  fullname: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  msv: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  majorIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Major',
    },
  ], // Sử dụng mảng để lưu trữ nhiều ngành học
  year: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  isGV: {
    type: Boolean,
    default: false
  },
  dob: String,
  phone: String,
  email: {
    type: String,
    required: true,  // Yêu cầu phải có khi tạo mới sv
    unique: true  // Đảm bào tính duy nhất
  },
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
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
