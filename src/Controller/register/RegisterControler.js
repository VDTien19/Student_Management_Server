import User from '@/Model/User.model'
import Teacher from '@/Model/Teacher.model'
import Semester from '../../Model/Semester.model';
const Course = require('@/Model/Course.model')
module.exports = {
  register: async (req, res) => {
    const { classId, semesterId } = req.body;
    const { id } = req.user;
    console.log(classId)
    try {
      const courseRegister = await Course.findById(classId);
      const user = await User.findById(id);
      if (!courseRegister) {
        return res.status(404).json({ message: 'not found class' });
      }
      const updatedTeacher = await Teacher.findOneAndUpdate(
        { mgv: courseRegister.teacher.toUpperCase() },
        { $push: { 'class.$[elem].students': { student: id } } },
        {
          arrayFilters: [{ 'elem.course': classId }],
          new: true, // Trả về đối tượng giáo viên sau khi đã cập nhật
        }
      )
      const check = user.semesters.filter(item => item.semester == semesterId)
      if (!check) {
        user.semesters.push({ semester: semesterId })
        await user.save();
      }
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $push: { 'semesters.$[elem].courses': { course: classId } } },
        {
          arrayFilters: [{ 'elem.semester': semesterId }],
          new: true,
        }
      )
      return res.status(200).json({ updatedTeacher, updatedUser });
    } catch (error) {
      console.log(error)
      res.status(522).json({ message: JSON.stringify(error) })
    }
  }
}