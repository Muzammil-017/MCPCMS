const Contact = require('../models/Contact');
const { sendError } = require('../services/errorService');
const { sendMail, isConfigured, escapeHtml } = require('../services/mailService');

exports.createContact = async (req, res) => {
  try {
    const company = String(req.body.company || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const message = String(req.body.message || '').trim();

    if (!company || !email || !message)
      return res.status(400).json({ success: false, message: 'company, email and message are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    if (message.length > 5000)
      return res.status(400).json({ success: false, message: 'Message is too long' });

    // Save to DB first: the request is kept even if the email notification fails
    await Contact.create({ company, email, message });

    if (isConfigured()) {
      try {
        await sendMail({
          to: process.env.EMAIL_USER,
          replyTo: email,
          subject: `New Contact Request from ${company.replace(/[\r\n]/g, ' ')}`,
          html: `
            <h2>New Contact Request</h2>
            <p><strong>Company:</strong> ${escapeHtml(company)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          `
        });
      } catch (mailErr) {
        console.error(`Contact email not sent: ${mailErr.message}`);
      }
    }

    res.status(201).json({ success: true, message: 'Contact request submitted successfully' });
  } catch (err) {
    sendError(res, err);
  }
};
