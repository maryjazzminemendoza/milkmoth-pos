import { useState } from 'react'

function ProductForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    const trimmedName = name.trim()
    const numericPrice = Number(price)

    if (!trimmedName) {
      setError('Please enter an item name.')
      return
    }

    if (!price || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('Please enter a valid price.')
      return
    }

    try {
      await onSubmit({
        name: trimmedName,
        price: numericPrice,
      })

      setName('')
      setPrice('')
    } catch (error) {
      setError(error.message || 'Something went wrong.')
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="product-name">
          Item name
        </label>

        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. White lace camisole"
          autoFocus
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="product-price">
          Price
        </label>

        <div className="price-input">
          <span>₱</span>

          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="450"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add product'}
        </button>
      </div>
    </form>
  )
}

export default ProductForm