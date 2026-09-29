import { useEffect, useState } from 'react'
import {
  Plus,
  PackageOpen,
  MoreHorizontal,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { printReceipt } from '../utils/receipt'
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

  async function generateNextSku() {
    const { data, error } = await supabase
      .from('products')
      .select('sku')

    if (error) {
      throw new Error(error.message)
    }

    const highestNumber = (data || []).reduce(
      (highest, product) => {
        const match = product.sku?.match(/^MM-(\d+)$/)

        if (!match) {
          return highest
        }

        return Math.max(
          highest,
          Number(match[1])
        )
      },
      0
    )

    return `MM-${String(highestNumber + 1).padStart(4, '0')}`
  }

  async function generateReceiptNumber() {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0')
    const day = String(
      now.getDate()
    ).padStart(2, '0')

    const datePrefix = `MM-${year}${month}${day}-`

    const { data, error } = await supabase
      .from('products')
      .select('receipt_number')
      .like('receipt_number', `${datePrefix}%`)

    if (error) {
      throw new Error(error.message)
    }

    const highestNumber = (data || []).reduce(
      (highest, product) => {
        const match =
          product.receipt_number?.match(
            new RegExp(`^${datePrefix}(\\d+)$`)
          )

        if (!match) {
          return highest
        }

        return Math.max(
          highest,
          Number(match[1])
        )
      },
      0
    )

    return `${datePrefix}${String(
      highestNumber + 1
    ).padStart(3, '0')}`
  }

  async function handleAddProduct(product) {
    setSaving(true)

    try {
      const sku = await generateNextSku()

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          price: product.price,
          sku,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setProducts((currentProducts) => [
        data,
        ...currentProducts,
      ])

      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleEditProduct(changes) {
    if (!selectedProduct) return

    setSaving(true)

    try {
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
        throw new Error(error.message)
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === data.id
            ? data
            : product
        )
      )

      setSelectedProduct(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleSellProduct(sale) {
    if (!selectedProduct) return

    setSaving(true)

    try {
      const receiptNumber =
        await generateReceiptNumber()

      const { data, error } = await supabase
        .from('products')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          sale_price: sale.sale_price,
          sale_channel: sale.sale_channel,
          receipt_number: receiptNumber,
          customer_name: sale.customer_name,
          customer_email: sale.customer_email,
          customer_contact: sale.customer_contact,
          customer_address: sale.customer_address,
        })
        .eq('id', selectedProduct.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === data.id
            ? data
            : product
        )
      )

      setSelectedProduct(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleShipProduct(shipping) {
    if (!selectedProduct) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          shipping_status: 'shipped',
          courier: shipping.courier,
          tracking_number: shipping.tracking_number,
          tracking_url: shipping.tracking_url,
          shipped_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      try {
        const response = await fetch(
          '/api/send-shipping-email',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerEmail: data.customer_email,
              customerName: data.customer_name,
              productName: data.name,
              sku: data.sku,
              receiptNumber: data.receipt_number,
              courier: data.courier,
              trackingNumber: data.tracking_number,
              trackingUrl: data.tracking_url,
            }),
          }
        )

        const emailResult = await response.json()

        if (!response.ok) {
          throw new Error(
            emailResult.error ||
              'Failed to send shipping email.'
          )
        }

        const {
          data: updatedProduct,
          error: emailUpdateError,
        } = await supabase
          .from('products')
          .update({
            shipping_email_sent_at:
              new Date().toISOString(),
          })
          .eq('id', data.id)
          .select()
          .single()

        if (emailUpdateError) {
          throw new Error(emailUpdateError.message)
        }

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === updatedProduct.id
              ? updatedProduct
              : product
          )
        )

        setSelectedProduct(null)
      } catch (emailError) {
        console.error(
          'Shipping email failed:',
          emailError
        )

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === data.id
              ? data
              : product
          )
        )

        setSelectedProduct(null)

        window.alert(
          'The order was marked as shipped, but the shipping email could not be sent. We can add a resend option next.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id)

      if (error) {
        throw new Error(error.message)
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) =>
            product.id !== selectedProduct.id
        )
      )

      setSelectedProduct(null)
    } finally {
      setSaving(false)
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
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
            <PackageOpen
              size={32}
              strokeWidth={1.4}
            />

            <h4>No products yet</h4>

            <p>
              Add your first Milkmoth piece to start
              building your inventory.
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
            <article
              className="product-card"
              key={product.id}
            >
              <div className="product-card-main">
                <div className="product-placeholder">
                  <PackageOpen
                    size={20}
                    strokeWidth={1.5}
                  />
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>

                  <p>
                    {product.sku || 'No SKU'} · Added{' '}
                    {new Date(
                      product.created_at
                    ).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
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
                  onClick={() =>
                    setSelectedProduct(product)
                  }
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
          onShip={handleShipProduct}
          onDelete={handleDeleteProduct}
          onPrintReceipt={printReceipt}
          loading={saving}
        />
      )}
    </div>
  )
}

export default Products