const Course = require('../../Model/Course.model')
const Encrypt = require('../../Utils/encryption')
const MajorModel = require('../../Model/Major.model')

import { BadRequestError, ConflictError, NotFoundError } from '../../core/error.response'
module.exports = {
  getAllCourse: async (req, res) => {
    const courses = await Course.find({}).populate('majorId')
    res.status(200).json({ message: "Success", data: courses })
  },

  getCourse: async (req, res) => {
    const id = req.params.id
    const course = await Course.findById(id)
    if (!course) {
      throw new BadRequestError('Course not found')
    }
    return res.status(200).json({ message: "Success", data: course })

  },

  createCourse: async (req, res) => {
    const { name, code, credit, majorId } = req.body

    if (!name || !code || !credit || !majorId) {
      throw new BadRequestError('Please fill name, code, credit and majorId')
    }
    
    const validCourse = await Course.findOne({ code: code })
    if (validCourse) {
      throw new BadRequestError('Course already exists')
    }


    let newCourse = await Course.create({
      deleted: false,
      name: name,
      code: code,
      credit: credit,
      majorId: majorId
    })

    const major = await MajorModel.findById(majorId)
    await major.courses.push(newCourse._id)
    await major.save(); 

    // Populate thông tin chuyên ngành khóa học mới
    newCourse = await Course.findById(newCourse._id).populate('majorId');

    res.status(200).json({ message: 'Create course success', data: { course: newCourse } })

  },

  deleteCourse: async (req, res) => {
    const { id } = req.params
  
    // Tìm khóa học theo id
    const course = await Course.findById(id);
    if (!course) {
      throw new ConflictError('Course not found');
    }
  
    // Xóa khóa học
    await Course.findByIdAndDelete(id);
  
    // Tìm chuyên ngành của khóa học để cập nhật danh sách khóa học
    const major = await MajorModel.findById(course.majorId);
    if (major) {
      major.courses = major.courses.filter(courseId => courseId.toString() !== id);
      await major.save();
    }
  
    res.status(200).json({ message: 'Xóa thành công' });
  },
  
  updateCourse: async (req, res) => {
    const id = req.params.id
    const { name, code, credit, majorId } = req.body

    // Tìm khóa học trước khi cập nhật để kiểm tra chuyên ngành cũ
    const oldCourse = await Course.findById(id);
    // tìm chuyên ngành xem có tồn tại không
    const major = await MajorModel.findById(majorId);
    if (!major) {
      throw new NotFoundError('Major not found');
    }

    if (!oldCourse) {
      throw new NotFoundError('Student not found');
    }


    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { name, code, credit, majorId } },
      { new: true }
    ).populate('majorId')


    if (oldCourse.majorId.toString() !== majorId) {
      // Xóa sinh viên khỏi chuyên ngành cũ
      await MajorModel.findByIdAndUpdate(oldCourse.majorId, { $pull: { courses: id } });

      // Thêm sinh viên vào chuyên ngành mới
      await MajorModel.findByIdAndUpdate(majorId, { $push: { courses: id } });
    }


    res.status(200).json({ message: 'Cập nhật thành công', data: course })

  },

}