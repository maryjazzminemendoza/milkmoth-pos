import { useEffect, useState } from 'react'
import { CheckCircle2, PackageOpen } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'

function OrderForm() {
  const { claimToken } = useParams()

  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedOrder, setSubmittedOrder] =
    useState(null)

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_contact: '',
    customer_address: '',
    source: 'instagram',
    courier: '',
  })

  useEffect(() => {
    async function loadClaim() {
      if (!claimToken) {
        setError('This claim link is invalid.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data, error } =
        await supabase.rpc('get_claim', {
          p_token: claimToken,
        })

      if (error) {
        console.error(
          'Get claim failed:',
          error
        )

        setError(
          error.message ||
            'We could not load this claim.'
        )

        setLoading(false)
        return
      }

      if (!data?.success) {
        if (data?.status === 'submitted') {
          setError(
            'This claim has already been submitted.'
          )
        } else if (
          data?.status === 'expired'
        ) {
          setError(
            'This claim link has expired.'
          )
        } else if (
          data?.status === 'cancelled'
        ) {
          setError(
            'This claim is no longer available.'
          )
        } else if (
          data?.status === 'unavailable'
        ) {
          setError(
            'One or more pieces in this claim are no longer available.'
          )
        } else {
          setError(
            'This claim is no longer available.'
          )
        }

        setLoading(false)
        return
      }

      setClaim(data)
      setLoading(false)
    }

    loadClaim()
  }, [claimToken])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  function getTotal() {
    return (claim?.items || []).reduce(
      (total, item) =>
        total + Number(item.price || 0),
      0
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!claimToken) {
      setError('This claim link is invalid.')
      return
    }

    if (!form.courier) {
      setError('Please select a courier.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      /*
       * STEP 1
       * Submit the claim and create the order.
       */

      const { data, error } =
        await supabase.rpc(
          'submit_claim',
          {
            p_token: claimToken,
            p_customer_name:
              form.customer_name,
            p_customer_email:
              form.customer_email,
            p_customer_contact:
              form.customer_contact,
            p_customer_address:
              form.customer_address,
            p_source: form.source,
            p_courier: form.courier,
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
       * STEP 2
       * Send the order confirmation email.
       *
       * If the email fails, we do NOT undo
       * the order. The order has already been
       * successfully created in Supabase.
       */

      try {
        const emailResponse = await fetch(
          '/api/send-order-confirmation-email',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerEmail:
                form.customer_email,

              customerName:
                form.customer_name,

              receiptNumber:
                data.receipt_number,

              items: claim.items,

              total: data.total,

              courier: data.courier,

              expiresAt:
                data.expires_at,
            }),
          }
        )

        if (!emailResponse.ok) {
          const emailError =
            await emailResponse
              .json()
              .catch(() => null)

          console.error(
            'Order confirmation email failed:',
            emailError
          )
        }
      } catch (emailError) {
        console.error(
          'Order confirmation email request failed:',
          emailError
        )
      }

      /*
       * STEP 3
       * Show the successful order page.
       */

      setSubmittedOrder(data)
    } catch (error) {
      console.error(
        'Submit claim failed:',
        error
      )

      setError(
        error.message ||
          'Something went wrong while submitting your claim.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-card">
          <div className="order-loading">
            Loading your claim...
          </div>
        </div>
      </div>
    )
  }

  if (submittedOrder) {
    return (
      <div className="order-page">
        <div className="order-card">
          <div className="order-success">
            <CheckCircle2
              size={48}
              strokeWidth={1.4}
            />

            <p className="eyebrow">
              Claim received
            </p>

            <h1>
              Your pieces are reserved.
            </h1>

            <p className="order-description">
              Thank you,{' '}
              {form.customer_name}.
              Your Milkmoth claim has been
              received, and we've sent your
              payment instructions to{' '}
              {form.customer_email}.
            </p>

            <div className="order-summary">
              <div className="summary-row">
                <span>Receipt</span>

                <strong>
                  {submittedOrder.receipt_number}
                </strong>
              </div>

              <div className="summary-row">
                <span>Items</span>

                <strong>
                  {submittedOrder.item_count}
                </strong>
              </div>

              <div className="summary-row">
                <span>Total</span>

                <strong>
                  {formatPrice(
                    submittedOrder.total
                  )}
                </strong>
              </div>

              <div className="summary-row">
                <span>Courier</span>

                <strong>
                  {submittedOrder.courier ===
                  'j&t'
                    ? 'J&T Express'
                    : 'Lalamove'}
                </strong>
              </div>
            </div>

            <div className="order-notice">
              <strong>
                Payment deadline
              </strong>

              <p>
                Your items are reserved for
                24 hours. Please complete
                payment within this period
                to secure your order.
              </p>

              <p>
                Check your email for the
                GCash and GoTyme payment
                details and QR codes.
              </p>
            </div>

            <p className="order-footer-note">
              After payment, please send
              your proof of payment through
              Instagram DM and include your
              receipt number so we can
              confirm your order.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !claim) {
    return (
      <div className="order-page">
        <div className="order-card">
          <div className="order-error">
            <PackageOpen
              size={42}
              strokeWidth={1.3}
            />

            <p className="eyebrow">
              Claim unavailable
            </p>

            <h1>
              This claim isn't available.
            </h1>

            <p>
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-page">
      <div className="order-card">
        <div className="order-header">
          <p className="eyebrow">
            Milkmoth
          </p>

          <h1>
            Your claim
          </h1>

          <p className="order-description">
            These are the pieces selected
            for you. Please review your
            claim and fill in your details
            below.
          </p>
        </div>

        <div className="claim-items">
          {(claim?.items || []).map(
            (item) => (
              <div
                className="claim-item"
                key={item.id}
              >
                <div className="claim-item-icon">
                  <PackageOpen
                    size={19}
                    strokeWidth={1.4}
                  />
                </div>

                <div className="claim-item-info">
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.sku ||
                      'One-of-a-kind piece'}
                  </span>
                </div>

                <strong>
                  {formatPrice(item.price)}
                </strong>
              </div>
            )
          )}

          <div className="claim-total">
            <span>Total</span>

            <strong>
              {formatPrice(getTotal())}
            </strong>
          </div>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <form
          className="order-form"
          onSubmit={handleSubmit}
        >
          <div className="form-section">
            <p className="eyebrow">
              Your details
            </p>

            <div className="form-field">
              <label htmlFor="customer_name">
                Full name
              </label>

              <input
                id="customer_name"
                name="customer_name"
                type="text"
                value={
                  form.customer_name
                }
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="customer_email">
                Email address
              </label>

              <input
                id="customer_email"
                name="customer_email"
                type="email"
                value={
                  form.customer_email
                }
                onChange={handleChange}
                placeholder="you@email.com"
                required
              />

              <small>
                We'll send your order
                confirmation and payment
                details here.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="customer_contact">
                Contact number
              </label>

              <input
                id="customer_contact"
                name="customer_contact"
                type="tel"
                value={
                  form.customer_contact
                }
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="customer_address">
                Complete delivery address
              </label>

              <textarea
                id="customer_address"
                name="customer_address"
                value={
                  form.customer_address
                }
                onChange={handleChange}
                placeholder="House/unit, street, barangay, city, province, ZIP code"
                rows={4}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <p className="eyebrow">
              Delivery
            </p>

            <div className="form-field">
              <label htmlFor="courier">
                Courier
              </label>

              <select
                id="courier"
                name="courier"
                value={form.courier}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a courier
                </option>

                <option value="j&t">
                  J&T Express
                </option>

                <option value="lalamove">
                  Lalamove
                </option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <p className="eyebrow">
              Where did you find us?
            </p>

            <div className="form-field">
              <label htmlFor="source">
                Source
              </label>

              <select
                id="source"
                name="source"
                value={form.source}
                onChange={handleChange}
                required
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
          </div>

          <button
            className="primary-button order-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Submitting claim...'
              : 'Submit claim'}
          </button>

          <p className="order-submit-note">
            By submitting, your selected
            pieces will be reserved for 24
            hours while you complete payment.
          </p>
        </form>
      </div>
    </div>
  )
}

export default OrderForm