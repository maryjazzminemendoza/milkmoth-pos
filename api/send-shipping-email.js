import nodemailer from 'nodemailer'

function formatPrice(price) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(price || 0))
}

function formatCourier(courier) {
  if (courier === 'j&t') {
    return 'J&T Express'
  }

  if (courier === 'lalamove') {
    return 'Lalamove'
  }

  return courier || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    })
  }

  try {
    const {
      customerEmail,
      customerName,
      receiptNumber,
      courier,
      trackingNumber,
      trackingUrl,
      items,
      total,
    } = req.body || {}

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Customer email is required.',
      })
    }

    if (!customerName) {
      return res.status(400).json({
        error: 'Customer name is required.',
      })
    }

    if (!receiptNumber) {
      return res.status(400).json({
        error: 'Receipt number is required.',
      })
    }

    if (!courier) {
      return res.status(400).json({
        error: 'Courier is required.',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'At least one order item is required.',
      })
    }

    if (
      courier === 'j&t' &&
      !trackingNumber
    ) {
      return res.status(400).json({
        error: 'J&T tracking number is required.',
      })
    }

    if (
      courier === 'lalamove' &&
      !trackingUrl
    ) {
      return res.status(400).json({
        error: 'Lalamove tracking link is required.',
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(
        process.env.SMTP_PORT || 587
      ),
      secure:
        Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td style="
              padding: 14px 0;
              border-bottom: 1px solid #eee;
              font-family: Arial, sans-serif;
              color: #333;
            ">
              <strong>${item.name}</strong>
              ${
                item.sku
                  ? `
                    <div style="
                      margin-top: 4px;
                      font-size: 12px;
                      color: #888;
                    ">
                      SKU: ${item.sku}
                    </div>
                  `
                  : ''
              }
            </td>

            <td style="
              padding: 14px 0;
              border-bottom: 1px solid #eee;
              text-align: right;
              font-family: Arial, sans-serif;
              color: #333;
              white-space: nowrap;
            ">
              ${formatPrice(item.price)}
            </td>
          </tr>
        `
      )
      .join('')

    const trackingContent =
      courier === 'lalamove'
        ? `
          <a
            href="${trackingUrl}"
            style="
              display: inline-block;
              padding: 12px 18px;
              background: #222;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
              font-family: Arial, sans-serif;
              font-size: 14px;
            "
          >
            Track your delivery
          </a>
        `
        : `
          <div style="
            margin-top: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #222;
            letter-spacing: 0.4px;
          ">
            ${trackingNumber}
          </div>
        `

    const textTracking =
      courier === 'lalamove'
        ? `Tracking link: ${trackingUrl}`
        : `Tracking number: ${trackingNumber}`

    const html = `
      <div style="
        margin: 0;
        padding: 40px 20px;
        background: #f7f3ed;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
        ">
          <div style="
            text-align: center;
            margin-bottom: 35px;
          ">
            <div style="
              font-family: Georgia, serif;
              font-size: 28px;
              letter-spacing: 1px;
              color: #222;
            ">
              milkmoth
            </div>

            <div style="
              margin-top: 6px;
              font-family: Arial, sans-serif;
              font-size: 11px;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #999;
            ">
              soft relics for daydreamers
            </div>
          </div>

          <div style="
            font-family: Arial, sans-serif;
            color: #333;
          ">
            <p style="font-size: 15px;">
              Hi ${customerName},
            </p>

            <h1 style="
              margin: 25px 0 12px;
              font-family: Georgia, serif;
              font-weight: normal;
              font-size: 28px;
              color: #222;
            ">
              Your order is on its way.
            </h1>

            <p style="
              font-size: 14px;
              line-height: 1.7;
              color: #666;
            ">
              Your Milkmoth pieces have been packed
              and handed over to the courier.
            </p>

            <div style="
              margin: 30px 0;
              padding: 18px;
              background: #f7f3ed;
            ">
              <div style="
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #999;
              ">
                Order
              </div>

              <div style="
                margin-top: 7px;
                font-size: 16px;
                color: #222;
              ">
                ${receiptNumber}
              </div>
            </div>

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                border-collapse: collapse;
                margin: 25px 0;
              "
            >
              <tbody>
                ${itemRows}

                <tr>
                  <td style="
                    padding-top: 18px;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    color: #222;
                  ">
                    Total
                  </td>

                  <td style="
                    padding-top: 18px;
                    text-align: right;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    color: #222;
                  ">
                    ${formatPrice(total)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="
              margin-top: 35px;
              padding-top: 25px;
              border-top: 1px solid #eee;
            ">
              <div style="
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #999;
              ">
                Delivery
              </div>

              <div style="
                margin-top: 8px;
                font-size: 15px;
                color: #222;
              ">
                ${formatCourier(courier)}
              </div>

              <div style="margin-top: 18px;">
                ${trackingContent}
              </div>
            </div>

            <p style="
              margin-top: 35px;
              font-size: 13px;
              line-height: 1.7;
              color: #777;
            ">
              Thank you for giving these pieces a
              new home.
            </p>

            <p style="
              margin-top: 25px;
              font-family: Georgia, serif;
              font-size: 15px;
              color: #444;
            ">
              — milkmoth
            </p>
          </div>
        </div>
      </div>
    `

    const text = `
Hi ${customerName},

Your Milkmoth order is on its way.

Order: ${receiptNumber}

Items:
${items
  .map(
    (item) =>
      `- ${item.name}: ${formatPrice(item.price)}`
  )
  .join('\n')}

Total: ${formatPrice(total)}

Courier: ${formatCourier(courier)}
${textTracking}

Thank you for giving these pieces a new home.

— milkmoth
`

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER,
      to: customerEmail,
      subject: `Your Milkmoth order ${receiptNumber} is on its way`,
      text,
      html,
    })

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Failed to send shipping email:',
      error
    )

    return res.status(500).json({
      error:
        error.message ||
        'Failed to send shipping email.',
    })
  }
}