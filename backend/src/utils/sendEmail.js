import nodemailer from 'nodemailer'

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required to send OTP emails.')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"pebloNotes" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  })
}

export default sendEmail
