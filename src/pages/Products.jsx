import { useEffect, useState } from 'react'
import {
  Plus,
  PackageOpen,
  MoreHorizontal,
  Check,
  Copy,
  Link,
  X,
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

  // Claim state
  const [selectedClaimProducts, setSelectedClaimProducts] =
    useState([])

  const [creatingClaim, setCreatingClaim] = useState(false)
  const [claimResult, setClaimResult] = useState(null)
  const [copied, setCopied] = useState(false)

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
      .like(
        'receipt_number',
        `${datePrefix}%`
      )

    if (error) {
      throw new Error(error.message)
    }

    const highestNumber = (data || []).reduce(
      (highest, product) => {
        const match =
          product.receipt_number?.match(
            new RegExp(
              `^${datePrefix}(\\d+)$`
            )
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
    } catch (error) {
      window.alert(error.message)
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
    } catch (error) {
      window.alert(error.message)
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
    } catch (error) {
      window.alert(error.message)
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
          tracking_number:
            shipping.tracking_number,
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
              customerEmail:
                data.customer_email,
              customerName:
                data.customer_name,
              productName: data.name,
              sku: data.sku,
              receiptNumber:
                data.receipt_number,
              courier: data.courier,
              trackingNumber:
                data.tracking_number,
              trackingUrl:
                data.tracking_url,
            }),
          }
        )

        const emailResult =
          await response.json()

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
          throw new Error(
            emailUpdateError.message
          )
        }

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id ===
            updatedProduct.id
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
    } catch (error) {
      window.alert(error.message)
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
    } catch (error) {
      window.alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  /*
   * -----------------------------
   * CLAIM FUNCTIONS
   * -----------------------------
   */

  function toggleClaimProduct(product) {
    if (product.status !== 'available') {
      return
    }

    setSelectedClaimProducts((current) => {
      const exists = current.some(
        (item) => item.id === product.id
      )

      if (exists) {
        return current.filter(
          (item) => item.id !== product.id
        )
      }

      return [...current, product]
    })
  }

  function isClaimProductSelected(productId) {
    return selectedClaimProducts.some(
      (product) => product.id === productId
    )
  }

  function clearClaimSelection() {
    setSelectedClaimProducts([])
  }

  function getClaimTotal() {
    return selectedClaimProducts.reduce(
      (total, product) =>
        total + Number(product.price || 0),
      0
    )
  }

  async function handleCreateClaim() {
    if (selectedClaimProducts.length === 0) {
      return
    }

    setCreatingClaim(true)

    try {
      const productIds =
        selectedClaimProducts.map(
          (product) => product.id
        )

      const { data, error } =
        await supabase.rpc(
          'create_claim',
          {
            p_product_ids: productIds,
          }
        )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success || !data?.token) {
        throw new Error(
          'The claim could not be created.'
        )
      }

      const claimLink =
        `${window.location.origin}/order/${data.token}`

      setClaimResult({
        ...data,
        link: claimLink,
      })

      setCopied(false)
    } catch (error) {
      console.error(
        'Create claim failed:',
        error
      )

      window.alert(
        error.message ||
          'Failed to create claim.'
      )
    } finally {
      setCreatingClaim(false)
    }
  }

  async function handleCopyClaimLink() {
    if (!claimResult?.link) return

    try {
      await navigator.clipboard.writeText(
        claimResult.link
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error(
        'Copy failed:',
        error
      )

      window.alert(
        'Could not copy the link. Please copy it manually.'
      )
    }
  }

  function closeClaimResult() {
    setClaimResult(null)
    setCopied(false)
    setSelectedClaimProducts([])
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
          <strong>
            Something went wrong.
          </strong>

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
              Add your first Milkmoth piece to
              start building your inventory.
            </p>

            <button
              className="secondary-button"
              onClick={() =>
                setShowModal(true)
              }
            >
              <Plus size={17} />
              Add your first product
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="products-list">
            {products.map((product) => {
              const selected =
                isClaimProductSelected(
                  product.id
                )

              const available =
                product.status === 'available'

              return (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <div
                    className="product-card-main"
                    style={{
                      gap: '14px',
                    }}
                  >
                    {available && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleClaimProduct(
                              product
                            )
                          }
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor:
                              '#1f1f1f',
                          }}
                          aria-label={`Select ${product.name} for claim`}
                        />
                      </label>
                    )}

                    {!available && (
                      <div
                        style={{
                          width: '18px',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <div className="product-placeholder">
                      <PackageOpen
                        size={20}
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="product-info">
                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.sku ||
                          'No SKU'}{' '}
                        · Added{' '}
                        {new Date(
                          product.created_at
                        ).toLocaleDateString(
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
                      {product.status ===
                      'sold'
                        ? formatPrice(
                            product.sale_price
                          )
                        : formatPrice(
                            product.price
                          )}
                    </strong>

                    <span
                      className={`status-badge ${
                        product.status ===
                        'sold'
                          ? 'status-sold'
                          : 'status-available'
                      }`}
                    >
                      {product.status ===
                      'sold'
                        ? 'Sold'
                        : 'Available'}
                    </span>

                    <button
                      className="icon-button"
                      aria-label={`Options for ${product.name}`}
                      onClick={() =>
                        setSelectedProduct(
                          product
                        )
                      }
                    >
                      <MoreHorizontal
                        size={19}
                      />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {selectedClaimProducts.length >
            0 && (
            <div
              style={{
                position: 'sticky',
                bottom: '20px',
                zIndex: 20,
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                gap: '20px',
                padding: '16px 18px',
                border:
                  '1px solid rgba(0,0,0,0.12)',
                borderRadius: '14px',
                background:
                  'rgba(255,255,255,0.96)',
                boxShadow:
                  '0 10px 30px rgba(0,0,0,0.12)',
                backdropFilter:
                  'blur(10px)',
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {selectedClaimProducts.length}{' '}
                  {selectedClaimProducts.length ===
                  1
                    ? 'piece'
                    : 'pieces'}{' '}
                  selected
                </strong>

                <span
                  style={{
                    fontSize: '14px',
                    opacity: 0.7,
                  }}
                >
                  Total:{' '}
                  {formatPrice(
                    getClaimTotal()
                  )}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '8px',
                }}
              >
                <button
                  className="secondary-button"
                  onClick={
                    clearClaimSelection
                  }
                  disabled={creatingClaim}
                >
                  Clear
                </button>

                <button
                  className="primary-button"
                  onClick={
                    handleCreateClaim
                  }
                  disabled={creatingClaim}
                >
                  <Link size={17} />

                  {creatingClaim
                    ? 'Creating...'
                    : 'Create claim link'}
                </button>
              </div>
            </div>
          )}
        </>
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

      {claimResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background:
              'rgba(0, 0, 0, 0.45)',
          }}
          onClick={closeClaimResult}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'flex-start',
                justifyContent:
                  'space-between',
                gap: '16px',
                marginBottom: '22px',
              }}
            >
              <div>
                <p className="eyebrow">
                  Claim created
                </p>

                <h3
                  style={{
                    margin:
                      '4px 0 6px',
                  }}
                >
                  Your claim link is ready
                </h3>

                <p
                  style={{
                    margin: 0,
                    opacity: 0.7,
                    fontSize: '14px',
                  }}
                >
                  Send this link to the
                  customer so they can
                  complete their order.
                </p>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeClaimResult
                }
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '10px',
                  marginBottom:
                    '18px',
                }}
              >
                {(claimResult.items ||
                  selectedClaimProducts
                ).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      gap: '16px',
                    }}
                  >
                    <span>
                      {item.name}
                    </span>

                    <strong>
                      {formatPrice(
                        item.price
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between',
                  paddingTop: '14px',
                  borderTop:
                    '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <strong>Total</strong>

                <strong>
                  {formatPrice(
                    (
                      claimResult.items ||
                      selectedClaimProducts
                    ).reduce(
                      (total, item) =>
                        total +
                        Number(
                          item.price ||
                            0
                        ),
                      0
                    )
                  )}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems:
                  'stretch',
                gap: '8px',
              }}
            >
              <input
                value={claimResult.link}
                readOnly
                onFocus={(event) =>
                  event.target.select()
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding:
                    '11px 12px',
                  border:
                    '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  background:
                    '#fafafa',
                  fontSize: '13px',
                }}
              />

              <button
                className="primary-button"
                onClick={
                  handleCopyClaimLink
                }
              >
                {copied ? (
                  <Check size={17} />
                ) : (
                  <Copy size={17} />
                )}

                {copied
                  ? 'Copied'
                  : 'Copy'}
              </button>
            </div>

            <p
              style={{
                margin:
                  '14px 0 0',
                fontSize: '12px',
                opacity: 0.6,
              }}
            >
              The items remain available
              until the customer submits
              this claim.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products