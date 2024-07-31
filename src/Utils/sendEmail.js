const nodemailer = require('nodemailer')
require('dotenv').config()
import { OAuth2Client } from 'google-auth-library'
const sendEmail = async (email, subject, payload, req, res) => {
  try {
    const myOAuth2Client = new OAuth2Client(
      process.env.GOOGLE_MAILER_CLIENT_ID,
      process.env.GOOGLE_MAILER_CLIENT_SECRET
    )
    // Set Refresh Token vào OAuth2Client Credentials
    myOAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN
    })
    const { token } = await myOAuth2Client.getAccessToken();
    // create reusable transporter object using the default SMTP transport
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'nqtrung0810@gmail.com',
        clientId: process.env.GOOGLE_MAILER_CLIENT_ID,
        clientSecret: process.env.GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: token
      }
    })
    const options = () => {
      return {
        from: 'nqtrung0810@gmail.com',
        to: email,
        subject: subject,
        text: payload
      };
    };

    // Send email
    transport.sendMail(options(), (error, info) => {
      if (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
        return error;
      } else {
        return res.status(200).json({message: 'New password has been sent to your email'})
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({message: 'st wrong'})
  }
};

/*
Example:
sendEmail(
  "youremail@gmail.com,
  "Email subject",
  { name: "Eze" },
  "./templates/layouts/main.handlebars"
);
*/

module.exports = sendEmail;