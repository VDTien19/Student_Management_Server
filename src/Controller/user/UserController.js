const mongoose = require('mongoose')
const User = require('../../Model/User.model')
const Teacher = require('../../Model/Teacher.model')
const Classroom = require('../../Model/Classroom.model')

const MajorModel = require('../../Model/Major.model')
const FacultyModel = require('../../Model/Faculty.model')
const Encrypt = require('../../Utils/encryption')
const { NotFoundError, BadRequestError, DeletedError } = require('../../core/error.response')
const Transcript = require('../../Model/Transcript.model')


module.exports = {
  getAllUser: async (req, res) => {
    try {
      const users = await User.find({
        deleted: false,
        isAdmin: false
      })
        .populate({
          path: 'gvcn',
          populate: {
            path: 'classrooms',
            select: '_id name' // Chọn các trường cần thiết từ lớp học
          }
        })
        .populate({
          path: 'majorIds',
          select: '_id name code'
        });
  
      if (users) {
        const data = users.map(user => {
          const { password, ...rest } = user._doc;
          return rest;
        });
        res.status(200).json({ data: data });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error', error: error.message });
    }
  },
  
  getAllUserDeleted: async (req, res) => {
    const users = await User.find({
      deleted: true
    })
      .populate({
        path: 'gvcn'
      })
      .populate({
        path: 'majorIds'
      })

    if (users) {
      const data = users.map(user => {
        const { password, ...rest } = user._doc
        return rest
      })
      res.status(200).json({ data: data })
    }

  },

  getUser: async (req, res) => {
    const id = req.params.id;
    try {
      const user = await User.findById(id)
        .populate({
          path: 'gvcn',
          populate: {
            path: 'classrooms',
            select: 'name'  // Chọn các trường cần thiết từ lớp học
          }
        })
        .populate({
          path: 'majorIds',
          select: '_id name code'
        });
  
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.deleted) {
        return res.status(404).json({ message: "User not exist" });
      }
  
      const { password, ...rest } = user._doc;
      return res.status(200).json({ data: rest });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  createUser: async (req, res) => {
    const { fullname, msv, year, gvcn, gender, className, email, majorIds, facultyId } = req.body;
    const hashPassword = await Encrypt.cryptPassword(msv);
  
    try {
      // Kiểm tra sinh viên đã tồn tại chưa
      const validUser = await User.findOne({ msv });
      if (validUser && !validUser?.deleted) {
        throw new BadRequestError('Student already exists');
      }
  
      // Tìm khoa
      const faculty = await FacultyModel.findById(facultyId);
      if (!faculty) {
        throw new NotFoundError('Faculty not found');
      }
  
      // Tìm các ngành thuộc khoa đã chọn
      const majors = await MajorModel.find({ _id: { $in: majorIds }, faculty: facultyId });
      if (majors.length !== majorIds.length) {
        throw new NotFoundError('One or more majors not found for this faculty');
      }
  
      // Tìm giáo viên thuộc khoa đã chọn
      const teacher = await Teacher.findOne({ _id: gvcn, faculty: facultyId })
        .populate('classrooms'); // populate để lấy thông tin lớp của giáo viên
      if (!teacher) {
        throw new NotFoundError('Teacher not found for this faculty');
      }
  
      // Kiểm tra giáo viên có quản lý lớp không
      const teacherClassroom = teacher.classrooms ? teacher.classrooms._id : null;
      
      // Tạo mới sinh viên
      let newUser = await User.create({
        deleted: false,
        msv,
        gvcn,
        fullname,
        password: hashPassword,
        year,
        isAdmin: false,
        isGV: false,
        class: className || (teacherClassroom ? teacherClassroom : null), // nếu không có className, lấy lớp của giáo viên
        gender,
        email,
        majorIds,
        faculty: facultyId
      });
  
      // Thêm sinh viên vào tất cả các ngành
      await MajorModel.updateMany(
        { _id: { $in: majorIds } },
        { $push: { students: newUser._id } }
      );
  
      // Nếu giáo viên có lớp, thêm sinh viên vào lớp của giáo viên
      if (teacherClassroom) {
        await Classroom.updateOne(
          { _id: teacherClassroom },
          { $push: { students: newUser._id } }
        );
      }
  
      res.status(200).json({ message: 'Create student success', data: { user: newUser } });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },  

  createAdmin: async (req, res) => {
    // console.log('Request body:', req.body);
    const { msv, password } = req.body;

    const hashPassword = await Encrypt.cryptPassword(password);

    try {
        const newAdmin = await User.create({
            deleted: false,
            msv: msv,
            password: hashPassword,
            isAdmin: true,
            isGV: false,
            fullname: `admin_${msv}`,
            email: `admin_${msv}@example.com`
        });

        // Truy vấn lại để loại bỏ `majorIds`
        const adminData = await User.findById(newAdmin._id).select('-majorIds');

        console.log(adminData);
        res.status(200).json({
            message: 'Tạo admin thành công',
            data: {
                user: adminData
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err });
    }
  },


  deleteUser: async (req, res) => {
    const id = req.params.id;
  
    try {
      // Tìm sinh viên theo ID
      const user = await User.findById(id).populate('faculty');
      if (!user) {
        return res.status(404).json({ message: 'Student not exists' });
      }
  
      // Đánh dấu sinh viên là đã bị xóa
      user.deleted = true;
      await user.save();
  
      // Xóa sinh viên khỏi tất cả các ngành mà họ đã theo học
      await MajorModel.updateMany(
        { students: id },
        { $pull: { students: id } }
      );
  
      // Đánh dấu tất cả các bảng điểm của sinh viên là đã bị xóa
      await Transcript.updateMany(
        { student: id },
        { deleted: true }
      );
  
      // Xóa sinh viên khỏi khoa (faculty)
      if (user.faculty) {
        await FacultyModel.updateOne(
          { _id: user.faculty._id },
          { $pull: { students: id } }
        );
      }
  
      res.status(200).json({ message: 'Delete student success' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    const { id } = req.params;
    const data = req.body
    // const oldStudent = await User.findById(id);
    const user = await User.findById(id).populate('majorId')
    user.parent = {
      fatherName: data.fatherName,
      motherName: data.motherName,
      fatherJob: data.fatherJob,
      motherJob: data.motherJob,
      parentPhone: data.parentPhone,
      nation: data.nation,
      presentAddress: data.presentAddress,
      permanentAddress: data.permanentAddress
    }
    user.fullname = data.fullname
    user.address = data.address
    user.email = data.email
    user.dob = data.dob
    user.phone = data.phone
    user.gender = data.gender
    // user.class = data.class
    // user.majorId = data.majorId
    await user.save();

    const { password, ...rest } = user._doc
    res.status(200).json({ message: 'Update success', data: rest })
  },

  updateStudentByAdmin: async (req, res) => {
    const { id } = req.params;
    const data = req.body;
  
    try {
      // Tìm sinh viên hiện tại và populate các trường quan trọng
      const oldStudent = await User.findById(id)
        .populate('majorIds')
        .populate('gvcn')
        .populate('faculty');
  
      if (!oldStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      if (oldStudent.deleted) {
        return res.status(400).json({ message: 'Student is deleted. You might want to restore the student.' });
      }
  
      // 1. Cập nhật giáo viên chủ nhiệm nếu có thay đổi
      if (data.gvcn && oldStudent.gvcn._id.toString() !== data.gvcn.toString()) {
        const newGvcn = await Teacher.findById(data.gvcn);
        if (!newGvcn) {
          return res.status(404).json({ message: 'Teacher not found' });
        }
  
        if (newGvcn.faculty.toString() === oldStudent.faculty._id.toString()) {
          return res.status(400).json({ message: 'The new homeroom teacher belongs to the same faculty. Please change the faculty or teacher.' });
        }
  
        const oldClassroom = await Classroom.findOne({ gvcn: oldStudent.gvcn._id });
        if (oldClassroom) {
          oldClassroom.students.pull(id);
          await oldClassroom.save();
        }
  
        const newClassroom = await Classroom.findOne({ gvcn: newGvcn._id });
        if (newClassroom) {
          newClassroom.students.push(id);
          await newClassroom.save();
        }
  
        oldStudent.gvcn = newGvcn._id;
      }
  
      // 2. Cập nhật chuyên ngành nếu có thay đổi
      if (data.majorId && JSON.stringify(oldStudent.majorIds.map(major => major._id.toString())) !== JSON.stringify(data.majorId)) {
        const majorIds = data.majorId.map(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid ObjectId format');
          }
          return new mongoose.Types.ObjectId(id);
        });
  
        const majors = await MajorModel.find({ _id: { $in: majorIds } });
        if (majors.length !== data.majorId.length) {
          return res.status(404).json({ message: 'One or more majors not found' });
        }
  
        const majorBelongsToNewFaculty = majors.every(major => major.faculty.toString() === data.facultyId.toString());
        if (!majorBelongsToNewFaculty) {
          return res.status(400).json({ message: 'One or more majors do not belong to the selected faculty.' });
        }
  
        await MajorModel.updateMany(
          { _id: { $in: oldStudent.majorIds } },
          { $pull: { students: id } }
        );
  
        await MajorModel.updateMany(
          { _id: { $in: majorIds } },
          { $push: { students: id } }
        );
  
        oldStudent.majorIds = majorIds;
      }
  
      // 3. Cập nhật khoa nếu có thay đổi
      if (data.facultyId && oldStudent.faculty._id.toString() !== data.facultyId.toString()) {
        const newFaculty = await FacultyModel.findById(data.facultyId);
        if (!newFaculty) {
          return res.status(404).json({ message: 'Faculty not found' });
        }
  
        await FacultyModel.updateOne(
          { _id: oldStudent.faculty._id },
          { $pull: { students: id } }
        );
  
        await FacultyModel.updateOne(
          { _id: data.facultyId },
          { $push: { students: id } }
        );
  
        oldStudent.faculty = data.facultyId;
      }
  
      // 4. Cập nhật các thông tin khác nếu có
      if (data.fullname) oldStudent.fullname = data.fullname;
      if (data.year) oldStudent.year = data.year;
      if (data.className) oldStudent.class = data.className;
      if (data.gender) oldStudent.gender = data.gender;
      if (data.email) oldStudent.email = data.email;
  
      await oldStudent.save();
  
      const student = await User.findById(id)
        .populate('majorIds')
        .populate('gvcn')
        .populate('faculty');
  
      const { password, ...rest } = student._doc;
      res.status(200).json({ message: 'Update success', data: rest });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }, 

  updateGv: async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
      req.body.map((gv) => {
        user.gv.push(gv);
      })
      await user.save();
      res.status(200).json({ message: 'Update success', data: user });
    } catch (error) {
      res.status(500).json({ message: 'error', error: error })
    }
  },

  searchStudents: async (req, res) => {
    let { keyword } = req.query;
    keyword = keyword.trim();
  
    console.log(`Searching ${keyword}`);
  
    // Tìm kiếm các majors phù hợp với keyword
    const majors = await MajorModel.find({
      name: { $regex: keyword, $options: 'i' }
    }).select('_id');
  
    const majorIds = majors.map(major => major._id);
  
    // Tìm kiếm các sinh viên phù hợp với keyword trong các trường của User
    const studentsByKeyword = await User.find({
      $or: [
        { msv: { $regex: keyword, $options: 'i' } },
        { fullname: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
        { class: { $regex: keyword, $options: 'i' } },
      ],
      deleted: false,
      isAdmin: false,
    }).populate({
      path: 'majorIds', // Sử dụng majorIds thay vì majorId
      select: 'name'
    }).collation({ locale: 'vi', strength: 1 });
  
    console.log("student by key: ", studentsByKeyword);
    console.log("-----------------------------------");
  
    // Tìm kiếm các sinh viên theo majorIds
    const studentsByMajor = await User.find({
      majorIds: { $in: majorIds }, // Tìm kiếm theo mảng majorIds
      deleted: false,
      isAdmin: false,
    }).populate({
      path: 'majorIds',
      select: 'name'
    }).collation({ locale: 'vi', strength: 1 });
  
    console.log(studentsByMajor);
  
    // Kết hợp kết quả từ cả hai truy vấn
    const students = [...studentsByKeyword, ...studentsByMajor];
  
    // Loại bỏ các sinh viên trùng lặp
    const uniqueStudents = students.filter((student, index, self) =>
      index === self.findIndex((s) => s._id.toString() === student._id.toString())
    );
  
    if (uniqueStudents.length === 0) {
      throw new NotFoundError('No students found');
    }
  
    res.status(200).json({ data: uniqueStudents });
  },

  restoreUser: async (req, res) => {
    const { msv } = req.body;
  
    try {
      // Tìm sinh viên theo mã số sinh viên
      const user = await User.findOne({ msv });
  
      if (!user) {
        throw new NotFoundError('Student not found');
      }
  
      if (!user.deleted) {
        throw new BadRequestError('Student not deleted');
      }
  
      // Khôi phục sinh viên bằng cách thay đổi thuộc tính deleted
      user.deleted = false;
      await user.save();
  
      // Thêm sinh viên vào tất cả các ngành mà sinh viên đã theo học trước khi bị xóa
      await MajorModel.updateMany(
        { _id: { $in: user.majorIds } },
        { $push: { students: user._id } }
      );
  
      res.status(200).json({ message: 'Restore student success' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },  
}