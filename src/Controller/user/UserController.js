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
        // Kiểm tra xem sinh viên đã tồn tại hay chưa
        const validUser = await User.findOne({ msv: msv });
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
  
        // Tạo mới sinh viên
        let newUser = await User.create({
            deleted: false,
            msv: msv,
            gvcn: gvcn,
            fullname: fullname,
            password: hashPassword,
            year: year,
            isAdmin: false,
            isGV: false,
            class: className,
            gender: gender,
            email: email,
            majorIds: majorIds,
        });
  
        // Thêm sinh viên vào tất cả các ngành
        await MajorModel.updateMany(
            { _id: { $in: majorIds } },
            { $push: { students: newUser._id } }
        );
  
        // Tìm lớp học mà giáo viên chủ nhiệm quản lý
        const classroom = await Classroom.findOne({ gvcn: teacher._id });
        if (classroom) {
            // Thêm sinh viên vào lớp học
            classroom.students.push(newUser._id);
            await classroom.save();
        } else {
            console.warn(`Teacher ${teacher.fullname} does not manage any classroom.`);
        }
  
        // Populate thông tin chuyên ngành cho sinh viên mới
        newUser = await User.findById(newUser._id).populate('majorIds');
  
        res.status(200).json({ message: 'Create student success', data: { user: newUser } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  },


  createAdmin: async (req, res) => {
    console.log('Request body:', req.body);
    const { msv, password } = req.body;
    const hashPassword = await Encrypt.cryptPassword(password)
    try {
      const newAdmin = await User.create({
        deleted: false,
        msv: msv,
        password: hashPassword,
        isAdmin: true,
        isGV: false,
        fullname: 'admin'
        // Các trường khác có thể được thêm vào nếu cần
      });

      console.log(newAdmin);
      const { password, ...rest } = newAdmin._doc
      // Trả về msv và password trong phản hồi
      res.status(200).json({
        message: 'Tạo admin thành công',
        data: {
          user: rest

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

    try {
        const oldStudent = await User.findById(id)
            .populate('majorIds')
            .populate('gvcn');

        if (!oldStudent) {
            throw new NotFoundError('Student not found');
        }

        if (oldStudent?.deleted) {
            throw new BadRequestError('Student deleted, You want to restore student');
        }

        // Cập nhật thông tin giáo viên chủ nhiệm nếu cần thiết
        if (data.gvcn && oldStudent.gvcn.toString() !== data.gvcn.toString()) {
            const gvcn = await Teacher.findById(data.gvcn);
            if (!gvcn) {
                throw new NotFoundError('Teacher not found');
            }

            // Xóa sinh viên khỏi lớp học cũ của giáo viên cũ
            const oldClassroom = await Classroom.findOne({ gvcn: oldStudent.gvcn });
            if (oldClassroom) {
                oldClassroom.students.pull(id);
                await oldClassroom.save();
            }

            // Thêm sinh viên vào lớp học mới của giáo viên mới
            const newClassroom = await Classroom.findOne({ gvcn: data.gvcn });
            if (newClassroom) {
                newClassroom.students.push(id);
                await newClassroom.save();
            }

            oldStudent.gvcn = data.gvcn;
        }

        // Cập nhật danh sách chuyên ngành nếu cần thiết
        if (data.majorIds && oldStudent.majorIds.toString() !== data.majorIds.toString()) {
            const majors = await MajorModel.find({ _id: { $in: data.majorIds } });
            if (majors.length !== data.majorIds.length) {
                throw new NotFoundError('One or more majors not found');
            }

            // Xóa sinh viên khỏi chuyên ngành cũ
            await MajorModel.updateMany(
                { _id: { $in: oldStudent.majorIds } },
                { $pull: { students: id } }
            );

            // Thêm sinh viên vào các chuyên ngành mới
            await MajorModel.updateMany(
                { _id: { $in: data.majorIds } },
                { $push: { students: id } }
            );

            oldStudent.majorIds = data.majorIds;
        }

        // Cập nhật các thông tin khác nếu có
        if (data.fullname) oldStudent.fullname = data.fullname;
        if (data.year) oldStudent.year = data.year;
        if (data.className) oldStudent.class = data.className;
        if (data.gender) oldStudent.gender = data.gender;
        if (data.email) oldStudent.email = data.email;

        await oldStudent.save();

        const student = await User.findById(id)
            .populate('majorIds')
            .populate('gvcn');

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
    const { keyword } = req.body;
  
    try {
      const user = await User.findOne({ msv: keyword });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ data: user });
    } catch (error) {
      res.status(500).json({ message: 'Error', error: error.message });
    }
  },
  
  getProfile: async (req, res) => {
    try {
      // `req.userId` được gán trong middleware sau khi xác thực token
      const userId = req.userId;

      // Tìm người dùng dựa trên userId
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Trả về thông tin người dùng, ngoại trừ password
      res.status(200).json({
        name: user.name,
        email: user.email,
        msv: user.msv,
        profilePicture: user.profilePicture || null,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: 'Server error' });
    }
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