const Diligency = require('../../Model/Diligency.model');
const User = require('../../Model/User.model');
const Semester = require('../../Model/Semester.model');
const Course = require('../../Model/Course.model');
const { NotFoundError, BadRequestError } = require('../../core/error.response');
// const mongoose = require('mongoose');

module.exports = {
  // Lấy thông tin chuyên cần của một sinh viên
  getStudentDiligency: async (req, res) => {
    const { studentId } = req.params;

    try {
        // Kiểm tra xem sinh viên có tồn tại không
        const student = await User.findById(studentId);
        if (!student || student.deleted) {
            return res.status(404).json({ message: 'Student not found or has been deleted' });
        }

        // Lấy tất cả các bản ghi chuyên cần của sinh viên
        const diligenceRecords = await Diligency.find({ studentId }).populate('courseId');

        // Tính số buổi nghỉ và phân nhóm theo ngày
        const groupedRecords = diligenceRecords.reduce((acc, record) => {
            const dateKey = new Date(record.date).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = { date: dateKey, records: [] };
            }
            acc[dateKey].records.push({
                _id: record._id,
                courseId: record.courseId,
                date: record.date,
                notes: record.notes,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            });
            return acc;
        }, {});

        const recordsArray = Object.values(groupedRecords);

        // Tính tổng số buổi nghỉ
        const totalAbsences = diligenceRecords.length;

        // Xác định trạng thái tổng quan dựa trên số buổi nghỉ
        let status = 'Đủ điều kiện';
        if (totalAbsences >= 3 && totalAbsences < 4) {
            status = 'Cảnh báo';
        } else if (totalAbsences >= 4) {
            status = 'Cấm thi';
        }

        res.status(200).json({
            data: {
                studentId,
                totalAbsences,
                status,
                records: recordsArray
            }
        });
    } catch (error) {
        console.error('Error fetching diligence report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Tạo bản ghi chuyên cần mới
  createDiligency: async (req, res) => {
    const { studentId } = req.params; // Lấy studentId từ params
    const { courseId, date, notes } = req.body;

    try {
        // Kiểm tra xem sinh viên có tồn tại và chưa bị xóa
        const student = await User.findById(studentId);
        if (!student || student.deleted) {
            return res.status(404).json({ message: 'Student not found or has been deleted' });
        }

        // Kiểm tra và chuyển đổi semesterId thành ObjectId nếu cần
        // if (!mongoose.Types.ObjectId.isValid(semesterId)) {
        //     return res.status(400).json({ message: 'Invalid semesterId format' });
        // }
        // const semester = await Semester.findById(semesterId);
        // if (!semester) {
        //     return res.status(404).json({ message: 'Semester not found' });
        // }

        // Kiểm tra và chuyển đổi courseId thành ObjectId nếu cần
        // if (!mongoose.Types.ObjectId.isValid(courseId)) {
        //     return res.status(400).json({ message: 'Invalid courseId format' });
        // }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Kiểm tra xem bản ghi đã tồn tại trong học kỳ và môn học
        const existingRecord = await Diligency.findOne({
            studentId,
            // semesterId,
            courseId,
            date
        });

        if (existingRecord) {
            return res.status(400).json({ message: 'Diligency record for this date already exists' });
        }

        // Lấy tất cả các bản ghi chuyên cần của sinh viên trong học kỳ và môn học
        const diligenceRecords = await Diligency.find({
            studentId,
            // semesterId,
            courseId
        });

        // Tính số buổi nghỉ trong học kỳ và môn học
        const absenceCount = diligenceRecords.filter(record => record.date.toDateString() === new Date(date).toDateString()).length + 1;

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
            // semesterId,
            courseId,
            date,
            status,
            notes,
        });

        res.status(201).json({
            message: 'Diligency record created successfully',
            data: newDiligency,
        });
    } catch (error) {
        console.error('Error creating diligence:', error); // In ra lỗi chi tiết
        res.status(500).json({ message: 'Server error', error: error.message });
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
