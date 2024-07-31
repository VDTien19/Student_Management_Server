
const Transcript = require('../../Model/Transcript.model')
const Course = require('../../Model/Course.model')
const User = require('../../Model/User.model')
const Semester = require('../../Model/Semester.model')
const { NotFoundError, BadRequestError } = require('../../core/error.response')


const TranscriptController = {
  getAll: async (req, res) => {
    const transcripts = await Transcript.find({ deleted: false })
      .populate({
        path: 'student',
        populate: {
          path: 'majorId',
          select: 'name'
        }
      })
      .populate({
        path: 'semester'
      })

    if (!transcripts) {
      throw new NotFoundError('No transcript found')
    }

    res.status(200).json({ data: transcripts })
  },

  getById: async (req, res) => {
    const { id } = req.params;
    const transcript = await Transcript.findById(id)
      .populate('grades')
      .populate({
        path: 'semester'
      })
      .populate({
        path: 'student',
        select: 'fullname msv'
      })


    if (!transcript) {
      throw new NotFoundError('No transcript found')
    }
    res.status(200).json({ data: transcript })
  },

  createTranscript: async (req, res) => {
    // const { studentId, courseId, grades } = req.body;
    const { studentId, semesterId } = req.body;
    console.log(studentId);
    console.log(semesterId);


    const semester = await Semester.findById(semesterId)
    if (!semester) {
      throw new NotFoundError('Semester not found')
    }
    const student = await User.findById(studentId)
    console.log(student)
    if (!student) {
      throw new NotFoundError('Student not found')
    }

    const existingTranscript = await Transcript.findOne({ student: studentId, semester: semesterId });

    if (existingTranscript) {
      if (existingTranscript.deleted) {
        return res.status(200).json({
          message: "Transcript was deleted. Do you want to restore it?",
          transcriptId: existingTranscript._id
        });
      } else {
        throw new BadRequestError('Transcript already exists');
      }
    }


    const newTranscript = await Transcript.create({
      student: studentId,
      semester: semesterId,
      deleted: false
    })


    res.status(201).json({ message: "Create success", data: newTranscript })
  },

  updateTranscript: async (req, res) => {
    const { id } = req.params;
    // const { studentId, semesterId, grades } = req.body;
    const { studentId, semesterId } = req.body;

    const semester = await Semester.findById(semesterId)
    if (!semester) {
      throw new BadRequestError('Semester not found')
    }
    const student = await User.findById(studentId)
    if (!student) {
      throw new BadRequestError('Student not found')
    }


    const transcript = await Transcript.findByIdAndUpdate(
      id,
      { student: studentId, semester: semesterId },
      { new: true }
    )

    if (!transcript) {
      throw new NotFoundError('No transcript found')
    }
    res.status(200).json({ message: "Update success", data: transcript })
  },


  deleteTranscript: async (req, res) => {
    const { id } = req.params;
    const transcript = await Transcript.findById(id)
    if (!transcript) {
      throw new NotFoundError('No transcript found')
    }

    if (transcript.deleted) {
      throw new BadRequestError('Deleted transcript')
    }


    transcript.deleted = true;
    await transcript.save()

    res.status(200).json({ message: "Delete success" })
  },

  getTranscriptByStudent: async (req, res) => {
    const { studentId } = req.params;
    const transcripts = await Transcript.find({ student: studentId })
      .populate({
        path: 'grades',
        populate: {
          path: 'course',
          select: 'code name credit'
        },
        select: 'course midScore finalScore averageScore status'
      })
      .populate({
        path: 'semester'
      })
      .exec()

    if (!transcripts) {
      throw new NotFoundError('No transcript found for this student')
    }

    // Tổ chức dữ liệu lại cho frontend
    const allGrades = transcripts.flatMap(transcript => transcript.grades.map(grade => ({
      gradeId: grade._id,
      courseCode: grade.course.code,
      courseName: grade.course.name,
      credit: grade.course.credit,
      midScore: grade.midScore,
      finalScore: grade.finalScore,
      averageScore: grade.averageScore,
      status: grade.status
    })));

    // Lọc các môn học trùng lặp, giữ lại môn có điểm cao nhất hoặc kỳ học gần nhất
    const uniqueGrades = allGrades.reduce((acc, current) => {
      const found = acc.find(item => item.courseCode === current.courseCode);
      console.log(found);
      if (!found) {
        acc.push(current);
      } else if (current.averageScore > found.averageScore) {
        acc = acc.filter(item => item.courseCode !== current.courseCode);
        acc.push(current);
      }
      return acc;
    }, []);

    res.status(200).json({ data: uniqueGrades })
  },

  // lấy bảng điểm theo từng kỳ
  getTranscriptBySemester: async (req, res) => {
    const { studentId, semesterId } = req.params;

    if (!studentId || !semesterId) {
      throw new BadRequestError('Student ID or Semester ID is missing')
    }

    const student = await User.findById(studentId)
    if (!student) {
      throw new NotFoundError('Student not found')
    }

    const semester = await Semester.findById(semesterId)
    if (!semester) {
      throw new NotFoundError('Semester not found')
    }


    const transcripts = await Transcript.find({ student: studentId, semester: semesterId })
      .populate({
        path: 'grades',
        populate: {
          path: 'course',
          select: 'code name credit'
        }
      })
      .exec()

    if (!transcripts) {
      throw new NotFoundError('No transcript found for this student in this semester')
    }

    // Tổ chức dữ liệu lại cho frontend
    //   const allGrades = transcripts.flatMap(transcript => transcript.grades.map(grade => ({
    //     gradeId: grade._id,
    //     courseCode: grade.course.code,
    //     courseName: grade.course.name,
    //     credit: grade.course.credit,
    //     midScore: grade.midScore,
    //     finalScore: grade.finalScore,
    //     averageScore: grade.averageScore,
    //     status: grade.status
    //   })));

    //   res.status(200).json({
    //     transcriptId: transcripts._id,
    //     grades: allGrades
    // });



    // Tổ chức dữ liệu lại cho frontend
    const result = transcripts.map(transcript => ({
      _id: transcript._id,
      grades: transcript.grades.map(grade => ({
        gradeId: grade._id,
        courseCode: grade.course.code,
        courseName: grade.course.name,
        credit: grade.course.credit,
        midScore: grade.midScore,
        finalScore: grade.finalScore,
        averageScore: grade.averageScore,
        status: grade.status,
      })),
    }));

    res.status(200).json({ data: result })
  },

  restoreTranscript: async (req, res) => {
    const { transcriptId } = req.body;

    const transcript = await Transcript.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundError('Transcript not found');
    }

    if (!transcript.deleted) {
      throw new BadRequestError('Transcript is not deleted');
    }

    transcript.deleted = false;
    await transcript.save();

    res.status(200).json({ message: "Transcript restored", data: transcript });

  },

  searchTranscripts: async (req, res) => {
    let { keyword } = req.query;
    keyword = keyword.trim();

    // tìm các user phù hợp với keyword
    const users = await User.find({
      $or: [
        { msv: { $regex: keyword, $options: 'i' } },
        { fullname: { $regex: keyword, $options: 'i' } },
      ],
      deleted: false,
      isAdmin: false
    }).select('_id');


    // tìm các transcript phù h��p với keyword trong các user
    const userIds = users.map(user => user._id);

    const transcriptsByStudent = await Transcript.find({
      student: { $in: userIds },
      deleted: false,
    })
      .populate({
        path: 'grades',
        populate: {
          path: 'course',
          select: 'name'
        },
        select: 'course midScore finalScore averageScore status'
      })
      .populate({
        path: 'semester'
      })
      .populate({
        path: 'student',
      })
      .exec();

    if (!transcriptsByStudent) {
      throw new NotFoundError('No transcript found');
    }

    res.status(200).json({ data: transcriptsByStudent });
  },

}


module.exports = TranscriptController