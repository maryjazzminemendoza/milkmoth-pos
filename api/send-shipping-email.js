import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const {
      customerEmail,
      customerName,
      productName,
      sku,
      receiptNumber,
      courier,
      trackingNumber,
    } = req.body

    if (
      !customerEmail ||
      !customerName ||
      !productName ||
      !sku ||
      !receiptNumber ||
      !courier ||
      !trackingNumber
    ) {
      return res.status(400).json({
        error: 'Missing required shipping information.',
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: 'Your Milkmoth order has shipped ♡',
      text: `Hi ${customerName},

Your Milkmoth order ${receiptNumber} has been shipped ♡

Item: ${productName}
SKU: ${sku}

Courier: ${courier}
Tracking number: ${trackingNumber}

You can use your tracking number to track your parcel with the courier.

Thank you for supporting Milkmoth ♡

soft relics for daydreamers`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 560px;">
          <h2 style="font-weight: 500; margin-bottom: 24px;">
            Your Milkmoth order has shipped ♡
          </h2>

          <p>Hi ${customerName},</p>

          <p>
            Your Milkmoth order
            <strong>${receiptNumber}</strong>
            has been shipped ♡
          </p>

          <div style="margin: 24px 0; padding: 18px; background: #f8f5f2;">
            <p style="margin: 0 0 8px;">
              <strong>Item:</strong> ${productName}
            </p>

            <p style="margin: 0 0 8px;">
              <strong>SKU:</strong> ${sku}
            </p>

            <p style="margin: 0 0 8px;">
              <strong>Courier:</strong> ${courier}
            </p>

            <p style="margin: 0;">
              <strong>Tracking number:</strong> ${trackingNumber}
            </p>
          </div>

          <p>
            You can use your tracking number to track your parcel
            with the courier.
          </p>

          <p>
            Thank you for supporting Milkmoth ♡
          </p>

          <p style="margin-top: 32px; font-size: 14px; color: #777;">
            soft relics for daydreamers
          </p>
        </div>
      `,
    })

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error('Shipping email error:', error)

    return res.status(500).json({
      error: 'Failed to send shipping email.',
    })
  }
}