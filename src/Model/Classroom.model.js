const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassroomSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  students: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  year: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const Classroom = mongoose.model('Classroom', ClassroomSchema);
module.exports = Classroom;
