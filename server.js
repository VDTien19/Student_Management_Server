// const express = require("express");
// const cors = require("cors");
// const initRoute = require("./src/Routes");
// const connect = require("./src/Config/db/index");
// const cookieParser = require("cookie-parser");
// require("dotenv").config();
// const app = express();
// // app.use(cors());
// // app.use((req, res, next) => {
// //   res.header('Access-Control-Allow-Origin', '*');
// //   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
// //   next();
// // })
// app.use(cookieParser());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// import { OAuth2Client } from "google-auth-library";
// export const myOAuth2Client = new OAuth2Client(
// 	process.env.GOOGLE_MAILER_CLIENT_ID,
// 	process.env.GOOGLE_MAILER_CLIENT_SECRET
// );
// // Set Refresh Token vào OAuth2Client Credentials
// myOAuth2Client.setCredentials({
// 	refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
// });

// initRoute(app);

// // handle error

// app.use((req, res, next) => {
//   const error = new Error('Not Found');
//   error.status = 404;
//   next(error);
// })

// app.use((error, req, res, next) => {
//   const statusCode = error.status || 500;
//   return res.status(statusCode).json({
//     status: 'error',
//     code: statusCode,
//     message: error.message || 'Internal Server Error',
//   });
  
// });

// // connect database
// connect();

// const port = process.env.PORT;
// app.listen(port, (err) => {
// 	if (err) console.log(err);
// 	console.log(`Server listening in port ${port}`);
// });

const express = require("express");
const cors = require("cors");
const initRoute = require("./src/Routes");
const connect = require("./src/Config/db/index");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library"); // Chuyển từ import sang require

const app = express();

// Cấu hình CORS
app.use(cors({
  origin: '*', // Cho phép từ origin của frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức HTTP được phép
  credentials: true // Nếu bạn sử dụng cookie hoặc thông tin xác thực
}));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình OAuth2Client
const myOAuth2Client = new OAuth2Client(
  process.env.GOOGLE_MAILER_CLIENT_ID,
  process.env.GOOGLE_MAILER_CLIENT_SECRET
);
// Set Refresh Token vào OAuth2Client Credentials
myOAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
});

// Khởi tạo các route
initRoute(app);

// Xử lý lỗi 404
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Xử lý các lỗi khác
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
  });
});

// Kết nối database
connect();

const port = process.env.PORT || 8080;
app.listen(port, (err) => {
  if (err) console.log(err);
  console.log(`Server listening on port ${port}`);
});
