import { useEffect, useState } from 'react'
import {
  Pencil,
  ShoppingBag,
  Truck,
  Printer,
  Trash2,
  X,
} from 'lucide-react'

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

  const [name, setName] = useState(product.name ?? '')
  const [price, setPrice] = useState(product.price ?? '')

  const [salePrice, setSalePrice] = useState(
    product.sale_price ?? ''
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
  const [trackingUrl, setTrackingUrl] = useState(
    product.tracking_url ?? ''
  )

  const [formError, setFormError] = useState('')

  useEffect(() => {
    setMode('menu')
    setFormError('')

    setName(product.name ?? '')
    setPrice(product.price ?? '')

    setSalePrice(product.sale_price ?? '')
    setSaleChannel(product.sale_channel ?? 'instagram')
    setCustomerName(product.customer_name ?? '')
    setCustomerEmail(product.customer_email ?? '')
    setCustomerContact(product.customer_contact ?? '')
    setCustomerAddress(product.customer_address ?? '')

    setCourier(product.courier ?? '')
    setTrackingNumber(product.tracking_number ?? '')
    setTrackingUrl(product.tracking_url ?? '')
  }, [product])

  function handleEditSubmit(event) {
    event.preventDefault()

    setFormError('')

    const trimmedName = name.trim()
    const numericPrice = Number(price)

    if (!trimmedName) {
      setFormError('Please enter an item name.')
      return
    }

    if (
      price === '' ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setFormError('Please enter a valid selling price.')
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

    if (
      salePrice === '' ||
      Number.isNaN(numericSalePrice) ||
      numericSalePrice < 0
    ) {
      setFormError('Please enter a valid sale price.')
      return
    }

    if (!customerName.trim()) {
      setFormError('Please enter the customer name.')
      return
    }

    if (!customerEmail.trim()) {
      setFormError('Please enter the customer email.')
      return
    }

    if (!customerContact.trim()) {
      setFormError('Please enter the customer contact.')
      return
    }

    if (!customerAddress.trim()) {
      setFormError('Please enter the customer address.')
      return
    }

    onSell({
      sale_price: numericSalePrice,
      sale_channel: saleChannel,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_contact: customerContact.trim(),
      customer_address: customerAddress.trim(),
    })
  }

  function handleShipSubmit(event) {
    event.preventDefault()

    setFormError('')

    const trimmedCourier = courier.trim()

    if (!trimmedCourier) {
      setFormError('Please select a courier.')
      return
    }

    if (trimmedCourier === 'J&T Express') {
      const trimmedTrackingNumber = trackingNumber.trim()

      if (!trimmedTrackingNumber) {
        setFormError('Please enter the tracking number.')
        return
      }

      onShip({
        courier: trimmedCourier,
        tracking_number: trimmedTrackingNumber,
        tracking_url: null,
      })

      return
    }

    if (trimmedCourier === 'Lalamove') {
      const trimmedTrackingUrl = trackingUrl.trim()

      if (!trimmedTrackingUrl) {
        setFormError('Please enter the Lalamove tracking link.')
        return
      }

      try {
        const url = new URL(trimmedTrackingUrl)

        if (
          url.protocol !== 'http:' &&
          url.protocol !== 'https:'
        ) {
          throw new Error()
        }
      } catch {
        setFormError(
          'Please enter a valid tracking link.'
        )
        return
      }

      onShip({
        courier: trimmedCourier,
        tracking_number: null,
        tracking_url: trimmedTrackingUrl,
      })
    }
  }

  function handleCourierChange(event) {
    const value = event.target.value

    setCourier(value)

    // Clear the other tracking field when switching couriers.
    if (value === 'J&T Express') {
      setTrackingUrl('')
    }

    if (value === 'Lalamove') {
      setTrackingNumber('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{product.name}</h2>

            <p>
              {product.sku}
            </p>
          </div>

          <button
            className="icon-button"
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
              onClick={() => {
                setFormError('')
                setMode('edit')
              }}
            >
              <Pencil size={18} />

              <div>
                <strong>Edit product</strong>

                <span>
                  Change the item name or price.
                </span>
              </div>
            </button>

            {product.status === 'available' && (
              <button
                className="action-menu-item"
                onClick={() => {
                  setFormError('')
                  setMode('sell')
                }}
              >
                <ShoppingBag size={18} />

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
                    onClick={() => {
                      setFormError('')
                      setMode('ship')
                    }}
                  >
                    <Truck size={18} />

                    <div>
                      <strong>Mark as shipped</strong>

                      <span>
                        Add the courier and tracking details.
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

            {product.status === 'sold' &&
              product.shipping_status === 'shipped' && (
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
              )}

            <button
              className="action-menu-item danger"
              onClick={() => {
                setFormError('')
                setMode('delete')
              }}
            >
              <Trash2 size={18} />

              <div>
                <strong>Delete product</strong>

                <span>
                  Permanently remove this item.
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
                Sale price
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
                Sale channel
              </label>

              <select
                id="sale-channel"
                value={saleChannel}
                onChange={(event) =>
                  setSaleChannel(event.target.value)
                }
                disabled={loading}
              >
                <option value="instagram">
                  Instagram
                </option>

                <option value="tiktok">
                  TikTok
                </option>

                <option value="other">
                  Other
                </option>
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
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-contact">
                Customer contact
              </label>

              <input
                id="customer-contact"
                type="text"
                value={customerContact}
                onChange={(event) =>
                  setCustomerContact(event.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-address">
                Customer address
              </label>

              <textarea
                id="customer-address"
                value={customerAddress}
                onChange={(event) =>
                  setCustomerAddress(event.target.value)
                }
                disabled={loading}
                rows="3"
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

              <select
                id="shipping-courier"
                value={courier}
                onChange={handleCourierChange}
                disabled={loading}
                autoFocus
              >
                <option value="">
                  Select courier
                </option>

                <option value="J&T Express">
                  J&T Express
                </option>

                <option value="Lalamove">
                  Lalamove
                </option>
              </select>
            </div>

            {courier === 'J&T Express' && (
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
            )}

            {courier === 'Lalamove' && (
              <div className="form-group">
                <label htmlFor="tracking-url">
                  Tracking link
                </label>

                <input
                  id="tracking-url"
                  type="url"
                  value={trackingUrl}
                  onChange={(event) =>
                    setTrackingUrl(event.target.value)
                  }
                  placeholder="Paste Lalamove tracking link"
                  disabled={loading}
                />
              </div>
            )}

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
                disabled={loading || !courier}
              >
                {loading ? 'Saving...' : 'Mark as shipped'}
              </button>
            </div>
          </form>
        )}

        {mode === 'delete' && (
          <div className="delete-confirmation">
            <h3>Delete this product?</h3>

            <p>
              This will permanently remove{' '}
              <strong>{product.name}</strong> from
              your inventory.
            </p>

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