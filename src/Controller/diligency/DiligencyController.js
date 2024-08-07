const Diligency = require('../../Model/Diligency.model');
const User = require('../../Model/User.model');
const { NotFoundError, BadRequestError } = require('../../core/error.response');

module.exports = {
  // Lấy thông tin chuyên cần của một sinh viên
  getStudentDiligency: async (req, res) => {
    const { studentId } = req.params;

    try {
      // Kiểm tra xem sinh viên có tồn tại và chưa bị xóa
      const student = await User.findById(studentId);
      if (!student || student.deleted) {
        throw new NotFoundError('Student not found or has been deleted');
      }

      // Lấy tất cả các bản ghi chuyên cần của sinh viên
      const diligenceRecords = await Diligency.find({ studentId }).populate('studentId');

      // Tính tổng số buổi nghỉ
      const totalAbsences = diligenceRecords.length;

      // Xóa trường studentId trong mỗi bản ghi
      const recordsWithoutStudentId = diligenceRecords.map(record => {
        const { studentId, ...rest } = record._doc;
        return rest;
      });

      // Tổ chức dữ liệu theo định dạng yêu cầu
      const response = {
        studentId: student._id,
        fullname: student.fullname,
        totalAbsences,
        records: recordsWithoutStudentId
      };

      res.status(200).json({ data: response });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Tạo bản ghi chuyên cần mới
  createDiligency: async (req, res) => {
    const { studentId } = req.params; // Lấy studentId từ params
    const { date, notes } = req.body;
  
    try {
      // Kiểm tra xem sinh viên có tồn tại và chưa bị xóa
      const student = await User.findById(studentId);
      if (!student || student.deleted) {
        throw new NotFoundError('Student not found or has been deleted');
      }
  
      // Kiểm tra xem đã có bản ghi chuyên cần nào cho ngày này chưa
      const existingDiligency = await Diligency.findOne({ studentId, date });
      if (existingDiligency) {
        return res.status(400).json({ message: 'Diligency record for this date already exists' });
      }
  
      // Lấy tất cả các bản ghi chuyên cần của sinh viên để tính toán số buổi nghỉ
      const diligenceRecords = await Diligency.find({ studentId });
      const absenceCount = diligenceRecords.length + 1; // Cộng thêm 1 cho buổi nghỉ mới
  
      // Xác định trạng thái dựa trên số buổi nghỉ
      let status = 'Đủ điều kiện';
      if (absenceCount >= 3 && absenceCount < 4) {
        status = 'Cảnh báo';
      } else if (absenceCount >= 4) {
        status = 'Cấm thi';
      }
  
      // Tạo bản ghi chuyên cần mới
      const newDiligency = await Diligency.create({
        studentId,
        date,
        status,
        notes,
      });
  
      res.status(201).json({
        message: 'Diligency record created successfully',
        data: newDiligency,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },
  

  // Lấy ra tất cả bản ghi chuyên cần của 1 sinh viên
  // getDiligencyRecords: async (req, res) => {
  //   const { studentId } = req.params;

  //   try {
  //     const records = await Diligency.find({ studentId }).populate('studentId', 'fullname');
  //     if (!records || records.length === 0) {
  //       throw new NotFoundError('No records found for the student');
  //     }

  //     res.status(200).json({ data: records });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Server error', error });
  //   }
  // },
  

  // Cập nhật bản ghi chuyên cần
  updateDiligency: async (req, res) => {
    const { id } = req.params;
    const { date, notes } = req.body;

    try {
      const diligency = await Diligency.findById(id);
      if (!diligency) {
        throw new NotFoundError('Diligency record not found');
      }

      // Cập nhật thông tin ngày và ghi chú
      diligency.date = date || diligency.date;
      diligency.notes = notes || diligency.notes;

      // Tính toán số buổi nghỉ mới sau khi cập nhật
      const diligenceRecords = await Diligency.find({ studentId: diligency.studentId });
      const absenceCount = diligenceRecords.length;

      // Xác định trạng thái dựa trên số buổi nghỉ
      let status = 'Đủ điều kiện';
      if (absenceCount >= 3 && absenceCount < 4) {
        status = 'Cảnh báo';
      } else if (absenceCount >= 4) {
        status = 'Cấm thi';
      }

      diligency.status = status;

      await diligency.save();

      res.status(200).json({ message: 'Diligency record updated successfully', data: diligency });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Xóa bản ghi chuyên cần
  deleteDiligency: async (req, res) => {
    const { id } = req.params;

    try {
      const diligency = await Diligency.findById(id);
      if (!diligency) {
        throw new NotFoundError('Diligency record not found');
      }

      await Diligency.deleteOne({ _id: id });

      res.status(200).json({ message: 'Diligency record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Lấy tất cả các bản ghi chuyên cần
  getAllDiligencies: async (req, res) => {
    try {
      const diligencies = await Diligency.find()
        .populate('studentId', 'fullname msv') // Lấy thông tin tên và mã sinh viên
        .exec();

      if (diligencies.length === 0) {
        throw new NotFoundError('No diligence records found');
      }

      res.status(200).json({ data: diligencies });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },
};
