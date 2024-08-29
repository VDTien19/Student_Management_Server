const Semester = require("../../Model/Semester.model");
const { NotFoundError, BadRequestError } = require("../../core/error.response");

const SemesterControler = {
  getAll: async (req, res) => {
    const semesters = await Semester.find()
    res.status(200).json({ data: semesters })

  },
  getSemester: async (req, res) => {
    const { id } = req.params;
    const semester = await Semester.findById(id)
    if (!semester) {
      throw new NotFoundError('No semester found')
    }
    res.status(200).json({ data: semester })
  },
  createSemester: async (req, res, next) => {
    const { semester, group, year } = req.body;
    if (!semester ||!group ||!year) {
      throw new BadRequestError('Please fill semester, group and year')
    }
    const validSemester = await Semester.findOne({ semester, group, year })

    console.log(validSemester);

    if (validSemester) {
      throw new BadRequestError('Semester already exists')
    }
    const newSemes = await Semester.create({
      semester, group, year
    })
    res.status(200).json({ message: "Create success", data: newSemes })
  },

  updateSemester: async (req, res, next) => {
    const { id } = req.params;
    const { semester, group, year } = req.body;
    const semesterUpdated = await Semester.findByIdAndUpdate(id, { semester, group, year }, { new: true })
    if (!semesterUpdated) {
      throw new NotFoundError('No semester found')
    }
    res.status(200).json({ message: "Update success", data: semesterUpdated })
  },

  deleteSemester: async (req, res, next) => {
    const { id } = req.params;
    const semesterDeleted = await Semester.findByIdAndDelete(id)
    if (!semesterDeleted) {
      throw new NotFoundError('No semester found')
    }
    res.status(200).json({ message: "Delete success" })
  }

}

module.exports = SemesterControler