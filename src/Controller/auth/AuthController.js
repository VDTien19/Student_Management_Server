const jwt = require('jsonwebtoken')
const generateTokens = require('./generateTokens')
const User = require('../../Model/User.model')
const Encrypt = require('../../Utils/encryption')

const { ForbiddenError, ConflictError, BadRequestError } = require('../../core/error.response')

import Teacher from '../../Model/Teacher.model'
import sendEmail from '../../Utils/sendEmail'
import { generateRandomPassword } from '../../Utils/randomPassword'


const AuthController = {

  requestRefreshToken: async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    console.log('Received refresh token:', refreshToken);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      console.log('Decoded token:', decoded);

      const user = decoded;

      // Tạo mới access token
      const newAccessToken = generateTokens.generateAccessToken(decoded);


      res.status(200).json({
        tokens: {
          accessToken: newAccessToken,
          refreshToken: refreshToken,
        },
        data: user

      });
    });
  },



  login: async (req, res) => {
    const { username, password } = req.body;
    let user = await User.findOne({ msv: username })
    if (!user) {
      user = await Teacher.findOne({ mgv: username })
    }
    console.log(user)


    if (!user) {
      throw new ConflictError('User not exists')
      // return res.status(404).json({ message: 'user not exist' });
    }
    const comparePassword = await Encrypt.comparePassword(password, user.password)
    if (comparePassword) {
      const accessToken = generateTokens.generateAccessToken(user)

      const refreshToken = generateTokens.generateRefreshToken(user)
      const { password, ...resUser } = user._doc;
      res.status(200).json({ data: { user: resUser }, tokens: { accessToken, refreshToken } })
    } else {
      throw new BadRequestError('Password incorrect')
    }
  },

  changePassword: async (req, res) => {
    const { password, newPass } = req.body
    const hashPassword = await Encrypt.cryptPassword(newPass)
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ message: "tài khoản k tồn tại" })
        return;
      }
      const comparePassword = await Encrypt.comparePassword(password, user.password)
      if (!comparePassword) {
        return res.status(400).json({ message: 'mật khẩu không chính xác!!' });
      }
      user.password = hashPassword;
      await user.save();
      return res.status(200).json({ message: "Đổi thành công" })
    } catch (e) {
      res.status(500).json({ message: 'server error', error: e })
    }
  },

  resetPassword: async (req, res) => {
    const { msv } = req.body
    try {
      const user = await User.findOne({ msv: msv });
      if (!user) {
        res.status(404).json({ message: "user not exist" })
        return;
      }
      const newPassword = generateRandomPassword(8);
      const hashPassword = await Encrypt.cryptPassword(newPassword)
      user.password = hashPassword;
      user.save();
      sendEmail(user?.email, 'Reset Password', newPassword, req, res);
    } catch (e) {
      console.log(e)
      return res.status(500).json(e)
    }
  },

  logout: async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });
    res.status(200).json({ message: 'Successfully logged out' });

  },

  validateToken: async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(400).json({ message: 'No token provided' });
    
    jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      res.status(200).json({ message: 'Token is valid' });
    });
  },
}

module.exports = AuthController;