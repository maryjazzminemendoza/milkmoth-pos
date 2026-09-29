import { useState } from 'react'
import { X, Trash2, Printer, Truck } from 'lucide-react'

function ProductActionsModal({
  product,
  onClose,
  onEdit,
  onSell,
  onShip,
  onDelete,
  onPrintReceipt,
  loading,
}) {
  const [mode, setMode] = useState('menu')

  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)

  const [salePrice, setSalePrice] = useState(
    product.sale_price ?? product.price
  )

  const [saleChannel, setSaleChannel] = useState(
    product.sale_channel ?? 'instagram'
  )

  const [customerName, setCustomerName] = useState(
    product.customer_name ?? ''
  )

  const [customerEmail, setCustomerEmail] = useState(
    product.customer_email ?? ''
  )

  const [customerContact, setCustomerContact] = useState(
    product.customer_contact ?? ''
  )

  const [customerAddress, setCustomerAddress] = useState(
    product.customer_address ?? ''
  )

  const [courier, setCourier] = useState(
    product.courier ?? ''
  )

  const [trackingNumber, setTrackingNumber] = useState(
    product.tracking_number ?? ''
  )

  const [formError, setFormError] = useState('')

  function handleEditSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    const numericPrice = Number(price)

    if (
      !trimmedName ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      return
    }

    onEdit({
      name: trimmedName,
      price: numericPrice,
    })
  }

  function handleSellSubmit(event) {
    event.preventDefault()

    setFormError('')

    const numericSalePrice = Number(salePrice)
    const trimmedCustomerName = customerName.trim()
    const trimmedCustomerEmail = customerEmail.trim()
    const trimmedCustomerContact = customerContact.trim()
    const trimmedCustomerAddress = customerAddress.trim()

    if (
      salePrice === '' ||
      Number.isNaN(numericSalePrice) ||
      numericSalePrice < 0
    ) {
      setFormError('Please enter a valid sale amount.')
      return
    }

    if (!trimmedCustomerName) {
      setFormError('Please enter the customer name.')
      return
    }

    if (!trimmedCustomerEmail) {
      setFormError('Please enter the customer email.')
      return
    }

    if (!trimmedCustomerContact) {
      setFormError('Please enter the customer contact number.')
      return
    }

    if (!trimmedCustomerAddress) {
      setFormError('Please enter the customer address.')
      return
    }

    onSell({
      sale_price: numericSalePrice,
      sale_channel: saleChannel,
      customer_name: trimmedCustomerName,
      customer_email: trimmedCustomerEmail,
      customer_contact: trimmedCustomerContact,
      customer_address: trimmedCustomerAddress,
    })
  }

  function handleShipSubmit(event) {
    event.preventDefault()

    setFormError('')

    const trimmedCourier = courier.trim()
    const trimmedTrackingNumber = trackingNumber.trim()

    if (!trimmedCourier) {
      setFormError('Please enter the courier.')
      return
    }

    if (!trimmedTrackingNumber) {
      setFormError('Please enter the tracking number.')
      return
    }

    onShip({
      courier: trimmedCourier,
      tracking_number: trimmedTrackingNumber,
    })
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose()
        }
      }}
    >
      <div className="modal action-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Product</p>
            <h3>{product.name}</h3>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {mode === 'menu' && (
          <div className="action-menu">
            <button
              className="action-menu-item"
              onClick={() => setMode('edit')}
            >
              <div>
                <strong>Edit product</strong>
                <span>
                  Change the item name or selling price.
                </span>
              </div>
            </button>

            {product.status === 'available' && (
              <button
                className="action-menu-item"
                onClick={() => setMode('sell')}
              >
                <div>
                  <strong>Mark as sold</strong>
                  <span>
                    Record the sale and customer details.
                  </span>
                </div>
              </button>
            )}

            {product.status === 'sold' &&
                product.shipping_status !== 'shipped' && (
              <>
                <button
                  className="action-menu-item"
                  onClick={() => setMode('ship')}
                >
                  <Truck size={18} />

                  <div>
                    <strong>Mark as shipped</strong>
                    <span>
                      Add the courier and tracking number.
                    </span>
                  </div>
                </button>

                <button
                  className="action-menu-item"
                  onClick={() => onPrintReceipt(product)}
                >
                  <Printer size={18} />

                  <div>
                    <strong>Print receipt</strong>
                    <span>
                      Print this customer's receipt.
                    </span>
                  </div>
                </button>
              </>
            )}

            <button
              className="action-menu-item action-menu-danger"
              onClick={() => setMode('delete')}
            >
              <Trash2 size={18} />

              <div>
                <strong>Delete product</strong>
                <span>
                  Remove this item from your inventory.
                </span>
              </div>
            </button>
          </div>
        )}

        {mode === 'edit' && (
          <form
            className="product-form"
            onSubmit={handleEditSubmit}
          >
            <div className="form-group">
              <label htmlFor="edit-product-name">
                Item name
              </label>

              <input
                id="edit-product-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-product-price">
                Selling price
              </label>

              <div className="price-input">
                <span>₱</span>

                <input
                  id="edit-product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Back
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {mode === 'sell' && (
          <form
            className="product-form"
            onSubmit={handleSellSubmit}
          >
            <div className="form-group">
              <label htmlFor="sale-price">
                Amount
              </label>

              <div className="price-input">
                <span>₱</span>

                <input
                  id="sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(event) =>
                    setSalePrice(event.target.value)
                  }
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sale-channel">
                Sold through
              </label>

              <select
                id="sale-channel"
                value={saleChannel}
                onChange={(event) =>
                  setSaleChannel(event.target.value)
                }
                disabled={loading}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customer-name">
                Customer name
              </label>

              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="Jane Doe"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-email">
                Customer email
              </label>

              <input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(event.target.value)
                }
                placeholder="jane@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-contact">
                Contact #
              </label>

              <input
                id="customer-contact"
                type="tel"
                value={customerContact}
                onChange={(event) =>
                  setCustomerContact(event.target.value)
                }
                placeholder="09XX XXX XXXX"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-address">
                Address
              </label>

              <textarea
                id="customer-address"
                value={customerAddress}
                onChange={(event) =>
                  setCustomerAddress(event.target.value)
                }
                placeholder="Customer's delivery address"
                rows="3"
                disabled={loading}
              />
            </div>

            {formError && (
              <p className="form-error">{formError}</p>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Back
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Mark as sold'}
              </button>
            </div>
          </form>
        )}

        {mode === 'ship' && (
          <form
            className="product-form"
            onSubmit={handleShipSubmit}
          >
            <div className="form-group">
              <label htmlFor="shipping-courier">
                Courier
              </label>

              <input
                id="shipping-courier"
                type="text"
                value={courier}
                onChange={(event) =>
                  setCourier(event.target.value)
                }
                placeholder="e.g. J&T Express"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="tracking-number">
                Tracking number
              </label>

              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(event.target.value)
                }
                placeholder="Enter tracking number"
                disabled={loading}
              />
            </div>

            {formError && (
              <p className="form-error">{formError}</p>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Back
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Mark as shipped'}
              </button>
            </div>
          </form>
        )}

        {mode === 'delete' && (
          <div className="delete-confirm">
            <div className="delete-icon">
              <Trash2 size={22} />
            </div>

            <h4>Delete this product?</h4>

            <p>
              This will permanently remove{' '}
              <strong>{product.name}</strong> from your inventory.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={onDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductActionsModal