import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'

function ProductActionsModal({
  product,
  onClose,
  onEdit,
  onSell,
  onDelete,
  loading,
}) {
  const [mode, setMode] = useState('menu')

  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)

  const [salePrice, setSalePrice] = useState(product.sale_price ?? product.price)
  const [saleChannel, setSaleChannel] = useState(
    product.sale_channel ?? 'instagram'
  )

  function handleEditSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    const numericPrice = Number(price)

    if (!trimmedName || Number.isNaN(numericPrice) || numericPrice < 0) {
      return
    }

    onEdit({
      name: trimmedName,
      price: numericPrice,
    })
  }

  function handleSellSubmit(event) {
    event.preventDefault()

    const numericSalePrice = Number(salePrice)

    if (
      Number.isNaN(numericSalePrice) ||
      numericSalePrice < 0
    ) {
      return
    }

    onSell({
      sale_price: numericSalePrice,
      sale_channel: saleChannel,
    })
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
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
                <span>Change the item name or price.</span>
              </div>
            </button>

            {product.status === 'available' && (
              <button
                className="action-menu-item"
                onClick={() => setMode('sell')}
              >
                <div>
                  <strong>Mark as sold</strong>
                  <span>Record the sale price and selling channel.</span>
                </div>
              </button>
            )}

            <button
              className="action-menu-item action-menu-danger"
              onClick={() => setMode('delete')}
            >
              <Trash2 size={18} />

              <div>
                <strong>Delete product</strong>
                <span>Remove this item from your inventory.</span>
              </div>
            </button>
          </div>
        )}

        {mode === 'edit' && (
          <form className="product-form" onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label htmlFor="edit-product-name">Item name</label>
              <input
                id="edit-product-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-product-price">Price</label>

              <div className="price-input">
                <span>₱</span>

                <input
                  id="edit-product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
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
          <form className="product-form" onSubmit={handleSellSubmit}>
            <div className="form-group">
              <label htmlFor="sale-price">Sale price</label>

              <div className="price-input">
                <span>₱</span>

                <input
                  id="sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(event) => setSalePrice(event.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sale-channel">Sold through</label>

              <select
                id="sale-channel"
                value={saleChannel}
                onChange={(event) => setSaleChannel(event.target.value)}
                disabled={loading}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Other</option>
              </select>
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
                {loading ? 'Saving...' : 'Mark as sold'}
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
              This will permanently remove <strong>{product.name}</strong>{' '}
              from your inventory.
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