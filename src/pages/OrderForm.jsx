import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock,
  PackageOpen,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CART_KEY = 'milkmoth_claim_cart'

function getStoredCart() {
  try {
    const stored = localStorage.getItem(CART_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

function OrderForm() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [cart, setCart] = useState(getStoredCart)
  const [products, setProducts] = useState([])

  const [loadingProduct, setLoadingProduct] = useState(true)
  const [productError, setProductError] = useState('')

  const [view, setView] = useState(
    productId ? 'product' : 'cart'
  )

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [source, setSource] = useState('instagram')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submittedOrder, setSubmittedOrder] = useState(null)

  /*
   * Keep cart state synchronized with localStorage.
   */
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  /*
   * When opening a direct product link, fetch that piece.
   */
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) {
        setLoadingProduct(false)
        return
      }

      setLoadingProduct(true)
      setProductError('')

      const { data, error } = await supabase.rpc(
        'get_order_products',
        {
          p_product_ids: [productId],
        }
      )

      if (error) {
        console.error(
          'Product lookup failed:',
          error
        )

        setProductError(error.message)
        setProducts([])
      } else if (!data || data.length === 0) {
        setProductError(
          'This piece is no longer available.'
        )
        setProducts([])
      } else {
        setProducts(data)
      }

      setLoadingProduct(false)
    }

    fetchProduct()
  }, [productId])

  /*
   * If the customer arrives at /order without a
   * product ID, restore the cart from localStorage.
   */
  useEffect(() => {
    async function fetchCartProducts() {
      if (productId || cart.length === 0) {
        return
      }

      setLoadingProduct(true)
      setProductError('')

      const { data, error } = await supabase.rpc(
        'get_order_products',
        {
          p_product_ids: cart,
        }
      )

      if (error) {
        setProductError(error.message)
        setProducts([])
      } else {
        setProducts(data || [])
      }

      setLoadingProduct(false)
    }

    fetchCartProducts()
  }, [productId, cart])

  /*
   * Add current product to claim.
   */
  function addToClaim(product) {
    if (!cart.includes(product.id)) {
      const nextCart = [...cart, product.id]

      setCart(nextCart)
    }

    setView('cart')

    navigate('/order')
  }

  /*
   * Remove a product from claim.
   */
  function removeFromClaim(id) {
    setCart((current) =>
      current.filter((productId) => productId !== id)
    )
  }

  /*
   * Continue shopping from cart.
   */
  function continueShopping() {
    if (productId) {
      setView('product')
      return
    }

    window.history.back()
  }

  /*
   * Clear claim completely.
   */
  function clearClaim() {
    setCart([])
    setProducts([])
    localStorage.removeItem(CART_KEY)
    setView('cart')
  }

  /*
   * Format Philippine peso.
   */
  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  /*
   * Only display products that are actually in the cart.
   */
  const cartProducts = useMemo(() => {
    return cart
      .map((id) =>
        products.find((product) => product.id === id)
      )
      .filter(Boolean)
  }, [cart, products])

  const total = useMemo(() => {
    return cartProducts.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    )
  }, [cartProducts])

  const currentProduct = products.find(
    (product) => product.id === productId
  )

  /*
   * Submit the complete multi-item claim.
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (cart.length === 0) {
      setFormError(
        'Please add at least one piece to your claim.'
      )
      return
    }

    if (!customerName.trim()) {
      setFormError('Please enter your full name.')
      return
    }

    if (!customerEmail.trim()) {
      setFormError('Please enter your email address.')
      return
    }

    if (!customerContact.trim()) {
      setFormError('Please enter your mobile number.')
      return
    }

    if (!customerAddress.trim()) {
      setFormError(
        'Please enter your complete shipping address.'
      )
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.rpc(
        'submit_order',
        {
          p_product_ids: cart,
          p_customer_name: customerName.trim(),
          p_customer_email: customerEmail.trim(),
          p_customer_contact:
            customerContact.trim(),
          p_customer_address:
            customerAddress.trim(),
          p_source: source,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          'We could not submit your claim.'
        )
      }

      /*
       * The database has now reserved the pieces.
       * Clear the browser cart so they cannot
       * accidentally submit the same claim again.
       */
      localStorage.removeItem(CART_KEY)
      setCart([])

      setSubmittedOrder(data)
      setView('success')
    } catch (error) {
      console.error(
        'Order submission failed:',
        error
      )

      let message = error.message

      if (
        message.includes(
          'currently reserved for another buyer'
        )
      ) {
        message =
          'One or more pieces are currently reserved for another buyer. Please review your claim and try again.'
      }

      if (
        message.includes(
          'no longer available'
        )
      ) {
        message =
          'One or more pieces are no longer available. Please review your claim and try again.'
      }

      if (
        message.includes(
          'no longer exist'
        )
      ) {
        message =
          'One or more pieces could not be found. Please refresh and try again.'
      }

      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  /*
   * Loading state.
   */
  if (loadingProduct) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-loading">
          <PackageOpen
            size={28}
            strokeWidth={1.4}
          />

          <p>Loading piece...</p>
        </div>
      </div>
    )
  }

  /*
   * Success state.
   */
  if (view === 'success' && submittedOrder) {
    const submittedItems =
      submittedOrder.items || []

    return (
      <div className="customer-order-page">
        <div className="customer-order-card">
          <div className="customer-success-icon">
            <Check
              size={24}
              strokeWidth={1.7}
            />
          </div>

          <p className="customer-eyebrow">
            milkmoth
          </p>

          <h1>your pieces are on hold</h1>

          <p className="customer-intro">
            We've received your claim for{' '}
            {submittedItems.length}{' '}
            {submittedItems.length === 1
              ? 'piece'
              : 'pieces'}.
          </p>

          <div className="customer-order-summary">
            <div>
              <span>Order</span>

              <strong>
                {submittedOrder.order_id
                  .slice(0, 8)
                  .toUpperCase()}
              </strong>
            </div>

            <div>
              <span>Total</span>

              <strong>
                {formatPrice(
                  submittedOrder.total
                )}
              </strong>
            </div>
          </div>

          <div className="customer-submitted-items">
            {submittedItems.map((item) => (
              <div
                className="customer-submitted-item"
                key={item.id}
              >
                <span>{item.name}</span>

                <strong>
                  {formatPrice(item.price)}
                </strong>
              </div>
            ))}
          </div>

          <div className="customer-hold-notice">
            <Clock
              size={18}
              strokeWidth={1.6}
            />

            <div>
              <strong>
                Payment must be completed within 24
                hours.
              </strong>

              <p>
                Your pieces are temporarily held for
                you while you arrange payment.
              </p>
            </div>
          </div>

          <div className="customer-next-steps">
            <h3>what happens next?</h3>

            <ol>
              <li>
                Complete your payment through the
                payment instructions from Milkmoth.
              </li>

              <li>
                Keep your order reference in case you
                need to contact us.
              </li>

              <li>
                We'll confirm your order once payment
                has been received.
              </li>
            </ol>
          </div>

          <p className="customer-footer-note">
            Your order reference is{' '}
            <strong>
              {submittedOrder.order_id
                .slice(0, 8)
                .toUpperCase()}
            </strong>
          </p>
        </div>
      </div>
    )
  }

  /*
   * Cart / checkout view.
   */
  if (
    view === 'cart' ||
    (!productId && cart.length > 0)
  ) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-cart-card">
          <div className="customer-brand">
            <span>milkmoth</span>
            <small>
              soft relics for daydreamers
            </small>
          </div>

          <div className="customer-cart-heading">
            <p className="customer-eyebrow">
              your claim
            </p>

            <h1>
              {cartProducts.length}{' '}
              {cartProducts.length === 1
                ? 'piece'
                : 'pieces'}
            </h1>

            <p>
              Review your pieces before submitting
              your claim.
            </p>
          </div>

          {cartProducts.length === 0 ? (
            <div className="customer-empty-cart">
              <ShoppingBag
                size={30}
                strokeWidth={1.3}
              />

              <h2>your claim is empty</h2>

              <p>
                Add pieces from their individual
                claim links to start an order.
              </p>
            </div>
          ) : (
            <>
              <div className="customer-cart-items">
                {cartProducts.map((product) => (
                  <div
                    className="customer-cart-item"
                    key={product.id}
                  >
                    <div className="customer-cart-item-image">
                      <PackageOpen
                        size={22}
                        strokeWidth={1.3}
                      />
                    </div>

                    <div className="customer-cart-item-info">
                      <strong>
                        {product.name}
                      </strong>

                      {product.sku && (
                        <span>
                          {product.sku}
                        </span>
                      )}

                      <b>
                        {formatPrice(
                          product.price
                        )}
                      </b>
                    </div>

                    <button
                      type="button"
                      className="customer-remove-button"
                      onClick={() =>
                        removeFromClaim(
                          product.id
                        )
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2
                        size={16}
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="customer-cart-total">
                <span>Total</span>

                <strong>
                  {formatPrice(total)}
                </strong>
              </div>

              <div className="customer-cart-actions">
                <button
                  type="button"
                  className="customer-continue-button"
                  onClick={continueShopping}
                >
                  <ArrowLeft
                    size={16}
                    strokeWidth={1.6}
                  />
                  Continue shopping
                </button>

                <button
                  type="button"
                  className="customer-submit-button"
                  onClick={() => {
                    setFormError('')
                    setView('details')
                  }}
                >
                  Continue to details
                </button>
              </div>

              <button
                type="button"
                className="customer-clear-button"
                onClick={clearClaim}
              >
                Clear claim
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  /*
   * Customer details view.
   */
  if (view === 'details') {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card">
          <button
            type="button"
            className="customer-back-button"
            onClick={() => {
              setFormError('')
              setView('cart')
            }}
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.6}
            />
            Back to claim
          </button>

          <div className="customer-brand customer-details-brand">
            <span>milkmoth</span>

            <small>
              soft relics for daydreamers
            </small>
          </div>

          <div className="customer-form-heading">
            <h2>your details</h2>

            <p>
              Fill this out once for your whole
              claim.
            </p>
          </div>

          <div className="customer-details-summary">
            <div>
              <span>
                {cartProducts.length}{' '}
                {cartProducts.length === 1
                  ? 'piece'
                  : 'pieces'}
              </span>

              <strong>
                {formatPrice(total)}
              </strong>
            </div>
          </div>

          <form
            className="customer-form"
            onSubmit={handleSubmit}
          >
            <div className="customer-form-group">
              <label htmlFor="customer-name">
                Full name
              </label>

              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(
                    event.target.value
                  )
                }
                placeholder="Your full name"
                disabled={submitting}
                autoComplete="name"
              />
            </div>

            <div className="customer-form-group">
              <label htmlFor="customer-email">
                Email address
              </label>

              <input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                disabled={submitting}
                autoComplete="email"
              />

              <small>
                We'll use this for order and shipping
                updates.
              </small>
            </div>

            <div className="customer-form-group">
              <label htmlFor="customer-contact">
                Mobile number
              </label>

              <input
                id="customer-contact"
                type="tel"
                value={customerContact}
                onChange={(event) =>
                  setCustomerContact(
                    event.target.value
                  )
                }
                placeholder="09XXXXXXXXX"
                disabled={submitting}
                autoComplete="tel"
              />
            </div>

            <div className="customer-form-group">
              <label htmlFor="customer-address">
                Complete shipping address
              </label>

              <textarea
                id="customer-address"
                value={customerAddress}
                onChange={(event) =>
                  setCustomerAddress(
                    event.target.value
                  )
                }
                placeholder="House / unit, street, barangay, city, province, ZIP code"
                disabled={submitting}
                rows={4}
                autoComplete="street-address"
              />
            </div>

            <div className="customer-form-group">
              <label htmlFor="customer-source">
                Where did you see these pieces?
              </label>

              <select
                id="customer-source"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value)
                }
                disabled={submitting}
              >
                <option value="instagram">
                  Instagram
                </option>

                <option value="tiktok">
                  TikTok
                </option>

                <option value="facebook">
                  Facebook
                </option>

                <option value="referral">
                  Friend / referral
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {formError && (
              <div className="customer-form-error">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="customer-submit-button"
              disabled={submitting}
            >
              {submitting
                ? 'Holding your pieces...'
                : `Claim ${cartProducts.length} ${
                    cartProducts.length === 1
                      ? 'piece'
                      : 'pieces'
                  }`}
            </button>

            <p className="customer-payment-note">
              By submitting, you understand that
              these pieces will be held for 24 hours
              while you complete payment.
            </p>
          </form>
        </div>
      </div>
    )
  }

  /*
   * Product view.
   */
  if (productError || !currentProduct) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-unavailable">
          <PackageOpen
            size={32}
            strokeWidth={1.4}
          />

          <p className="customer-eyebrow">
            milkmoth
          </p>

          <h1>piece unavailable</h1>

          <p>
            {productError ||
              'This piece is no longer available.'}
          </p>

          {cart.length > 0 && (
            <button
              type="button"
              className="customer-submit-button customer-unavailable-button"
              onClick={() => navigate('/order')}
            >
              View your claim ({cart.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const alreadyAdded = cart.includes(
    currentProduct.id
  )

  return (
    <div className="customer-order-page">
      <div className="customer-order-card">
        <div className="customer-brand">
          <span>milkmoth</span>

          <small>
            soft relics for daydreamers
          </small>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            className="customer-claim-bar"
            onClick={() => navigate('/order')}
          >
            <span>
              <ShoppingBag
                size={16}
                strokeWidth={1.5}
              />

              {cart.length}{' '}
              {cart.length === 1
                ? 'piece'
                : 'pieces'}{' '}
              in your claim
            </span>

            <strong>
              {formatPrice(
                cartProducts.reduce(
                  (sum, product) =>
                    sum +
                    Number(product.price || 0),
                  0
                )
              )}
            </strong>
          </button>
        )}

        <div className="customer-piece customer-main-piece">
          <div className="customer-piece-image">
            <PackageOpen
              size={26}
              strokeWidth={1.3}
            />
          </div>

          <div>
            <p className="customer-eyebrow">
              you're looking at
            </p>

            <h1>{currentProduct.name}</h1>

            <strong>
              {formatPrice(
                currentProduct.price
              )}
            </strong>

            {currentProduct.sku && (
              <span className="customer-sku">
                {currentProduct.sku}
              </span>
            )}
          </div>
        </div>

        <div className="customer-divider" />

        <div className="customer-product-actions">
          <button
            type="button"
            className="customer-submit-button"
            onClick={() =>
              addToClaim(currentProduct)
            }
          >
            <Plus
              size={17}
              strokeWidth={1.7}
            />

            {alreadyAdded
              ? 'View your claim'
              : 'Add to claim'}
          </button>

          {alreadyAdded && (
            <p className="customer-added-note">
              This piece is already in your claim.
            </p>
          )}
        </div>

        <p className="customer-payment-note">
          You can add more pieces before submitting
          your claim. Payment is completed after your
          claim is received.
        </p>
      </div>
    </div>
  )
}

export default OrderForm