const { Schema, model} = require("mongoose");



const SemesterModel = new Schema({
  semester: {
    type: String
  },
  group: {
    type: String
  },
  year: {
    type: String
  },
});


const Semester = model('Semester', SemesterModel);
module.exports = Semester