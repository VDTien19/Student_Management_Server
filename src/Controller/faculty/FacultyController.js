const Faculty = require('../../Model/Faculty.model');
const MajorModel = require('../../Model/Major.model');
const TeacherModel = require('../../Model/Teacher.model');
const { NotFoundError, BadRequestError } = require('../../core/error.response');
const mongoose = require('mongoose');

module.exports = {
  // Lấy tất cả các khoa
  getAllFaculties: async (req, res) => {
    try {
      const faculties = await Faculty.find({ deleted: false }).populate('teachers majors');
      res.status(200).json({ data: faculties });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Lấy thông tin khoa bằng ID
  getFacultyById: async (req, res) => {
    const id = req.params.id;
    const { includeStudents } = req.query;

    try {
      // Tìm thông tin khoa bằng ID và kiểm tra trạng thái "deleted"
      const faculty = await Faculty.findOne({ _id: id, deleted: false })
        .populate('teachers', 'fullname')  // Lấy thông tin giáo viên thuộc khoa
        .populate('majors', 'name');   // Lấy thông tin chuyên ngành thuộc khoa

      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found or deleted' });
      }

      // Nếu có yêu cầu trả về danh sách sinh viên
      let students = [];
      if (includeStudents === 'true') {
        students = await User.find({ major: { $in: faculty.majors }, deleted: false })
          .select('fullname msv email');  // Chỉ lấy các trường cần thiết
      }

      res.status(200).json({
        data: {
          faculty,
          students: students.length > 0 ? students : 'No students found in this faculty'
        }
      });
    } catch (error) {
      console.error('Error fetching faculty:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Tạo mới một khoa
  createFaculty: async (req, res) => {
    const { name, code, teachers = [], majors = [] } = req.body;

    try {
      // Kiểm tra xem khoa đã tồn tại chưa
      const existingFaculty = await Faculty.findOne({ code, deleted: false });
      if (existingFaculty) {
        return res.status(400).json({ message: 'Faculty already exists' });
      }

      // Kiểm tra tính hợp lệ của các ID giáo viên
      const validTeachers = await TeacherModel.find({ _id: { $in: teachers }, deleted: false });
      if (validTeachers.length !== teachers.length) {
        return res.status(400).json({ message: 'Some teacher IDs are invalid' });
      }

      // Kiểm tra tính hợp lệ của các ID chuyên ngành
      const validMajors = await MajorModel.find({ _id: { $in: majors }, deleted: false });
      if (validMajors.length !== majors.length) {
        return res.status(400).json({ message: 'Some major IDs are invalid' });
      }

      // Tạo khoa mới
      const newFaculty = await Faculty.create({
        name,
        code,
        teachers,
        majors,
        deleted: false
      });

      res.status(201).json({ message: 'Faculty created successfully', data: newFaculty });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Cập nhật khoa
  updateFaculty: async (req, res) => {
    const { id } = req.params;
    const { name, code, teachers, majors } = req.body;

    try {
      // Tìm khoa theo ID
      const faculty = await Faculty.findOne({ _id: id, deleted: false });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      // Cập nhật thông tin khoa
      if (name !== undefined) faculty.name = name;
      if (code !== undefined) faculty.code = code;

      // Kiểm tra tính hợp lệ của danh sách giáo viên
      if (Array.isArray(teachers)) {
        const validTeachers = await TeacherModel.find({ _id: { $in: teachers }, deleted: false });
        if (validTeachers.length !== teachers.length) {
          return res.status(400).json({ message: 'Some teacher IDs are invalid' });
        }
        faculty.teachers = teachers;
      }

      // Kiểm tra tính hợp lệ của danh sách ngành
      if (Array.isArray(majors)) {
        const validMajors = await MajorModel.find({ _id: { $in: majors }, deleted: false });
        if (validMajors.length !== majors.length) {
          return res.status(400).json({ message: 'Some major IDs are invalid' });
        }
        faculty.majors = majors;
      }

      // Lưu khoa sau khi cập nhật
      await faculty.save();

      res.status(200).json({ message: 'Faculty updated successfully', data: faculty });
    } catch (error) {
      console.error('Update Faculty Error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Xóa khoa (xóa mềm)
  deleteFaculty: async (req, res) => {
    const { facultyId } = req.params;

    try {
      const faculty = await Faculty.findOne({ _id: facultyId, deleted: false });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      // Xóa mềm khoa và cập nhật trạng thái xóa cho giáo viên và chuyên ngành liên quan
      faculty.deleted = true;
      await faculty.save();

      // await TeacherModel.updateMany({ faculty: facultyId }, { deleted: true });
      // await MajorModel.updateMany({ faculty: facultyId }, { deleted: true });

      res.status(200).json({ message: 'Faculty and related data deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Khôi phục khoa đã xóa (restore)
  restoreFaculty: async (req, res) => {
    const { facultyId } = req.params;

    try {
      const faculty = await Faculty.findOne({ _id: facultyId, deleted: true });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found or not deleted' });
      }

      // Khôi phục khoa và các liên kết liên quan
      faculty.deleted = false;
      await faculty.save();

      await TeacherModel.updateMany({ faculty: facultyId }, { deleted: false });
      await MajorModel.updateMany({ faculty: facultyId }, { deleted: false });

      res.status(200).json({ message: 'Faculty and related data restored' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Lấy danh sách các khoa đã bị xóa
  getAllDeletedFaculties: async (req, res) => {
    try {
      const deletedFaculties = await Faculty.find({ deleted: true }).populate('teachers majors');
      res.status(200).json({ data: deletedFaculties });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Lấy tất cả các ngành trong khoa
  getMajorsByFaculty: async (req, res) => {
    try {
      const { facultyId } = req.params;
      // Kiểm tra lại facultyId xem có hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({ message: 'Invalid faculty ID' });
      }

      const majors = await MajorModel.find({ faculty: facultyId }).select('_id name');
      console.log("Major: ", majors)
      if (!majors || majors.length === 0) {
        return res.status(404).json({ message: 'No majors found for this faculty' });
      }
      res.status(200).json({ data: majors });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Lấy tất cả các giáo viên trong khoa
  getTeachersByFaculty: async (req, res) => {
    try {
      const { facultyId } = req.params;
      // Kiểm tra lại facultyId xem có hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({ message: 'Invalid faculty ID' });
      }

      const teachers = await TeacherModel.find({ faculty: facultyId }).select('_id fullname mgv');
      if (!teachers || teachers.length === 0) {
        return res.status(404).json({ message: 'No teachers found for this faculty' });
      }
      res.status(200).json({ data: teachers });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};
