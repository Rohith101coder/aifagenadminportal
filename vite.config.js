import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import https from 'node:https'
import nodemailer from 'nodemailer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const brevoApiKey =
    env.BREVO_API_KEY ||
    env.VITE_BREVO_API_KEY ||
    process.env.BREVO_API_KEY ||
    process.env.VITE_BREVO_API_KEY ||
    ''
  const mailUsername =
    env.MAIL_USERNAME ||
    env.VITE_MAIL_USERNAME ||
    process.env.MAIL_USERNAME ||
    process.env.VITE_MAIL_USERNAME ||
    ''
  const mailPassword =
    env.MAIL_PASSWORD ||
    env.VITE_MAIL_PASSWORD ||
    process.env.MAIL_PASSWORD ||
    process.env.VITE_MAIL_PASSWORD ||
    ''
  let senderEmail =
    env.BREVO_SENDER_EMAIL ||
    env.VITE_BREVO_SENDER_EMAIL ||
    'rohithvadla07@gmail.com'

  if (
    !senderEmail ||
    senderEmail.includes('smtp-brevo.com') ||
    senderEmail.includes('aifagenlabs.com')
  ) {
    senderEmail = 'rohithvadla07@gmail.com'
  }

  return {
    plugins: [
      react(),
      {
        name: 'brevo-mail-api',
        configureServer(server) {
          server.middlewares.use('/api/send-email', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              })
              res.end()
              return
            }

            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }

            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')

              try {
                const data = JSON.parse(body || '{}')
                const {
                  toEmail,
                  subject,
                  htmlContent,
                  text,
                  attachments = [],
                } = data

                if (!toEmail) {
                  res.writeHead(400)
                  res.end(JSON.stringify({ error: 'toEmail is required' }))
                  return
                }

                // 1. Dispatch via Brevo REST API v3
                const payload = {
                  sender: {
                    name: data.senderName || 'AIFaGen Dashboard',
                    email: senderEmail,
                  },
                  to: [{ email: toEmail, name: data.toName || toEmail }],
                  subject: subject || 'AIFaGen Dashboard Report',
                  htmlContent: htmlContent || '<p>Report Attached</p>',
                  textContent: text || undefined,
                }

                if (attachments && attachments.length > 0) {
                  payload.attachment = attachments.map((att) => ({
                    name: att.name || att.filename || 'attachment',
                    content: att.content || att.base64,
                  }))
                }

                const postData = JSON.stringify(payload)
                const brevoReq = https.request(
                  {
                    hostname: 'api.brevo.com',
                    path: '/v3/smtp/email',
                    method: 'POST',
                    headers: {
                      'api-key': brevoApiKey,
                      'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(postData),
                    },
                  },
                  (brevoRes) => {
                    let respBody = ''
                    brevoRes.on('data', (c) => {
                      respBody += c
                    })
                    brevoRes.on('end', () => {
                      if (
                        brevoRes.statusCode >= 200 &&
                        brevoRes.statusCode < 300
                      ) {
                        let parsed = {}
                        try {
                          parsed = JSON.parse(respBody)
                        } catch {}
                        res.writeHead(200)
                        res.end(
                          JSON.stringify({
                            success: true,
                            method: 'brevo_api',
                            messageId: parsed.messageId,
                            toEmail,
                          }),
                        )
                      } else {
                        // Fallback to SMTP
                        sendViaSmtp(
                          mailUsername,
                          mailPassword,
                          toEmail,
                          subject,
                          htmlContent,
                          text,
                          attachments,
                        )
                          .then((smtpRes) => {
                            res.writeHead(200)
                            res.end(JSON.stringify(smtpRes))
                          })
                          .catch((smtpErr) => {
                            res.writeHead(brevoRes.statusCode || 500)
                            res.end(
                              JSON.stringify({
                                success: false,
                                error: respBody || smtpErr.message,
                                statusCode: brevoRes.statusCode,
                              }),
                            )
                          })
                      }
                    })
                  },
                )

                brevoReq.on('error', (err) => {
                  sendViaSmtp(
                    mailUsername,
                    mailPassword,
                    toEmail,
                    subject,
                    htmlContent,
                    text,
                    attachments,
                  )
                    .then((smtpRes) => {
                      res.writeHead(200)
                      res.end(JSON.stringify(smtpRes))
                    })
                    .catch((smtpErr) => {
                      res.writeHead(500)
                      res.end(
                        JSON.stringify({
                          success: false,
                          error: err.message || smtpErr.message,
                        }),
                      )
                    })
                })

                brevoReq.write(postData)
                brevoReq.end()
              } catch (parseErr) {
                res.writeHead(400)
                res.end(
                  JSON.stringify({
                    error: 'Invalid JSON payload: ' + parseErr.message,
                  }),
                )
              }
            })
          })
        },
      },
    ],
    define: {
      'import.meta.env.BREVO_API_KEY': JSON.stringify(brevoApiKey),
      'import.meta.env.VITE_BREVO_API_KEY': JSON.stringify(brevoApiKey),
      'import.meta.env.MAIL_USERNAME': JSON.stringify(mailUsername),
      'import.meta.env.VITE_MAIL_USERNAME': JSON.stringify(mailUsername),
      'import.meta.env.BREVO_SENDER_EMAIL': JSON.stringify(senderEmail),
      'import.meta.env.VITE_BREVO_SENDER_EMAIL': JSON.stringify(senderEmail),
    },
  }
})

async function sendViaSmtp(
  user,
  pass,
  to,
  subject,
  html,
  text,
  attachments = [],
) {
  if (!user || !pass) {
    throw new Error('Missing SMTP credentials')
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  })
  const info = await transporter.sendMail({
    from: `"AIFaGen Dashboard" <${user}>`,
    to,
    subject,
    html,
    text,
    attachments: attachments.map((a) => ({
      filename: a.name || a.filename,
      content: Buffer.from(a.content || a.base64, 'base64'),
    })),
  })
  return { success: true, method: 'brevo_smtp', messageId: info.messageId }
}

