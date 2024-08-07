const { Schema, model } = require('mongoose');

const DiligencySchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // semester: {
  //   type: String,
  //   required: true
  // },
  courseId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Đủ điều kiện', 'Cảnh báo', 'Cấm thi'],
    default: 'Đủ điều kiện'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

const Diligency = model('Diligency', DiligencySchema);
module.exports = Diligency;
