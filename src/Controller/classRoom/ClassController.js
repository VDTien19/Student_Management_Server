const Classroom = require('../../Model/Classroom.model');
const Teacher = require('../../Model/Teacher.model')

const ClassroomController = {
    // Tạo mới một lớp học
    createClassroom: async (req, res) => {
        const { name, gvcn, students, year } = req.body;
        
        try {
            // Kiểm tra xem lớp học với tên đã cho có tồn tại không
            const existingClassroom = await Classroom.findOne({ name });
            if (existingClassroom) {
                return res.status(400).json({ message: "Classroom already exists" });
            }

            const teacher = await Teacher.findById(gvcn);
            if (!teacher) {
                throw new NotFoundError('Teacher not found');
            }
    
            // Tạo mới lớp học
            const newClassroom = new Classroom({
                name,
                gvcn: teacher._id,
                students,
                year,
            });
    
            // Lưu lớp học mới
            const savedClassroom = await newClassroom.save();
    
            // Cập nhật giáo viên để bao gồm lớp học mới
            teacher.classrooms.push(savedClassroom._id);
            await teacher.save();
    
            res.status(201).json(savedClassroom);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },    

    // Lấy danh sách tất cả các lớp học
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

    // Lấy thông tin chi tiết của một lớp học
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

    // Cập nhật thông tin của lớp học
    updateClassroom: async (req, res) => {
        try {
            const updatedClassroom = await Classroom.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            );

            if (!updatedClassroom || updatedClassroom.deleted) {
                return res.status(404).json({ message: "Classroom not found" });
            }

            res.status(200).json(updatedClassroom);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    },

    // Xóa mềm lớp học (soft delete)
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

            res.status(200).json({ message: "Classroom deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    },

    // Khôi phục lớp học bị xóa mềm
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

            res.status(200).json({ message: "Classroom restored successfully" });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    },
    // Lấy danh sách các lớp học đã bị xóa mềm
    getAllDeletedClassrooms: async (req, res) => {
        try {
            const deletedClassrooms = await Classroom.find({ deleted: true })
            res.status(200).json(deletedClassrooms);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    },
};

module.exports = ClassroomController;
