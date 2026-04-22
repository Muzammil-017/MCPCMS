const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

exports.createContact = async (req, res) => {
  try {
    const { company, email, message } = req.body;
     console.log("ENV EMAIL:", process.env.EMAIL_USER);

    // ✅ Save to DB
    const newContact = await Contact.create({
      company,
      email,
      message
    });

    // ✅ Send Email
    const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

await transporter.sendMail({
  from: `"MCPCMS Contact" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  replyTo: email,
  subject: `New Contact Request from ${company}`,
  html: `
    <h2>New Contact Request</h2>
    <p><strong>Company:</strong> ${company}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `
});

    res.status(201).json({
      success: true,
      message: "Contact request submitted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};