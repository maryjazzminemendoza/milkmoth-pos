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
      subject: 'Your Milkmoth order is on its way ♡',

      text: `Hi ${customerName},

Your Milkmoth order is on its way ♡

Order ${receiptNumber}

${productName}
SKU: ${sku}

Courier: ${courier}
Tracking number: ${trackingNumber}

Your parcel has been handed over to the courier. You can use the tracking number above to follow its journey.

Thank you for giving this little relic a new home.

— milkmoth
soft relics for daydreamers`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Your Milkmoth order is on its way</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #f3eee8;
              font-family: Georgia, 'Times New Roman', serif;
              color: #3d342e;
            "
          >
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="background-color: #f3eee8;"
            >
              <tr>
                <td align="center" style="padding: 40px 16px;">
                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      max-width: 560px;
                      background-color: #fbf9f6;
                      border: 1px solid #ddd4cb;
                    "
                  >

                    <!-- Header -->
                    <tr>
                      <td
                        align="center"
                        style="
                          padding: 38px 32px 30px;
                          border-bottom: 1px solid #e3dcd5;
                        "
                      >
                        <div
                          style="
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 24px;
                            letter-spacing: 5px;
                            color: #3d342e;
                            margin-bottom: 8px;
                          "
                        >
                          MILKMOTH
                        </div>

                        <div
                          style="
                            font-size: 13px;
                            font-style: italic;
                            letter-spacing: 0.5px;
                            color: #8b7d72;
                          "
                        >
                          soft relics for daydreamers
                        </div>
                      </td>
                    </tr>

                    <!-- Main message -->
                    <tr>
                      <td style="padding: 42px 40px 20px;">
                        <div
                          style="
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 11px;
                            letter-spacing: 2.5px;
                            text-transform: uppercase;
                            color: #9a897c;
                            margin-bottom: 14px;
                          "
                        >
                          Your order is on its way
                        </div>

                        <h1
                          style="
                            margin: 0 0 20px;
                            font-size: 30px;
                            line-height: 1.25;
                            font-weight: normal;
                            color: #3d342e;
                          "
                        >
                          A little relic<br />
                          is making its way to you ♡
                        </h1>

                        <p
                          style="
                            margin: 0;
                            font-size: 16px;
                            line-height: 1.8;
                            color: #5d5148;
                          "
                        >
                          Hi ${customerName},
                        </p>

                        <p
                          style="
                            margin: 14px 0 0;
                            font-size: 16px;
                            line-height: 1.8;
                            color: #5d5148;
                          "
                        >
                          Your Milkmoth order has been handed
                          over to the courier and is now on its
                          way to you.
                        </p>
                      </td>
                    </tr>

                    <!-- Order reference -->
                    <tr>
                      <td style="padding: 18px 40px 10px;">
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                        >
                          <tr>
                            <td
                              style="
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 11px;
                                letter-spacing: 1.5px;
                                text-transform: uppercase;
                                color: #9a897c;
                              "
                            >
                              Order
                            </td>

                            <td
                              align="right"
                              style="
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 13px;
                                color: #4d423a;
                              "
                            >
                              ${receiptNumber}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Item -->
                    <tr>
                      <td style="padding: 10px 40px 26px;">
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            border-top: 1px solid #e3dcd5;
                            border-bottom: 1px solid #e3dcd5;
                          "
                        >
                          <tr>
                            <td style="padding: 22px 0;">
                              <div
                                style="
                                  font-size: 18px;
                                  line-height: 1.4;
                                  color: #3d342e;
                                "
                              >
                                ${productName}
                              </div>

                              <div
                                style="
                                  margin-top: 7px;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 11px;
                                  letter-spacing: 1px;
                                  color: #9a897c;
                                "
                              >
                                ${sku}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Shipping details -->
                    <tr>
                      <td style="padding: 0 40px 34px;">
                        <div
                          style="
                            background-color: #f2ede7;
                            border: 1px solid #e0d7cf;
                            padding: 24px;
                          "
                        >
                          <div
                            style="
                              font-family: Arial, Helvetica, sans-serif;
                              font-size: 10px;
                              letter-spacing: 2px;
                              text-transform: uppercase;
                              color: #9a897c;
                              margin-bottom: 20px;
                            "
                          >
                            Shipping details
                          </div>

                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>
                              <td
                                style="
                                  padding-bottom: 14px;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 13px;
                                  color: #75675d;
                                "
                              >
                                Courier
                              </td>

                              <td
                                align="right"
                                style="
                                  padding-bottom: 14px;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 13px;
                                  font-weight: 600;
                                  color: #3d342e;
                                "
                              >
                                ${courier}
                              </td>
                            </tr>

                            <tr>
                              <td
                                style="
                                  padding-top: 14px;
                                  border-top: 1px solid #ddd4cb;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 13px;
                                  color: #75675d;
                                "
                              >
                                Tracking number
                              </td>

                              <td
                                align="right"
                                style="
                                  padding-top: 14px;
                                  border-top: 1px solid #ddd4cb;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 13px;
                                  font-weight: 600;
                                  color: #3d342e;
                                  word-break: break-all;
                                "
                              >
                                ${trackingNumber}
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>

                    <!-- Tracking note -->
                    <tr>
                      <td
                        align="center"
                        style="padding: 0 40px 38px;"
                      >
                        <p
                          style="
                            margin: 0;
                            font-size: 14px;
                            line-height: 1.8;
                            color: #75675d;
                          "
                        >
                          You can use your tracking number
                          above to follow your parcel's journey
                          with the courier.
                        </p>
                      </td>
                    </tr>

                    <!-- Closing -->
                    <tr>
                      <td
                        align="center"
                        style="
                          padding: 30px 40px 42px;
                          border-top: 1px solid #e3dcd5;
                        "
                      >
                        <p
                          style="
                            margin: 0 0 12px;
                            font-size: 17px;
                            line-height: 1.7;
                            color: #4d423a;
                          "
                        >
                          Thank you for giving this little relic
                          a new home. ♡
                        </p>

                        <div
                          style="
                            margin-top: 22px;
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 10px;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            color: #9a897c;
                          "
                        >
                          — milkmoth —
                        </div>
                      </td>
                    </tr>

                  </table>

                  <!-- Footer -->
                  <div
                    style="
                      max-width: 560px;
                      padding: 22px 20px 0;
                      font-family: Arial, Helvetica, sans-serif;
                      font-size: 10px;
                      line-height: 1.6;
                      letter-spacing: 0.5px;
                      color: #9a897c;
                      text-align: center;
                    "
                  >
                    This is an automated shipping notification
                    from Milkmoth.
                  </div>

                </td>
              </tr>
            </table>
          </body>
        </html>
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