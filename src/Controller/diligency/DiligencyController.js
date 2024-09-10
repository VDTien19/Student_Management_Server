const Diligency = require('../../Model/Diligency.model');
const User = require('../../Model/User.model');
const Semester = require('../../Model/Semester.model');
const Course = require('../../Model/Course.model');
const { NotFoundError, BadRequestError } = require('../../core/error.response');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

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
      let diligenceRecords = await Diligency.find({ studentId }).populate('courseId');
  
      // Lọc ra các bản ghi có courseId không hợp lệ
      diligenceRecords = diligenceRecords.filter(record => {
        if (mongoose.Types.ObjectId.isValid(record.courseId._id)) {
          return true;
        } else {
          console.error('Invalid courseId in record:', record);
          return false;
        }
      });
  
      // Tính số buổi nghỉ cho từng môn học
      const courseAbsences = diligenceRecords.reduce((acc, record) => {
        const courseKey = record.courseId._id.toString();
        if (!acc[courseKey]) {
          acc[courseKey] = {
            courseId: record.courseId,
            absenceCount: 0,
            records: []
          };
        }
        acc[courseKey].absenceCount += 1; // Tính số buổi nghỉ của từng môn học
        acc[courseKey].records.push({
          _id: record._id,
          date: record.date,
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        });
        return acc;
      }, {});
  
      const coursesArray = Object.values(courseAbsences);
  
      // Xác định trạng thái của từng môn học dựa trên số buổi nghỉ
      coursesArray.forEach(course => {
        if (course.absenceCount >= 3 && course.absenceCount < 4) {
          course.status = 'Cảnh báo';
        } else if (course.absenceCount >= 4) {
          course.status = 'Cấm thi';
        } else {
          course.status = 'Đủ điều kiện';
        }
      });
  
      res.status(200).json({
        data: {
          studentId,
          courses: coursesArray // Trả về danh sách môn học kèm trạng thái
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

        // Kiểm tra và chuyển đổi courseId thành ObjectId nếu cần
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Kiểm tra xem bản ghi chuyên cần đã tồn tại cho sinh viên và môn học vào ngày này chưa
        const existingRecord = await Diligency.findOne({
            studentId,
            courseId,
            date
        });

        if (existingRecord) {
            return res.status(400).json({ message: 'Diligency record for this date already exists' });
        }

        // Lấy tất cả các bản ghi chuyên cần của sinh viên trong môn học cụ thể này
        const diligenceRecordsForCourse = await Diligency.find({
            studentId,
            courseId
        });

        // Tính số buổi nghỉ trong môn học cụ thể này
        const absenceCountForCourse = diligenceRecordsForCourse.length + 1; // +1 for the new record

        // Xác định trạng thái dựa trên số buổi nghỉ của từng môn học
        let status = 'Đủ điều kiện';
        if (absenceCountForCourse >= 3 && absenceCountForCourse < 4) {
            status = 'Cảnh báo';
        } else if (absenceCountForCourse >= 4) {
            status = 'Cấm thi';
        }

        // Tạo bản ghi chuyên cần mới
        const newDiligency = await Diligency.create({
            studentId,
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

      // Lấy tất cả các bản ghi chuyên cần của sinh viên trong cùng một môn học
      const diligenceRecordsForCourse = await Diligency.find({
        studentId: diligency.studentId,
        courseId: diligency.courseId,
      });

      // Tính số buổi nghỉ trong môn học cụ thể này
      const absenceCountForCourse = diligenceRecordsForCourse.length;

      // Xác định trạng thái dựa trên số buổi nghỉ của từng môn học
      let status = 'Đủ điều kiện';
      if (absenceCountForCourse >= 3 && absenceCountForCourse < 4) {
        status = 'Cảnh báo';
      } else if (absenceCountForCourse >= 4) {
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
