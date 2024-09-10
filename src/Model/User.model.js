const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  deleted: {
    type: Boolean,
    default: false,
  },
  gvcn: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: function() {
      return !this.isAdmin; // gvcn is required if the user is not an admin
    }
  },
  fullname: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  msv: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'Faculty',
    // required: function() {
    //   return !this.isAdmin;  // Faculty is required for students, not admins or teachers
    // }
  },
  majorIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Major',
  }], // Array to store multiple majors
  year: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isGV: {
    type: Boolean,
    default: false,
  },
  dob: String,
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{10,15}$/.test(v); // Regex to validate phone numbers
      },
      message: props => `${props.value} is not a valid phone number!`
    },
  },
  email: {
    type: String,
    required: function() {
      return !this.isAdmin; // Email is required if the user is not an admin
    },
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Regex to validate email format
      },
      message: props => `${props.value} is not a valid email!`
    },
  },
  gender: String,
  country: String,
  address: String,
  className: String, // Renamed from `class`
  parent: {
    fatherName: String,
    motherName: String,
    fatherJob: String,
    motherJob: String,
    parentPhone: String,
    nation: String,
    presentAddress: String,
    permanentAddress: String,
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const UserModel = model('User', UserSchema);
module.exports = UserModel;
