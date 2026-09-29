function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(price || 0))
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function printReceipt(product) {
  const printWindow = window.open(
    '',
    '_blank',
    'width=420,height=700'
  )

  if (!printWindow) {
    alert('Please allow pop-ups to print the receipt.')
    return
  }

  const channel =
    product.sale_channel === 'instagram'
      ? 'Instagram'
      : product.sale_channel === 'tiktok'
      ? 'TikTok'
      : 'Other'

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <title>
          ${escapeHtml(product.receipt_number || 'Milkmoth Receipt')}
        </title>

        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            width: 58mm;
            padding: 5mm 4mm;
            color: #222;
            font-family:
              "Courier New",
              Courier,
              monospace;
            font-size: 11px;
            line-height: 1.4;
          }

          .receipt {
            width: 100%;
          }

          .center {
            text-align: center;
          }

          .brand {
            margin-bottom: 1px;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 21px;
            letter-spacing: 0.08em;
          }

          .tagline {
            margin-bottom: 12px;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 9px;
            font-style: italic;
          }

          .receipt-title {
            margin-bottom: 12px;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 0.12em;
          }

          .divider {
            margin: 10px 0;
            border-top: 1px dashed #555;
          }

          .meta {
            display: grid;
            grid-template-columns: auto 1fr;
            column-gap: 6px;
            row-gap: 2px;
          }

          .meta-label {
            white-space: nowrap;
          }

          .customer-label {
            margin-bottom: 3px;
            font-weight: bold;
          }

          .customer {
            overflow-wrap: anywhere;
          }

          .customer-name {
            font-weight: bold;
          }

          .customer-line {
            margin-top: 1px;
          }

          .item-header,
          .item-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            column-gap: 8px;
          }

          .item-header {
            margin-bottom: 4px;
            font-weight: bold;
          }

          .item-amount {
            text-align: right;
            white-space: nowrap;
          }

          .item-name {
            overflow-wrap: anywhere;
          }

          .item-name-line {
            display: block;
          }

          .sku {
            font-size: 10px;
          }

          .total {
            display: grid;
            grid-template-columns: 1fr auto;
            column-gap: 8px;
            font-size: 12px;
            font-weight: bold;
          }

          .details {
            display: grid;
            grid-template-columns: auto 1fr;
            column-gap: 8px;
            row-gap: 2px;
          }

          .footer {
            margin-top: 14px;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 10px;
            font-style: italic;
          }

          @media print {
            body {
              padding: 4mm;
            }
          }
        </style>
      </head>

      <body>
        <main class="receipt">
          <div class="center">
            <div class="brand">MILKMOTH</div>
            <div class="tagline">
              soft relics for daydreamers
            </div>

            <div class="receipt-title">
              RECEIPT
            </div>
          </div>

          <div class="meta">
            <span class="meta-label">Receipt #:</span>
            <span>${escapeHtml(product.receipt_number)}</span>

            <span class="meta-label">Date:</span>
            <span>${formatDate(product.sold_at)}</span>
          </div>

          <div class="divider"></div>

          <div class="customer">
            <div class="customer-label">
              CUSTOMER
            </div>

            <div class="customer-name">
              ${escapeHtml(product.customer_name)}
            </div>

            <div class="customer-line">
              ${escapeHtml(product.customer_contact)}
            </div>

            <div class="customer-line">
              ${escapeHtml(product.customer_address)}
            </div>
          </div>

          <div class="divider"></div>

          <div class="item-header">
            <span>ITEM</span>
            <span>AMOUNT</span>
          </div>

          <div class="item-row">
            <div class="item-name">
              <span class="item-name-line">
                <span class="sku">
                  ${escapeHtml(product.sku)}
                </span>
                &nbsp;
                ${escapeHtml(product.name)}
              </span>
            </div>

            <div class="item-amount">
              ${formatPrice(product.sale_price)}
            </div>
          </div>

          <div class="divider"></div>

          <div class="total">
            <span>TOTAL</span>
            <span>${formatPrice(product.sale_price)}</span>
          </div>

          <div class="divider"></div>

          <div class="details">
            <span>Payment:</span>
            <span>GCash</span>

            <span>Channel:</span>
            <span>${channel}</span>
          </div>

          <div class="footer center">
            Thank you for your order ♡
          </div>
        </main>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(receiptHtml)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}