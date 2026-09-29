import { X } from 'lucide-react'
import ProductForm from './ProductForm'

function ProductModal({
  onSubmit,
  onClose,
  loading,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Inventory</p>
            <h3>Add product</h3>
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

        <ProductForm
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default ProductModal