
const Course = require('../../Model/Course.model');
const Grade = require('../../Model/Grade.model');
const Transcript = require('../../Model/Transcript.model');
const UserModel = require('../../Model/User.model');
const { BadRequestError, NotFoundError } = require('../../core/error.response')


module.exports = {
  getAllGrades: async (req, res) => {
    const grades = await Grade.find()
      .populate({
        path: 'course',
      })
    // .populate({
    //   path: 'semester',
    // })

    console.log(grades);

    // if(grades.length == 0) {
    //   return res.status(403).json({message: "Not Found"})
    // }
    res.status(200).json({ "grades": grades });

  },
  getGradeById: async (req, res) => {
    const id = req.params.id;

    const grade = await Grade.findById(id)
      .populate({
        path: 'course',

      })

    console.log(grade)

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    console.log(req.user)
    // Sinh viên chỉ được xem điểm của chính mình
    if ((!req.user.isAdmin && !req.user.isGV) && req.user.id.toString() !== grade.student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ "grades": grade });
  },

  createGrade: async (req, res) => {
    const { courseId, midScore, finalScore, transcriptId } = req.body;

    console.log("courseId::", courseId);

    if (midScore < 0 || midScore > 10) {
      throw new Error('Invalid midScore, value between 0 and 10');
    }

    if (finalScore < 0 || finalScore > 10) {
      throw new Error('Invalid finalScore, value between 0 and 10');
    }

    const transcript = await Transcript.findById(transcriptId)
    if (!transcript) {
      throw new NotFoundError('Transcript not found')
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found')
    }

    const existCourse = await Grade.findOne({ course: courseId, transcript: transcriptId })
    if (existCourse) {
      throw new BadRequestError('Grade of course already exists for semester')
    }

    const newGrade = await Grade.create({ course: courseId, midScore, finalScore, transcript: transcriptId });

    // sau khi create Thì push vào transcript theo id
    transcript.grades.push(newGrade._id);
    await transcript.save();


    res.status(201).json({ message: "Create successfully ", data: newGrade });



  },

  updateGrade: async (req, res) => {

    const { gradeId } = req.params;
    const { midScore, finalScore } = req.body;

    console.log(midScore);
    console.log(finalScore);

    const grade = await Grade.findById(gradeId)


    if (!grade) {
      throw new NotFoundError("Grade not found")
    }

    grade.midScore = midScore;
    grade.finalScore = finalScore;

    await grade.save();

    res.status(201).json({message: 'Update successfully' , data: grade});
  },

  deleteGrade: async (req, res) => {
    const { gradeId } = req.params;
    const grade = await Grade.findByIdAndDelete(gradeId);

    if (!grade) {
      throw new NotFoundError('Grade not found')
    }

    // Cập nhật transcript để gỡ bỏ grade khỏi mảng grades
    await Transcript.updateOne(
      { _id: grade.transcript },
      { $pull: { grades: gradeId } }
    );


    res.status(200).json({ message: "Grade deleted successfully" });
  },

  getGradesByTranscript: async (req, res) => {
    const { transcriptId } = req.params;

    const grades = await Grade.find({ transcript: transcriptId })
      .populate({
        path: 'course',
      })

    if (!grades) {
      throw new NotFoundError('No grade found for this transcript')
    }

    res.status(200).json({ data: grades });
  },


}
