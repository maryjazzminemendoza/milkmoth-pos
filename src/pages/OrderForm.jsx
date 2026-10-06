import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock,
  PackageOpen,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
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

  const [cart, setCart] = useState(() => getStoredCart())
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
   * Keep localStorage in sync.
   */
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  /*
   * Fetch the product from a direct product link.
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
        console.error('Failed to load product:', error)
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
   * Fetch all products currently in the claim.
   *
   * This happens on /order.
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
        console.error(
          'Failed to load claim:',
          error
        )

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
   * Product from the direct URL.
   */
  const currentProduct = useMemo(() => {
    if (!productId) {
      return null
    }

    return (
      products.find(
        (product) => product.id === productId
      ) || null
    )
  }, [products, productId])

  /*
   * Products currently visible in the claim.
   */
  const cartProducts = useMemo(() => {
    return cart
      .map((id) =>
        products.find(
          (product) => product.id === id
        )
      )
      .filter(Boolean)
  }, [cart, products])

  /*
   * Total for the current claim.
   */
  const total = useMemo(() => {
    return cartProducts.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    )
  }, [cartProducts])

  /*
   * Format PHP prices.
   */
  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  /*
   * Add a piece to the customer's claim.
   */
  function addToClaim(product) {
    if (!product) {
      return
    }

    if (cart.includes(product.id)) {
      navigate('/order')
      return
    }

    const updatedCart = [
      ...cart,
      product.id,
    ]

    setCart(updatedCart)
    navigate('/order')
  }

  /*
   * Remove a piece from the claim.
   */
  function removeFromClaim(productIdToRemove) {
    const updatedCart = cart.filter(
      (id) => id !== productIdToRemove
    )

    setCart(updatedCart)
  }

  /*
   * Remove everything from the claim.
   */
  function clearClaim() {
    setCart([])
  }

  /*
   * Continue shopping.
   *
   * Going to /order without a product ID allows
   * the customer to use their existing product
   * links to add more pieces.
   */
  function continueShopping() {
    if (productId) {
      navigate('/order')
      return
    }

    window.history.back()
  }

  /*
   * Go from cart to customer details.
   */
  function goToDetails() {
    if (cart.length === 0) {
      return
    }

    setFormError('')
    setView('details')
  }

  /*
   * Submit the entire multi-item order.
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
      setFormError(
        'Please enter your full name.'
      )
      return
    }

    if (!customerEmail.trim()) {
      setFormError(
        'Please enter your email address.'
      )
      return
    }

    if (!customerContact.trim()) {
      setFormError(
        'Please enter your mobile number.'
      )
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
      const { data, error } =
        await supabase.rpc('submit_order', {
          p_product_ids: cart,
          p_customer_name:
            customerName.trim(),
          p_customer_email:
            customerEmail.trim(),
          p_customer_contact:
            customerContact.trim(),
          p_customer_address:
            customerAddress.trim(),
          p_source: source,
        })

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          'We could not submit your order.'
        )
      }

      /*
       * Clear the local claim after the database
       * successfully creates the order.
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

      let message =
        error?.message ||
        'We could not submit your order.'

      if (
        message.includes(
          'currently reserved for another buyer'
        )
      ) {
        message =
          'One or more pieces are currently reserved for another buyer. Please return to your claim and try again.'
      }

      if (
        message.includes(
          'no longer available'
        )
      ) {
        message =
          'One or more pieces are no longer available. Please return to your claim and remove them.'
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
   * ------------------------------------------------
   * SUCCESS VIEW
   * ------------------------------------------------
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
            {submittedItems.length === 1
              ? 'this piece'
              : `${submittedItems.length} pieces`}
            .
          </p>

          <div className="customer-order-summary">
            <div>
              <span>Order</span>

              <strong>
                {submittedOrder.order_id
                  ?.slice(0, 8)
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
                key={item.id}
                className="customer-submitted-item"
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
                Payment must be completed within
                24 hours.
              </strong>

              <p>
                Your pieces are temporarily held
                for you while you arrange payment.
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
                Keep your order reference in case
                you need to contact us.
              </li>

              <li>
                We'll confirm your order once
                payment has been received.
              </li>
            </ol>
          </div>

          <p className="customer-footer-note">
            Please don't submit another order for
            the same pieces while your current
            order is pending.
          </p>
        </div>
      </div>
    )
  }

  /*
   * ------------------------------------------------
   * DIRECT PRODUCT VIEW
   * ------------------------------------------------
   */
  if (productId) {
    /*
     * Product wasn't found / is unavailable.
     */
    if (!currentProduct) {
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
                onClick={() =>
                  navigate('/order')
                }
              >
                View your claim
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
          {cart.length > 0 && (
            <button
              type="button"
              className="customer-claim-bar"
              onClick={() =>
                navigate('/order')
              }
            >
              <span>
                <ShoppingBag
                  size={14}
                  strokeWidth={1.7}
                />

                <strong>
                  {cart.length}{' '}
                  {cart.length === 1
                    ? 'piece'
                    : 'pieces'}{' '}
                  in your claim
                </strong>
              </span>

              <span>
                {formatPrice(total)}
              </span>
            </button>
          )}

          <div className="customer-brand">
            <span>milkmoth</span>

            <small>
              soft relics for daydreamers
            </small>
          </div>

          <div className="customer-piece customer-main-piece">
            <div className="customer-piece-image">
              <PackageOpen
                size={26}
                strokeWidth={1.3}
              />
            </div>

            <div>
              <p className="customer-eyebrow">
                you're claiming
              </p>

              <h1>
                {currentProduct.name}
              </h1>

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
              {alreadyAdded ? (
                <>
                  <Check
                    size={15}
                    strokeWidth={1.8}
                  />

                  View your claim
                </>
              ) : (
                <>
                  <ShoppingBag
                    size={15}
                    strokeWidth={1.8}
                  />

                  Add to claim
                </>
              )}
            </button>

            {alreadyAdded && (
              <p className="customer-added-note">
                This piece is already in your
                claim.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  /*
   * ------------------------------------------------
   * CART VIEW
   * ------------------------------------------------
   */
  if (view === 'cart') {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-cart-card">
          <div className="customer-cart-heading">
            <div className="customer-brand">
              <span>milkmoth</span>

              <small>
                soft relics for daydreamers
              </small>
            </div>

            <h1>your claim</h1>

            <p>
              Pieces are only held once you
              submit your details.
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="customer-empty-cart">
              <ShoppingBag
                size={28}
                strokeWidth={1.3}
              />

              <h2>
                your claim is empty
              </h2>

              <p>
                Add pieces from Milkmoth to see
                them here.
              </p>
            </div>
          ) : (
            <>
              <div className="customer-cart-items">
                {cartProducts.map((product) => (
                  <div
                    key={product.id}
                    className="customer-cart-item"
                  >
                    <div className="customer-cart-item-image">
                      <PackageOpen
                        size={20}
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
                        size={15}
                        strokeWidth={1.6}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {cartProducts.length <
                cart.length && (
                <div className="customer-form-error">
                  One or more pieces in your claim
                  are no longer available. Please
                  remove them before continuing.
                </div>
              )}

              <div className="customer-cart-total">
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

              <div className="customer-cart-actions">
                <button
                  type="button"
                  className="customer-continue-button"
                  onClick={continueShopping}
                >
                  <ArrowLeft
                    size={14}
                    strokeWidth={1.7}
                  />

                  Continue shopping
                </button>

                <button
                  type="button"
                  className="customer-submit-button"
                  onClick={goToDetails}
                  disabled={
                    cartProducts.length !==
                    cart.length
                  }
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
   * ------------------------------------------------
   * CUSTOMER DETAILS VIEW
   * ------------------------------------------------
   */
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
            size={13}
            strokeWidth={1.7}
          />

          Back to your claim
        </button>

        <div className="customer-brand customer-details-brand">
          <span>milkmoth</span>

          <small>
            soft relics for daydreamers
          </small>
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

        <div className="customer-form-heading">
          <h2>your details</h2>

          <p>
            Fill this out so we can process your
            claim and send updates about your
            order.
          </p>
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
              We'll use this for order and
              shipping updates.
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
              : 'Claim these pieces'}
          </button>

          <p className="customer-payment-note">
            By submitting, you understand that
            the pieces will be held for 24 hours
            while you complete payment.
          </p>
        </form>
      </div>
    </div>
  )
}

export default OrderForm