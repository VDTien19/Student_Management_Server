import Teacher from "../../Model/Teacher.model";
const FacultyModel = require('../../Model/Faculty.model');
const Classroom = require('../../Model/Classroom.model');
import { NotFoundError } from "../../core/error.response";
const Encrypt = require('../../Utils/encryption');


module.exports = {
  createTeacher: async (req, res) => {
    const { mgv, fullname, facultyId } = req.body;
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
    const { mgv, fullname, facultyId } = req.body;
    
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

        // Xóa giáo viên khỏi khoa cũ
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
      teacher.mgv = mgv || teacher.mgv;
      teacher.fullname = fullname || teacher.fullname;
      await teacher.save();

      res.status(200).json({ message: "Teacher updated successfully", data: teacher });
    } catch (e) {
      res.status(500).json({ message: "Server error", error: e.message });
    }
  },

  // Lấy tất cả sinh viên mà giáo viên đó quản lý
  getAllStudentsByTeacher: async (req, res) => {
    const { teacherId } = req.params;

    try {
      // Tìm giáo viên
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Tìm lớp học mà giáo viên đó quản lý (gvcn)
      const classroom = await Classroom.findOne({ gvcn: teacherId }).populate('students');

      if (!classroom) {
        return res.status(404).json({ message: 'No classroom found for this teacher' });
      }

      // Trả về danh sách sinh viên trong lớp học
      res.status(200).json({ data: classroom.students });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },


  // Lấy tất cả sinh viên mà giáo viên đó quản lý (1 Gv quản lý nhiều lớp)
  // getAllStudentsByTeacher: async (req, res) => {
  //   const { teacherId } = req.params;

  //   try {
  //     // Tìm giáo viên
  //     const teacher = await Teacher.findById(teacherId);
  //     if (!teacher) {
  //       return res.status(404).json({ message: 'Teacher not found' });
  //     }

  //     // Tìm tất cả các lớp học mà giáo viên đó quản lý (gvcn)
  //     const classrooms = await Classroom.find({ gvcn: teacherId }).populate('students');

  //     if (!classrooms || classrooms.length === 0) {
  //       return res.status(404).json({ message: 'No classrooms found for this teacher' });
  //     }

  //     // Thu thập tất cả sinh viên từ các lớp học
  //     let allStudents = [];
  //     classrooms.forEach(classroom => {
  //       allStudents = allStudents.concat(classroom.students);
  //     });

  //     // Loại bỏ các sinh viên trùng lặp (nếu có)
  //     const uniqueStudents = Array.from(new Set(allStudents.map(student => student._id.toString())))
  //       .map(id => allStudents.find(student => student._id.toString() === id));

  //     res.status(200).json({ data: uniqueStudents });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Server error', error: error.message });
  //   }
  // },
}
