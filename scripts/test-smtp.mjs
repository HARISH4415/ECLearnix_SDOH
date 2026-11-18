import nodemailer from 'nodemailer'

const recipient = process.argv[2] || 'harishramanan4415@gmail.com'

console.log(`\nTesting SMTP Delivery to: ${recipient}...`)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zarnexsolutions@gmail.com',
    pass: 'blyiwrjugeqvnnwk'
  }
})

const testOtp = Math.floor(100000 + Math.random() * 900000)

transporter.sendMail({
  from: '"CareEquity Health" <zarnexsolutions@gmail.com>',
  to: recipient,
  subject: `CareEquity Verification Code: ${testOtp}`,
  text: `Your CareEquity verification code is: ${testOtp}`,
  html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:10px;max-width:500px">
    <h2 style="color:#4338ca">CareEquity Verification</h2>
    <p>Your one-time verification code is:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#4338ca;padding:12px;background:#f3f4f6;text-align:center;border-radius:8px">
      ${testOtp}
    </div>
    <p style="color:#666;font-size:12px;margin-top:16px">This code is valid for 10 minutes.</p>
  </div>`
}, (err, info) => {
  if (err) {
    console.error('❌ Failed to send:', err.message)
    process.exit(1)
  } else {
    console.log('✅ Email successfully delivered to:', recipient)
    console.log('Message ID:', info.messageId)
    console.log('OTP Code sent:', testOtp)
    process.exit(0)
  }
})
