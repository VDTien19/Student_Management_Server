// models/Diligency.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DiligencySchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Đủ điều kiện', 'Cảnh báo', 'Cấm thi'],
    default: 'Đủ điều kiện',
  },
  notes: String,
});

const Diligency = mongoose.model('Diligency', DiligencySchema);
module.exports = Diligency;
