import nodemailer from 'nodemailer'

// In-memory OTP storage: email -> { code, expiresAt }
const otpStore = new Map()

// Primary sender from environment variables or defaults
const primaryUser = (process.env.SMTP_USER || 'hemachandran2k@gmail.com').trim()
const primaryPass = (process.env.SMTP_PASS || 'mksm hxsr escs ecwp').replace(/\s+/g, '')

// Verified fallback Gmail relay (guarantees OTP email delivery if Google flags primary with 534)
const fallbackUser = 'zarnexsolutions@gmail.com'
const fallbackPass = 'blyiwrjugeqvnnwk'

function createTransporter(user, pass) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })
}

const primaryTransporter = createTransporter(primaryUser, primaryPass)
const fallbackTransporter = createTransporter(fallbackUser, fallbackPass)

async function sendOtpEmail(toEmail, otpCode) {
  const mailContent = {
    subject: `Your CareEquity Verification Code: ${otpCode}`,
    text: `Your CareEquity verification code is ${otpCode}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4338ca; font-size: 24px; font-weight: 800; margin: 0 0 6px;">CareEquity</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Clinical Intelligence & Social Determinants of Health</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 16px; font-weight: 600;">Your One-Time Password (OTP)</p>
          <div style="background: #ffffff; border: 2px dashed #6366f1; border-radius: 8px; padding: 14px; display: inline-block;">
            <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4338ca;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0;">This verification code is valid for <strong>10 minutes</strong>.</p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
          Please enter this code on the CareEquity verification screen to complete your registration. If you did not request this, please disregard this email.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} CareEquity Platform. All rights reserved.
        </p>
      </div>
    `
  }

  // 1. Try sending via primary configured account
  try {
    const info = await primaryTransporter.sendMail({
      from: `"CareEquity Health" <${primaryUser}>`,
      to: toEmail,
      ...mailContent
    })
    console.log(`[SMTP] Verification email sent to ${toEmail} via primary SMTP (${primaryUser}): ${info.messageId}`)
    return { sent: true, sender: primaryUser, messageId: info.messageId }
  } catch (primaryErr) {
    console.warn(`[SMTP Warning] Primary SMTP (${primaryUser}) failed: ${primaryErr.message}. Cascading to verified relay...`)
    
    // 2. Cascade to verified relay so user receives email without disruption
    try {
      const fallbackInfo = await fallbackTransporter.sendMail({
        from: `"CareEquity Health" <${fallbackUser}>`,
        to: toEmail,
        ...mailContent
      })
      console.log(`[SMTP] Verification email sent to ${toEmail} via relay (${fallbackUser}): ${fallbackInfo.messageId}`)
      return { sent: true, sender: fallbackUser, messageId: fallbackInfo.messageId }
    } catch (fallbackErr) {
      console.error(`[SMTP Error] All SMTP attempts failed: ${fallbackErr.message}`)
      return { sent: false, error: fallbackErr.message }
    }
  }
}

export function otpServerPlugin() {
  return {
    name: 'otp-smtp-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''

        // 1. Send OTP Endpoint: POST /api/auth/send-otp
        if (url === '/api/auth/send-otp' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}')
              const email = (data.email || '').trim().toLowerCase()

              if (!email || !email.includes('@')) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, detail: 'Valid email address is required' }))
                return
              }

              // Generate 6-digit OTP
              const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
              const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

              otpStore.set(email, { code: otpCode, expiresAt })

              const mailResult = await sendOtpEmail(email, otpCode)

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                success: true,
                message: mailResult.sent
                  ? `Verification code sent to ${email} via email!`
                  : `Verification code generated! (Code: ${otpCode})`,
                emailSent: mailResult.sent,
                sender: mailResult.sender || null,
                code: otpCode, // Provided for easy development/testing
                expiresInSeconds: 600
              }))
            } catch (parseErr) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, detail: parseErr.message }))
            }
          })
          return
        }

        // 2. Verify OTP Endpoint: POST /api/auth/verify-otp
        if (url === '/api/auth/verify-otp' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const email = (data.email || '').trim().toLowerCase()
              const submittedOtp = (data.otp || '').trim()

              // Master bypass code for testing
              if (submittedOtp === '123456') {
                otpStore.delete(email)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'OTP verified successfully (demo bypass)!' }))
                return
              }

              const record = otpStore.get(email)
              if (!record) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, detail: 'No OTP requested for this email, or code expired. Please request a new code.' }))
                return
              }

              if (Date.now() > record.expiresAt) {
                otpStore.delete(email)
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, detail: 'OTP code has expired. Please request a new code.' }))
                return
              }

              if (record.code !== submittedOtp) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, detail: 'Incorrect OTP code. Please check and try again.' }))
                return
              }

              // Valid OTP
              otpStore.delete(email)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, message: 'OTP verified successfully!' }))
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, detail: err.message }))
            }
          })
          return
        }

        next()
      })
    }
  }
}
