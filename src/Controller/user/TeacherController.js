import Teacher from "../../Model/Teacher.model";
import { NotFoundError } from "../../core/error.response";
const Encrypt = require('../../Utils/encryption');


module.exports = {
  createTeacher: async (req, res) => {
    const { mgv, fullname } = req.body
    const hashPassword = await Encrypt.cryptPassword(mgv)
    try {
      const existUser = await Teacher.findOne({ mgv: mgv })
      if (existUser) {
        return res.status(400).json({ message: "Teacher already exist" });
      }
      const newTeacher = await Teacher.create({
        mgv: mgv,
        fullname: fullname,
        isAdmin: false,
        isGV: true,
        password: hashPassword
      })
      res.status(200).json(newTeacher)
    } catch (e) {
      res.status(500).json({ message: "Error" })
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await Teacher.find({})
      res.status(200).json({ data: data })
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error", error: error })
    }
  },

  getTeacher: async (req, res) => {
    const { teacherId } = req.params;
    console.log(teacherId)
    try {
      const teacher = await Teacher.findById(teacherId)
      if (!teacher) {
        throw new NotFoundError('Teacher not found')
      }
      res.status(200).json({ data: teacher })
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error", error: error })
    }
  },


}
