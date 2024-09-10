const MajorModel = require('../../Model/Major.model');
const FacultyModel = require('../../Model/Faculty.model');
const { BadRequestError, NotFoundError } = require('../../core/error.response');

module.exports = {
  createMajor: async (req, res) => {
    const { name, code, facultyId } = req.body;

    if (!name || !code || !facultyId) {
      return res.status(400).json({ message: 'Please fill name, code, and facultyId' });
    }

    try {
      const existingMajor = await MajorModel.findOne({ code });
      if (existingMajor) {
        return res.status(400).json({ message: 'Major already exists' });
      }

      const faculty = await FacultyModel.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      const newMajor = await MajorModel.create({
        name,
        code,
        faculty: facultyId
      });

      faculty.majors.push(newMajor._id);
      await faculty.save();

      res.status(200).json({ message: 'Create success', data: newMajor });
    } catch (e) {
      console.error('Error in createMajor:', e.message);
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

  updateMajor: async (req, res) => {
    const { id } = req.params;
    const { name, code, facultyId } = req.body;

    try {
      const major = await MajorModel.findById(id);
      if (!major) {
        throw new NotFoundError('Major not found');
      }

      const oldFacultyId = major.faculty.toString();

      const updateData = { name, code };
      if (facultyId) {
        const newFaculty = await FacultyModel.findById(facultyId);
        if (!newFaculty) {
          throw new BadRequestError('Faculty not found');
        }

        const oldFaculty = await FacultyModel.findById(oldFacultyId);
        if (oldFaculty) {
          oldFaculty.majors.pull(id);
          await oldFaculty.save();
        }

        newFaculty.majors.push(id);
        await newFaculty.save();

        updateData.faculty = facultyId;
      }

      const updatedMajor = await MajorModel.findByIdAndUpdate(id, updateData, { new: true });

      res.status(200).json({ message: 'Update success', data: updatedMajor });
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
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
