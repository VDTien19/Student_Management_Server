const User = require('../../Model/User.model')
const Teacher = require('../../Model/Teacher.model')
const Classroom = require('../../Model/Classroom.model')

const MajorModel = require('../../Model/Major.model')
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
    const { fullname, msv, year, gvcn, gender, className, email, majorIds } = req.body;
    const hashPassword = await Encrypt.cryptPassword(msv);

    try {
      // Kiểm tra sinh viên đã tồn tại chưa
      const validUser = await User.findOne({ msv });
      if (validUser && !validUser?.deleted) {
        throw new BadRequestError('Student already exists');
      }

      if (validUser?.deleted) {
        throw new BadRequestError('Student deleted, You want to restore student');
      }

      // Tìm giáo viên chủ nhiệm
      const teacher = await Teacher.findById(gvcn);
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }

      // Tìm các chuyên ngành
      const majors = await MajorModel.find({ _id: { $in: majorIds } });
      if (majors.length !== majorIds.length) {
        throw new NotFoundError('One or more majors not found');
      }

      // Kiểm tra xem giáo viên chủ nhiệm có thuộc khoa của các ngành không
      const facultyOfMajors = await FacultyModel.findOne({ majors: { $in: majorIds } });
      const facultyOfTeacher = await FacultyModel.findOne({ teachers: gvcn });

      if (!facultyOfTeacher || !facultyOfMajors || facultyOfTeacher._id.toString() !== facultyOfMajors._id.toString()) {
        throw new BadRequestError('Teacher does not belong to the faculty of the selected majors');
      }

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
        class: className,
        gender,
        email,
        majorIds,
      });

      // Thêm sinh viên vào tất cả các ngành
      await MajorModel.updateMany(
        { _id: { $in: majorIds } },
        { $push: { students: newUser._id } }
      );

      // Thêm sinh viên vào lớp học nếu giáo viên chủ nhiệm có quản lý lớp
      const classroom = await Classroom.findOne({ gvcn: teacher._id });
      if (classroom) {
        classroom.students.push(newUser._id);
        await classroom.save();
      }

      // Populate thông tin chuyên ngành cho sinh viên mới
      newUser = await User.findById(newUser._id).populate('majorIds');

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
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Student not exists' });
    }
    user.deleted = true;
    await user.save();
  
    // Cập nhật tất cả các ngành mà sinh viên đang theo học
    await MajorModel.updateMany(
      { students: id },
      { $pull: { students: id } }
    );
  
    // Cập nhật tất cả các transcript có studentId tương ứng
    await Transcript.updateMany({ student: id }, { deleted: true });
  
    res.status(200).json({ message: 'Delete student success' });
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const oldStudent = await User.findById(id)
            .populate('majorIds')
            .populate('gvcn')
            .session(session);

        if (!oldStudent) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Student not found' });
        }

        if (oldStudent?.deleted) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Student deleted, You want to restore student' });
        }

        // Update GVCN if needed
        if (data.gvcn && oldStudent.gvcn.toString() !== data.gvcn.toString()) {
            const gvcn = await Teacher.findById(data.gvcn).session(session);
            if (!gvcn) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Teacher not found' });
            }

            // Remove student from old class
            const oldClassroom = await Classroom.findOne({ gvcn: oldStudent.gvcn }).session(session);
            if (oldClassroom) {
                oldClassroom.students.pull(id);
                await oldClassroom.save({ session });
            }

            // Add student to new class
            const newClassroom = await Classroom.findOne({ gvcn: data.gvcn }).session(session);
            if (newClassroom) {
                newClassroom.students.push(id);
                await newClassroom.save({ session });
            }

            oldStudent.gvcn = data.gvcn;
        }

        // Update majors if needed
        if (data.majorIds && oldStudent.majorIds.toString() !== data.majorIds.toString()) {
            const majors = await MajorModel.find({ _id: { $in: data.majorIds } }).session(session);
            if (majors.length !== data.majorIds.length) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'One or more majors not found' });
            }

            // Remove student from old majors
            await MajorModel.updateMany(
                { _id: { $in: oldStudent.majorIds } },
                { $pull: { students: id } },
                { session }
            );

            // Add student to new majors
            await MajorModel.updateMany(
                { _id: { $in: data.majorIds } },
                { $push: { students: id } },
                { session }
            );

            oldStudent.majorIds = data.majorIds;
        }

        // Update other fields if provided
        if (data.fullname) oldStudent.fullname = data.fullname;
        if (data.year) oldStudent.year = data.year;
        if (data.className) oldStudent.class = data.className;
        if (data.gender) oldStudent.gender = data.gender;
        if (data.email) oldStudent.email = data.email;

        await oldStudent.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        const student = await User.findById(id)
            .populate('majorIds')
            .populate('gvcn');

        const { password, ...rest } = student._doc;
        res.status(200).json({ message: 'Update success', data: rest });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
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
    const { msv } = req.body
    const user = await User.findOne({ msv: msv })

    console.log(user)
    console.log(user.deleted)


    if (!user) {
      throw new NotFoundError('Student not found')
    }
    if (!user.deleted) {
      throw new BadRequestError("Student not deleted")
    }
    user.deleted = false;
    await user.save()
    res.status(200).json({ message: 'Restore student success' })
  }
}