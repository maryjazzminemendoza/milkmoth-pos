import { useEffect, useState } from 'react'
import { Check, Clock, PackageOpen } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function OrderForm() {
  const { productId } = useParams()

  const [product, setProduct] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [productError, setProductError] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [source, setSource] = useState('instagram')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submittedOrder, setSubmittedOrder] = useState(null)

  useEffect(() => {
    async function fetchProduct() {
      setLoadingProduct(true)
      setProductError('')

      const { data, error } = await supabase.rpc(
        'get_order_product',
        {
          p_product_id: productId,
        }
      )

      if (error) {
        setProductError(error.message)
        setProduct(null)
      } else if (!data || data.length === 0) {
        setProductError(
          'This piece is no longer available.'
        )
        setProduct(null)
      } else {
        setProduct(data[0])
      }

      setLoadingProduct(false)
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

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
          p_product_id: product.id,
          p_customer_name: customerName.trim(),
          p_customer_email: customerEmail.trim(),
          p_customer_contact: customerContact.trim(),
          p_customer_address: customerAddress.trim(),
          p_source: source,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          'We could not submit your order.'
        )
      }

      setSubmittedOrder(data)
    } catch (error) {
      console.error('Order submission failed:', error)

      let message = error.message

      if (
        message.includes(
          'currently reserved for another buyer'
        )
      ) {
        message =
          'This piece is currently reserved for another buyer.'
      }

      if (
        message.includes(
          'no longer available'
        )
      ) {
        message =
          'This piece is no longer available.'
      }

      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-loading">
          <PackageOpen size={28} strokeWidth={1.4} />

          <p>Loading piece...</p>
        </div>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card customer-unavailable">
          <PackageOpen size={32} strokeWidth={1.4} />

          <p className="customer-eyebrow">
            milkmoth
          </p>

          <h1>piece unavailable</h1>

          <p>
            {productError ||
              'This piece is no longer available.'}
          </p>
        </div>
      </div>
    )
  }

  if (submittedOrder) {
    return (
      <div className="customer-order-page">
        <div className="customer-order-card">
          <div className="customer-success-icon">
            <Check size={24} strokeWidth={1.7} />
          </div>

          <p className="customer-eyebrow">
            milkmoth
          </p>

          <h1>your piece is on hold</h1>

          <p className="customer-intro">
            We've received your order request for{' '}
            <strong>{product.name}</strong>.
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
              <span>Amount</span>

              <strong>
                {formatPrice(submittedOrder.price)}
              </strong>
            </div>
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
                Your piece is temporarily held for you
                while you arrange payment.
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
            Please don't submit another order for the
            same piece while your current order is
            pending.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-order-page">
      <div className="customer-order-card">
        <div className="customer-brand">
          <span>milkmoth</span>
          <small>soft relics for daydreamers</small>
        </div>

        <div className="customer-piece">
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

            <h1>{product.name}</h1>

            <strong>
              {formatPrice(product.price)}
            </strong>

            {product.sku && (
              <span className="customer-sku">
                {product.sku}
              </span>
            )}
          </div>
        </div>

        <div className="customer-divider" />

        <div className="customer-form-heading">
          <h2>your details</h2>

          <p>
            Fill this out so we can process your claim
            and send updates about your order.
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
                setCustomerName(event.target.value)
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
                setCustomerEmail(event.target.value)
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
                setCustomerContact(event.target.value)
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
                setCustomerAddress(event.target.value)
              }
              placeholder="House / unit, street, barangay, city, province, ZIP code"
              disabled={submitting}
              rows={4}
              autoComplete="street-address"
            />
          </div>

          <div className="customer-form-group">
            <label htmlFor="customer-source">
              Where did you see this piece?
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
              ? 'Holding your piece...'
              : 'Claim this piece'}
          </button>

          <p className="customer-payment-note">
            By submitting, you understand that the
            piece will be held for 24 hours while you
            complete payment.
          </p>
        </form>
      </div>
    </div>
  )
}

export default OrderForm