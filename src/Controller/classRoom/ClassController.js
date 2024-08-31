const Classroom = require('../../Model/Classroom.model');
const Teacher = require('../../Model/Teacher.model');
const { NotFoundError } = require('../../core/error.response');

const ClassroomController = {
  createClassroom: async (req, res) => {
    const { name, gvcn, students, year } = req.body;
    try {
      const existingClassroom = await Classroom.findOne({ name });
      if (existingClassroom) {
        return res.status(400).json({ message: "Classroom already exists" });
      }

      const teacher = await Teacher.findById(gvcn);
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }

      const newClassroom = new Classroom({
        name,
        gvcn: teacher._id,
        students,
        year,
      });

      const savedClassroom = await newClassroom.save();

      teacher.classrooms = savedClassroom._id;
      await teacher.save();

      res.status(201).json(savedClassroom);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  getAllClassrooms: async (req, res) => {
    try {
      const classrooms = await Classroom.find({ deleted: false })
        .populate('gvcn')  // Populate giáo viên
        .populate('students'); // Populate danh sách học sinh
      res.status(200).json(classrooms);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getClassroomById: async (req, res) => {
    try {
      const classroom = await Classroom.findById(req.params.id)
        .populate('gvcn')
        .populate('students');

      if (!classroom || classroom.deleted) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      res.status(200).json(classroom);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  updateClassroom: async (req, res) => {
    const { name, gvcn, students, year } = req.body;
    try {
      if (name) {
        const existingClassroom = await Classroom.findOne({ name });
        if (existingClassroom && existingClassroom._id.toString() !== req.params.id) {
          return res.status(400).json({ message: "Classroom name already exists" });
        }
      }

      let teacher;
      if (gvcn) {
        teacher = await Teacher.findById(gvcn);
        if (!teacher) {
          throw new NotFoundError('Teacher not found');
        }
      }

      const updatedClassroom = await Classroom.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            name,
            gvcn: gvcn || undefined,
            students,
            year,
          }
        },
        { new: true }
      );

      if (!updatedClassroom || updatedClassroom.deleted) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      if (gvcn && teacher) {
        const oldTeacher = await Teacher.findById(updatedClassroom.gvcn);
        if (oldTeacher) {
          oldTeacher.classrooms = null; // Clear previous teacher's reference
          await oldTeacher.save();
        }

        teacher.classrooms = updatedClassroom._id; // Update new teacher's reference
        await teacher.save();
      }

      res.status(200).json(updatedClassroom);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  deleteClassroom: async (req, res) => {
    try {
      const deletedClassroom = await Classroom.findByIdAndUpdate(
        req.params.id,
        { $set: { deleted: true } },
        { new: true }
      );

      if (!deletedClassroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      const teacher = await Teacher.findById(deletedClassroom.gvcn);
      if (teacher) {
        teacher.classrooms = null; // Clear teacher's reference
        await teacher.save();
      }

      res.status(200).json({ message: "Classroom deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  restoreClassroom: async (req, res) => {
    try {
      const restoredClassroom = await Classroom.findByIdAndUpdate(
        req.params.id,
        { $set: { deleted: false } },
        { new: true }
      );

      if (!restoredClassroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      const teacher = await Teacher.findById(restoredClassroom.gvcn);
      if (teacher) {
        teacher.classrooms = restoredClassroom._id; // Restore teacher's reference
        await teacher.save();
      }

      res.status(200).json({ message: "Classroom restored successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAllDeletedClassrooms: async (req, res) => {
    try {
      const deletedClassrooms = await Classroom.find({ deleted: true });
      res.status(200).json(deletedClassrooms);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

module.exports = ClassroomController;
