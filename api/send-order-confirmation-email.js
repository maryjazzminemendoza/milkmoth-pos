import nodemailer from 'nodemailer'

const smtpPort = Number(process.env.SMTP_PORT)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function formatPrice(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
    })
  }

  try {
    /*
     * Check that the SMTP environment variables
     * actually exist on Vercel.
     */

    const missingEnv = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
    ].filter(
      (key) => !process.env[key]
    )

    if (missingEnv.length > 0) {
      console.error(
        'Missing SMTP environment variables:',
        missingEnv
      )

      return res.status(500).json({
        success: false,
        error:
          'Email service is not configured correctly.',
      })
    }

    const {
      customerEmail,
      customerName,
      receiptNumber,
      items = [],
      total,
      courier,
      expiresAt,
    } = req.body || {}

    /*
     * Validate order data.
     */

    if (
      !customerEmail ||
      !customerName ||
      !receiptNumber ||
      !Array.isArray(items) ||
      !items.length ||
      total === undefined ||
      !expiresAt
    ) {
      console.error(
        'Missing order email data:',
        {
          customerEmail: !!customerEmail,
          customerName: !!customerName,
          receiptNumber: !!receiptNumber,
          itemCount: items.length,
          total,
          expiresAt: !!expiresAt,
        }
      )

      return res.status(400).json({
        success: false,
        error:
          'Missing required order information.',
      })
    }

    /*
     * Verify SMTP connection before attempting
     * to send the email.
     */

    try {
      await transporter.verify()

      console.log(
        'SMTP connection verified successfully.'
      )
    } catch (smtpError) {
      console.error(
        'SMTP verification failed:',
        smtpError
      )

      return res.status(500).json({
        success: false,
        error:
          'Unable to connect to the email server.',
      })
    }

    const paymentDeadline = new Date(
      expiresAt
    )

    const formattedDeadline =
      paymentDeadline.toLocaleString(
        'en-PH',
        {
          timeZone: 'Asia/Manila',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      )

    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td style="
              padding: 12px 0;
              border-bottom: 1px solid #e8e1d8;
              color: #302b27;
              font-size: 14px;
            ">
              ${escapeHtml(item.name)}
            </td>

            <td style="
              padding: 12px 0;
              border-bottom: 1px solid #e8e1d8;
              text-align: right;
              color: #302b27;
              font-size: 14px;
              white-space: nowrap;
            ">
              ${formatPrice(item.price)}
            </td>
          </tr>
        `
      )
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Your Milkmoth Order</title>
        </head>

        <body style="
          margin: 0;
          padding: 0;
          background: #f4f0ea;
          font-family: Arial, Helvetica, sans-serif;
          color: #302b27;
        ">

          <div style="
            width: 100%;
            padding: 40px 16px;
            box-sizing: border-box;
          ">

            <div style="
              max-width: 620px;
              margin: 0 auto;
              background: #fffdf9;
              border: 1px solid #e5ded5;
            ">

              <!-- Header -->

              <div style="
                padding: 36px 32px 28px;
                text-align: center;
                border-bottom: 1px solid #e8e1d8;
              ">

                <div style="
                  font-family: Georgia, 'Times New Roman', serif;
                  font-size: 28px;
                  letter-spacing: 1px;
                  color: #302b27;
                  margin-bottom: 8px;
                ">
                  milkmoth
                </div>

                <div style="
                  font-size: 11px;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  color: #8b8177;
                ">
                  soft relics for daydreamers
                </div>

              </div>

              <!-- Main -->

              <div style="padding: 32px;">

                <p style="
                  margin: 0 0 8px;
                  font-family: Georgia, 'Times New Roman', serif;
                  font-size: 25px;
                  color: #302b27;
                ">
                  your order is reserved.
                </p>

                <p style="
                  margin: 0 0 28px;
                  color: #756d66;
                  font-size: 14px;
                  line-height: 1.7;
                ">
                  Hi ${escapeHtml(customerName)},
                  we've received your claim.
                  The pieces below are currently
                  being held for you.
                </p>

                <!-- Receipt -->

                <div style="
                  background: #f4f0ea;
                  padding: 18px 20px;
                  margin-bottom: 28px;
                ">

                  <div style="
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #8b8177;
                    margin-bottom: 6px;
                  ">
                    Order number
                  </div>

                  <div style="
                    font-size: 16px;
                    font-weight: 600;
                    letter-spacing: .5px;
                    color: #302b27;
                  ">
                    ${escapeHtml(receiptNumber)}
                  </div>

                </div>

                <!-- Items -->

                <div style="
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                  color: #8b8177;
                  margin-bottom: 10px;
                ">
                  Your pieces
                </div>

                <table style="
                  width: 100%;
                  border-collapse: collapse;
                ">
                  <tbody>
                    ${itemRows}

                    <tr>
                      <td style="
                        padding-top: 18px;
                        font-family: Georgia, 'Times New Roman', serif;
                        font-size: 17px;
                      ">
                        total
                      </td>

                      <td style="
                        padding-top: 18px;
                        text-align: right;
                        font-size: 17px;
                        font-weight: 600;
                      ">
                        ${formatPrice(total)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Payment Notice -->

                <div style="
                  margin-top: 30px;
                  padding: 20px;
                  border: 1px solid #d9cfc4;
                  background: #faf7f2;
                ">

                  <div style="
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 19px;
                    margin-bottom: 8px;
                  ">
                    payment within 24 hours
                  </div>

                  <p style="
                    margin: 0;
                    font-size: 13px;
                    line-height: 1.7;
                    color: #756d66;
                  ">
                    Please complete your payment
                    before
                    <strong style="color: #302b27;">
                      ${formattedDeadline}
                    </strong>
                    to secure your order.
                  </p>

                </div>

                <!-- Payment -->

                <div style="
                  margin-top: 32px;
                ">

                  <div style="
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #8b8177;
                    margin-bottom: 18px;
                  ">
                    payment details
                  </div>

                  <!-- GCash -->

                  <div style="
                    border: 1px solid #e5ded5;
                    padding: 20px;
                    margin-bottom: 16px;
                  ">

                    <div style="
                      font-family: Georgia, 'Times New Roman', serif;
                      font-size: 19px;
                      margin-bottom: 12px;
                    ">
                      GCash
                    </div>

                    <div style="
                      font-size: 13px;
                      line-height: 1.8;
                      color: #756d66;
                    ">
                      <strong style="color: #302b27;">
                        Account name
                      </strong><br />
                      MA*Y JA*****E M.<br /><br />

                      <strong style="color: #302b27;">
                        GCash number
                      </strong><br />
                      09983959119
                    </div>

                    <div style="
                      margin-top: 20px;
                      text-align: center;
                    ">
                      <img
                        src="https://milkmoth-pos.vercel.app/payment/gcash-qr.jpg"
                        alt="GCash QR code"
                        style="
                          width: 180px;
                          max-width: 100%;
                          height: auto;
                          display: inline-block;
                        "
                      />
                    </div>

                  </div>

                  <!-- GoTyme -->

                  <div style="
                    border: 1px solid #e5ded5;
                    padding: 20px;
                  ">

                    <div style="
                      font-family: Georgia, 'Times New Roman', serif;
                      font-size: 19px;
                      margin-bottom: 12px;
                    ">
                      GoTyme
                    </div>

                    <div style="
                      font-size: 13px;
                      line-height: 1.8;
                      color: #756d66;
                    ">
                      <strong style="color: #302b27;">
                        Account name
                      </strong><br />
                      MARY JAZZMINE BIASON MENDOZA<br /><br />

                      <strong style="color: #302b27;">
                        Account number
                      </strong><br />
                      016432640915
                    </div>

                    <div style="
                      margin-top: 20px;
                      text-align: center;
                    ">
                      <img
                        src="https://milkmoth-pos.vercel.app/payment/gotyme-qr.jpg"
                        alt="GoTyme QR code"
                        style="
                          width: 180px;
                          max-width: 100%;
                          height: auto;
                          display: inline-block;
                        "
                      />
                    </div>

                  </div>

                </div>

                <!-- Proof -->

                <div style="
                  margin-top: 30px;
                  padding: 20px;
                  background: #f4f0ea;
                ">

                  <div style="
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 18px;
                    margin-bottom: 8px;
                  ">
                    after payment
                  </div>

                  <p style="
                    margin: 0;
                    font-size: 13px;
                    line-height: 1.8;
                    color: #756d66;
                  ">
                    Please send your proof of payment
                    through our Instagram DM and
                    include your order number
                    <strong style="color: #302b27;">
                      ${escapeHtml(receiptNumber)}
                    </strong>
                    so we can confirm your payment.
                  </p>

                </div>

                <!-- Shipping -->

                <div style="
                  margin-top: 28px;
                  font-size: 13px;
                  line-height: 1.8;
                  color: #756d66;
                ">

                  <strong style="color: #302b27;">
                    Delivery
                  </strong><br />

                  Courier:
                  ${escapeHtml(
                    courier === 'j&t'
                      ? 'J&T Express'
                      : 'Lalamove'
                  )}

                  <br /><br />

                  Your order will be prepared
                  for shipping once payment has
                  been confirmed.

                </div>

                <!-- Footer -->

                <div style="
                  margin-top: 36px;
                  padding-top: 24px;
                  border-top: 1px solid #e8e1d8;
                  text-align: center;
                ">

                  <div style="
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 18px;
                    margin-bottom: 6px;
                  ">
                    thank you for finding a little
                    relic with us.
                  </div>

                  <div style="
                    font-size: 11px;
                    color: #9a9087;
                    letter-spacing: .5px;
                  ">
                    milkmoth · soft relics for daydreamers
                  </div>

                </div>

              </div>

            </div>

          </div>

        </body>
      </html>
    `

    console.log(
      'Attempting to send order confirmation:',
      {
        to: customerEmail,
        receiptNumber,
        itemCount: items.length,
        total,
        from: process.env.SMTP_FROM,
      }
    )

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: `Your Milkmoth order is reserved — ${receiptNumber}`,
      html,
    })

    console.log(
      'Order confirmation email sent successfully:',
      {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      }
    )

    return res.status(200).json({
      success: true,
      message:
        'Order confirmation email sent.',
      messageId: info.messageId,
    })
  } catch (error) {
    console.error(
      'Order confirmation email error:',
      error
    )

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        'Failed to send order confirmation email.',
    })
  }
}