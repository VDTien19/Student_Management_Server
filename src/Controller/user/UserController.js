const User = require('../../Model/User.model')
const Teacher = require('../../Model/Teacher.model')

const MajorModel = require('../../Model/Major.model')
const Encrypt = require('../../Utils/encryption')
const { NotFoundError, BadRequestError, DeletedError } = require('../../core/error.response')
const Transcript = require('../../Model/Transcript.model')


module.exports = {
  getAllUser: async (req, res) => {

    const users = await User.find({
      deleted: false,
      isAdmin: false
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
    const id = req.params.id
    try {
      const user = await User.findById(id)
        .populate({
          path: 'gvcn'
        })
        .populate({
          path: 'majorIds'
        })
      if (!user) return res.status(404).json({ message: "User not found" })
      if (user.deleted) {
        return res.status(404).json({ message: "User not exist" })
      }
      const { password, ...rest } = user._doc
      return res.status(200).json({ data: rest })
    }
    catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  createUser: async (req, res) => {
    const { fullname, msv, year, gvcn, gender, className, email, majorIds } = req.body; // Thay đổi majorId thành majorIds
    const hashPassword = await Encrypt.cryptPassword(msv);
  
    const validUser = await User.findOne({ msv: msv });
  
    const teacher = await Teacher.findById(gvcn);
    const majors = await MajorModel.find({ _id: { $in: majorIds } }); // Tìm nhiều ngành
  
    if (validUser && !validUser?.deleted) {
      throw new BadRequestError('Student already exists');
    }
  
    if (validUser?.deleted) {
      throw new BadRequestError('Student deleted, You want to restore student');
    }
  
    if (!teacher) {
      throw new NotFoundError('Teacher not found');
    }
  
    if (majors.length !== majorIds.length) { // Kiểm tra tất cả ngành học có tồn tại
      throw new NotFoundError('One or more majors not found');
    }
  
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
      majorIds: majorIds, // Sử dụng majorIds thay vì majorId
    });
  
    // Thêm sinh viên vào tất cả các ngành
    await MajorModel.updateMany(
      { _id: { $in: majorIds } },
      { $push: { students: newUser._id } }
    );
  
    // Populate thông tin chuyên ngành cho sinh viên mới
    newUser = await User.findById(newUser._id).populate('majorIds');
  
    res.status(200).json({ message: 'Create student success', data: { user: newUser } });
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
  
    const oldStudent = await User.findById(id)
      .populate('majorIds') // Cập nhật populate cho majorIds
      .populate('gvcn');
  
    if (!oldStudent) {
      throw new NotFoundError('Student not found');
    }
  
    if (oldStudent?.deleted) {
      throw new BadRequestError('Student deleted, You want to restore student');
    }
  
    const gvcn = await Teacher.findById(data.gvcn);
    if (!gvcn) {
      throw new NotFoundError('Teacher not found');
    }
  
    const majors = await MajorModel.find({ _id: { $in: data.majorIds } });
    if (majors.length !== data.majorIds.length) {
      throw new NotFoundError('One or more majors not found');
    }
  
    // Cập nhật danh sách sinh viên trong các ngành
    if (oldStudent.majorIds.toString() !== data.majorIds.toString()) {
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
    }
  
    oldStudent.gvcn = data.gvcn;
    oldStudent.majorIds = data.majorIds;
  
    await oldStudent.save();
  
    const student = await User.findById(id)
      .populate('majorIds')
      .populate('gvcn');
  
    const { password, ...rest } = student._doc;
    res.status(200).json({ message: 'Update success', data: rest });
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