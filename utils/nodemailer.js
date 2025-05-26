const nodemailer = require("nodemailer");

/**
 * Sends an email using Nodemailer.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Subject of the email.
 * @param {string} htmlTemplate - Email body in HTML string format.
 */
async function sendEmail({ to, subject, htmlTemplate }) {
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can change this to any email providere
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // App password or email password
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = sendEmail;
