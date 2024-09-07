import Teacher from "../../Model/Teacher.model";
const FacultyModel = require('../../Model/Faculty.model');
import { NotFoundError } from "../../core/error.response";
const Encrypt = require('../../Utils/encryption');


module.exports = {
  createTeacher: async (req, res) => {
    const { mgv, fullname, facultyId } = req.body;  // Thêm facultyId từ request body
    const hashPassword = await Encrypt.cryptPassword(mgv);
    
    try {
      // Kiểm tra giáo viên đã tồn tại chưa
      const existUser = await Teacher.findOne({ mgv });
      if (existUser) {
        return res.status(400).json({ message: "Teacher already exists" });
      }

      // Kiểm tra khoa có tồn tại không
      const faculty = await FacultyModel.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      // Tạo giáo viên mới
      const newTeacher = await Teacher.create({
        mgv,
        fullname,
        isAdmin: false,
        isGV: true,
        password: hashPassword,
        faculty: facultyId
      });

      // Thêm giáo viên vào khoa
      faculty.teachers.push(newTeacher._id);
      await faculty.save();

      res.status(200).json({ message: "Teacher created successfully", data: newTeacher });
    } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
    }
  },

  getAll: async (req, res) => {
    try {
      // Tìm tất cả giáo viên và populate trường classrooms
      const data = await Teacher.find({})
        .populate({
          path: 'classrooms',
          select: '_id name' // Chọn các trường cần thiết từ lớp học
        });
  
      res.status(200).json({ data: data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error", error: error.message });
    }
  },
  

  getTeacher: async (req, res) => {
    const { teacherId } = req.params;
    try {
        // Tìm giáo viên và populate trường classrooms
        const teacher = await Teacher.findById(teacherId)
            .populate({
                path: 'classrooms',
                select: '_id name' // Chọn các trường cần thiết từ lớp học
            });

        if (!teacher) {
            throw new NotFoundError('Teacher not found');
        }

        res.status(200).json({ data: teacher });
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
  },

  updateTeacher: async (req, res) => {
    const { teacherId } = req.params;
    const { mgv, fullname, facultyId } = req.body;  // Lấy facultyId từ request body
    
    try {
      // Tìm giáo viên cần cập nhật
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Nếu có yêu cầu thay đổi khoa
      if (facultyId) {
        // Kiểm tra khoa mới có tồn tại không
        const newFaculty = await FacultyModel.findById(facultyId);
        if (!newFaculty) {
          return res.status(404).json({ message: "Faculty not found" });
        }

        // Xóa giáo viên khỏi khoa cũ (nếu có)
        const oldFaculty = await FacultyModel.findOne({ teachers: teacherId });
        if (oldFaculty) {
          oldFaculty.teachers.pull(teacherId);
          await oldFaculty.save();
        }

        // Thêm giáo viên vào khoa mới
        newFaculty.teachers.push(teacher._id);
        await newFaculty.save();
      }

      // Cập nhật thông tin khác của giáo viên
      teacher.mgv = mgv || teacher.mgv
      teacher.fullname = fullname || teacher.fullname;
      await teacher.save();

      res.status(200).json({ message: "Teacher updated successfully", data: teacher });
    } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }
}
