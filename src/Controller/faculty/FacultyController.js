const Faculty = require('../../Model/Faculty.model');
const { NotFoundError, BadRequestError } = require('../../core/error.response');

module.exports = {
  // Lấy tất cả các khoa
  getAllFaculties: async (req, res) => {
    try {
      const faculties = await Faculty.find().populate('teachers majors');
      res.status(200).json({ data: faculties });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Lấy thông tin khoa bằng ID
  getFacultyById: async (req, res) => {
    const id = req.params.id;
    const { includeStudents } = req.query; // Tùy chọn để lấy danh sách sinh viên (query parameter)

    try {
      // Tìm thông tin khoa bằng ID
      const faculty = await Faculty.findById(id)
        .populate('teachers', 'fullname')  // Lấy thông tin giáo viên thuộc khoa
        .populate('majors', 'name');   // Lấy thông tin chuyên ngành thuộc khoa

      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      // Nếu có yêu cầu trả về danh sách sinh viên (includeStudents=true)
      let students = [];
      if (includeStudents === 'true') {
        students = await User.find({ major: { $in: faculty.majors } }) // Tìm sinh viên thuộc các chuyên ngành của khoa
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
      const existingFaculty = await Faculty.findOne({ code });
      if (existingFaculty) {
        return res.status(400).json({ message: 'Faculty already exists' });
      }

      // Tạo khoa mới
      const newFaculty = await Faculty.create({
        name,
        code,
        teachers,
        majors
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
      const faculty = await Faculty.findById(id);
      if (!faculty) {
        throw new NotFoundError('Faculty not found');
      }

      // Cập nhật thông tin khoa
      faculty.name = name || faculty.name;
      faculty.code = code || faculty.code;
      faculty.teachers = teachers || faculty.teachers;
      faculty.majors = majors || faculty.majors;

      await faculty.save();

      res.status(200).json({ message: 'Faculty updated successfully', data: faculty });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Xóa khoa
  deleteFaculty: async (req, res) => {
    const { id } = req.params;

    try {
      const faculty = await Faculty.findById(id);
      if (!faculty) {
        throw new NotFoundError('Faculty not found');
      }

      await Faculty.deleteOne({ _id: id });

      res.status(200).json({ message: 'Faculty deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },
};
