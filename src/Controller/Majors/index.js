const MajorModel = require('../../Model/Major.model');
const FacultyModel = require('../../Model/Faculty.model');
const { BadRequestError, NotFoundError } = require('../../core/error.response');

module.exports = {
  createMajor: async (req, res) => {
    const { name, code, facultyId } = req.body;

    // Kiểm tra tất cả các thông tin cần thiết
    if (!name || !code || !facultyId) {
      return res.status(400).json({ message: 'Please fill name, code, and facultyId' });
    }

    try {
      // Kiểm tra xem chuyên ngành đã tồn tại chưa
      const existingMajor = await MajorModel.findOne({ code });
      if (existingMajor) {
        return res.status(400).json({ message: 'Major already exists' });
      }

      // Kiểm tra khoa có tồn tại không
      const faculty = await FacultyModel.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      // Tạo chuyên ngành mới
      const newMajor = await MajorModel.create({
        name,
        code,
        faculty: facultyId
      });

      // Thêm chuyên ngành vào danh sách chuyên ngành của khoa
      faculty.majors.push(newMajor._id);
      await faculty.save();

      res.status(200).json({ message: 'Create success', data: newMajor });
    } catch (e) {
      console.error('Error in createMajor:', e.message); // Log lỗi để kiểm tra
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  },

  // Các phương thức khác không thay đổi
  getAllMajor: async (req, res, next) => {
    const major = await MajorModel.find({});

    if (!major) {
      throw new NotFoundError('Major not found');
    }
    res.status(200).json({ message: 'Success', data: major });
  },

  getMajor: async (req, res, next) => {
    const { id } = req.params;
    const major = await MajorModel.findById(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }
    res.status(200).json({ data: major });
  },

  updateMajor: async (req, res, next) => {
    const { id } = req.params;
    const { name, code, facultyId } = req.body;

    // Tìm và cập nhật thông tin chuyên ngành
    const major = await MajorModel.findById(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }

    const oldFacultyId = major.faculty.toString(); // Lưu lại khoa cũ

    // Cập nhật thông tin chuyên ngành
    const updateData = { name, code };
    if (facultyId) {
      // Kiểm tra khoa mới có tồn tại không
      const newFaculty = await FacultyModel.findById(facultyId);
      if (!newFaculty) {
        throw new BadRequestError('Faculty not found');
      }

      // Xóa chuyên ngành khỏi danh sách chuyên ngành của khoa cũ
      const oldFaculty = await FacultyModel.findById(oldFacultyId);
      if (oldFaculty) {
        oldFaculty.majors.pull(id);
        await oldFaculty.save();
      }

      // Thêm chuyên ngành vào danh sách chuyên ngành của khoa mới
      newFaculty.majors.push(id);
      await newFaculty.save();

      updateData.faculty = facultyId;
    }

    // Cập nhật chuyên ngành
    const updatedMajor = await MajorModel.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ message: 'Update success', data: updatedMajor });
  },

  deleteMajor: async (req, res, next) => {
    const { id } = req.params;
    const major = await MajorModel.findByIdAndDelete(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }

    // Xóa chuyên ngành khỏi danh sách chuyên ngành của khoa liên kết
    const faculty = await FacultyModel.findById(major.faculty);
    if (faculty) {
      faculty.majors.pull(id);
      await faculty.save();
    }

    res.status(200).json({ message: 'Delete success' });
  }
};
