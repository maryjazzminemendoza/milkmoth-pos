import { useEffect, useState } from 'react'
import { Plus, PackageOpen, MoreHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductModal from '../components/ProductModal'
import ProductActionsModal from '../components/ProductActionsModal'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  async function fetchProducts() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  async function handleAddProduct(product) {
    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        capital: product.capital,
        price: product.price,
      })
      .select()
      .single()

    if (error) {
      setSaving(false)
      throw new Error(error.message)
    }

    setProducts((currentProducts) => [data, ...currentProducts])
    setSaving(false)
    setShowModal(false)
  }

  async function handleEditProduct(changes) {
    if (!selectedProduct) return

    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .update({
        name: changes.name,
        price: changes.price,
      })
      .eq('id', selectedProduct.id)
      .select()
      .single()

    if (error) {
      setSaving(false)
      throw new Error(error.message)
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === data.id ? data : product
      )
    )

    setSelectedProduct(null)
    setSaving(false)
  }

  async function handleSellProduct(sale) {
    if (!selectedProduct) return

    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        sale_price: sale.sale_price,
        sale_channel: sale.sale_channel,
      })
      .eq('id', selectedProduct.id)
      .select()
      .single()

    if (error) {
      setSaving(false)
      throw new Error(error.message)
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === data.id ? data : product
      )
    )

    setSelectedProduct(null)
    setSaving(false)
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return

    setSaving(true)

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', selectedProduct.id)

    if (error) {
      setSaving(false)
      throw new Error(error.message)
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) => product.id !== selectedProduct.id
      )
    )

    setSelectedProduct(null)
    setSaving(false)
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div>
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Products</h2>
          <p className="page-description">
            Keep track of every one-of-a-kind piece.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Add product
        </button>
      </div>

      {error && (
        <div className="page-error">
          <strong>Something went wrong.</strong>
          <span>{error}</span>

          <button
            className="secondary-button"
            onClick={fetchProducts}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="products-container">
          <div className="loading-content">
            Loading products...
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="products-container">
          <div className="empty-state">
            <PackageOpen size={32} strokeWidth={1.4} />

            <h4>No products yet</h4>

            <p>
              Add your first Milkmoth piece to start building your
              inventory.
            </p>

            <button
              className="secondary-button"
              onClick={() => setShowModal(true)}
            >
              <Plus size={17} />
              Add your first product
            </button>
          </div>
        </div>
      ) : (
        <div className="products-list">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card-main">
                <div className="product-placeholder">
                  <PackageOpen size={20} strokeWidth={1.5} />
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>

                  <p>
                    Added{' '}
                    {new Date(product.created_at).toLocaleDateString(
                      'en-PH',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="product-card-right">
                <strong>
                  {product.status === 'sold'
                    ? formatPrice(product.sale_price)
                    : formatPrice(product.price)}
                </strong>

                <span
                  className={`status-badge ${
                    product.status === 'sold'
                      ? 'status-sold'
                      : 'status-available'
                  }`}
                >
                  {product.status === 'sold'
                    ? 'Sold'
                    : 'Available'}
                </span>

                <button
                  className="icon-button"
                  aria-label={`Options for ${product.name}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <MoreHorizontal size={19} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal
          onSubmit={handleAddProduct}
          onClose={() => {
            if (!saving) {
              setShowModal(false)
            }
          }}
          loading={saving}
        />
      )}

      {selectedProduct && (
        <ProductActionsModal
          product={selectedProduct}
          onClose={() => {
            if (!saving) {
              setSelectedProduct(null)
            }
          }}
          onEdit={handleEditProduct}
          onSell={handleSellProduct}
          onDelete={handleDeleteProduct}
          loading={saving}
        />
      )}
    </div>
  )
}

export default Products