const { Schema, model } = require('mongoose');

const TranscriptSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  grades: [{
    type: Schema.Types.ObjectId,
    ref: 'Grade'
  }],
  deleted: {
    type: Boolean,
    default: false,
    required: true
  },
}, {
  timestamps: true,
  collection: 'transcripts'
});

const Transcript = model('Transcript', TranscriptSchema);
module.exports = Transcript;
