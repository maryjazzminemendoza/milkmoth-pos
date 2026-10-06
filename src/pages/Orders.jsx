import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  Send,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function Orders() {
  const [pendingOrders, setPendingOrders] = useState([])
  const [readyOrders, setReadyOrders] = useState([])
  const [shippedOrders, setShippedOrders] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [confirmingOrder, setConfirmingOrder] = useState(null)
  const [shippingOrder, setShippingOrder] = useState(null)

  const [shippingForms, setShippingForms] = useState({})

  const [now, setNow] = useState(Date.now())

  async function fetchOrders() {
    setLoading(true)
    setError('')

    await supabase.rpc('expire_old_orders')

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        receipt_number,
        customer_name,
        customer_email,
        customer_contact,
        customer_address,
        source,
        status,
        created_at,
        paid_at,
        expires_at,
        shipping_status,
        courier,
        tracking_number,
        tracking_url,
        shipped_at,
        shipping_email_sent_at,
        order_items (
          id,
          product_id,
          price,
          created_at,
          products (
            id,
            name,
            sku,
            price
          )
        )
      `)
      .in('status', ['payment_pending', 'paid'])
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error('Failed to load orders:', error)
      setError(error.message)
      setPendingOrders([])
      setReadyOrders([])
      setShippedOrders([])
    } else {
      const allOrders = data || []

      setPendingOrders(
        allOrders.filter(
          (order) =>
            order.status === 'payment_pending'
        )
      )

      setReadyOrders(
        allOrders.filter(
          (order) =>
            order.status === 'paid' &&
            order.shipping_status === 'pending'
        )
      )

      setShippedOrders(
        allOrders.filter(
          (order) =>
            order.status === 'paid' &&
            order.shipping_status === 'shipped'
        )
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    const timer = setInterval(() => {
      setNow(Date.now())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  function formatDateTime(date) {
    if (!date) return '—'

    return new Date(date).toLocaleString(
      'en-PH',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  function formatSource(source) {
    if (source === 'instagram') return 'Instagram'
    if (source === 'tiktok') return 'TikTok'
    if (source === 'facebook') return 'Facebook'
    if (source === 'referral') return 'Friend / referral'

    return 'Other'
  }

  function formatCourier(courier) {
    if (courier === 'j&t') return 'J&T Express'
    if (courier === 'lalamove') return 'Lalamove'

    return courier || '—'
  }

  function getOrderTotal(order) {
    return (order.order_items || []).reduce(
      (total, item) =>
        total + Number(item.price || 0),
      0
    )
  }

  function getRemainingTime(expiresAt) {
    if (!expiresAt) {
      return {
        expired: false,
        text: 'No expiry',
      }
    }

    const difference =
      new Date(expiresAt).getTime() - now

    if (difference <= 0) {
      return {
        expired: true,
        text: 'Expired',
      }
    }

    const totalMinutes = Math.floor(
      difference / 60000
    )

    const hours = Math.floor(
      totalMinutes / 60
    )

    const minutes = totalMinutes % 60

    if (hours > 0) {
      return {
        expired: false,
        text: `${hours}h ${minutes}m left`,
      }
    }

    return {
      expired: false,
      text: `${minutes}m left`,
    }
  }

  function toggleOrder(orderId) {
    setActionError('')

    setExpandedOrder((current) =>
      current === orderId
        ? null
        : orderId
    )
  }

  function updateShippingForm(
    orderId,
    field,
    value
  ) {
    setShippingForms((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [field]: value,
      },
    }))
  }

  async function handleConfirmPayment(order) {
    const confirmed = window.confirm(
      `Confirm payment for ${order.customer_name}'s order?\n\n` +
        `${order.order_items.length} ${
          order.order_items.length === 1
            ? 'piece'
            : 'pieces'
        } · ${formatPrice(
          getOrderTotal(order)
        )}\n\n` +
        `This will mark all pieces as SOLD and move the order to Ready to ship.`
    )

    if (!confirmed) return

    setConfirmingOrder(order.id)
    setActionError('')

    try {
      const { data, error } =
        await supabase.rpc(
          'confirm_order_payment',
          {
            p_order_id: order.id,
          }
        )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          'Payment could not be confirmed.'
        )
      }

      await fetchOrders()
      setExpandedOrder(null)
    } catch (error) {
      console.error(
        'Failed to confirm payment:',
        error
      )

      setActionError(error.message)
    } finally {
      setConfirmingOrder(null)
    }
  }

  async function handleShipOrder(order) {
    const form =
      shippingForms[order.id] || {}

    const courier = order.courier

    if (!courier) {
      setActionError(
        'This order does not have a courier selected.'
      )
      return
    }

    if (
      courier === 'j&t' &&
      !form.trackingNumber?.trim()
    ) {
      setActionError(
        'Please enter the J&T tracking number.'
      )
      return
    }

    if (
      courier === 'lalamove' &&
      !form.trackingUrl?.trim()
    ) {
      setActionError(
        'Please enter the Lalamove tracking link.'
      )
      return
    }

    const trackingValue =
      courier === 'j&t'
        ? form.trackingNumber.trim()
        : form.trackingUrl.trim()

    const confirmed = window.confirm(
      `Mark ${order.receipt_number || 'this order'} as shipped?\n\n` +
        `${formatCourier(courier)}\n` +
        `${trackingValue}\n\n` +
        `A shipping email will be sent to ${order.customer_email}.`
    )

    if (!confirmed) return

    setShippingOrder(order.id)
    setActionError('')

    try {
      /*
       * The courier is already stored on the order.
       * Only tracking information is supplied here.
       */
      const { data, error } =
        await supabase.rpc(
          'ship_order',
          {
            p_order_id: order.id,
            p_tracking_number:
              courier === 'j&t'
                ? form.trackingNumber.trim()
                : null,
            p_tracking_url:
              courier === 'lalamove'
                ? form.trackingUrl.trim()
                : null,
          }
        )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          'The order could not be marked as shipped.'
        )
      }

      /*
       * Send the customer their shipping email.
       */
      const emailResponse = await fetch(
        '/api/send-shipping-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail:
              order.customer_email,
            customerName:
              order.customer_name,
            receiptNumber:
              order.receipt_number,
            courier: order.courier,
            trackingNumber:
              courier === 'j&t'
                ? form.trackingNumber.trim()
                : null,
            trackingUrl:
              courier === 'lalamove'
                ? form.trackingUrl.trim()
                : null,
            items: (
              order.order_items || []
            ).map((item) => ({
              name:
                item.products?.name ||
                'Unknown piece',
              sku:
                item.products?.sku || null,
              price: Number(
                item.price || 0
              ),
            })),
            total: getOrderTotal(order),
          }),
        }
      )

      const emailResult =
        await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(
          emailResult.error ||
            'The order was shipped, but the email could not be sent.'
        )
      }

      /*
       * Record that the shipping email was sent.
       */
      const { error: emailUpdateError } =
        await supabase
          .from('orders')
          .update({
            shipping_email_sent_at:
              new Date().toISOString(),
          })
          .eq('id', order.id)

      if (emailUpdateError) {
        console.error(
          'Shipping email timestamp could not be saved:',
          emailUpdateError
        )
      }

      await fetchOrders()
      setExpandedOrder(null)

      setShippingForms((current) => {
        const next = {
          ...current,
        }

        delete next[order.id]

        return next
      })
    } catch (error) {
      console.error(
        'Failed to ship order:',
        error
      )

      setActionError(error.message)

      /*
       * Refresh because the order may already have
       * been marked shipped before the email failed.
       */
      await fetchOrders()
    } finally {
      setShippingOrder(null)
    }
  }

  function renderCustomerDetails(order) {
    return (
      <>
        <div className="order-detail-grid">
          <div className="order-detail-section">
            <p className="order-detail-label">
              Customer
            </p>

            <div className="order-detail-row">
              <Mail
                size={14}
                strokeWidth={1.6}
              />

              <span>
                {order.customer_email || '—'}
              </span>
            </div>

            <div className="order-detail-row">
              <Phone
                size={14}
                strokeWidth={1.6}
              />

              <span>
                {order.customer_contact || '—'}
              </span>
            </div>
          </div>

          <div className="order-detail-section">
            <p className="order-detail-label">
              Order
            </p>

            {order.receipt_number && (
              <div className="order-detail-row">
                <Package
                  size={14}
                  strokeWidth={1.6}
                />

                <strong>
                  {order.receipt_number}
                </strong>
              </div>
            )}

            <div className="order-detail-row">
              <Clock
                size={14}
                strokeWidth={1.6}
              />

              <span>
                Submitted{' '}
                {formatDateTime(
                  order.created_at
                )}
              </span>
            </div>

            <div className="order-detail-row">
              <ShoppingBag
                size={14}
                strokeWidth={1.6}
              />

              <span>
                {formatSource(order.source)}
              </span>
            </div>

            <div className="order-detail-row">
              <Truck
                size={14}
                strokeWidth={1.6}
              />

              <span>
                {formatCourier(order.courier)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-detail-section">
          <p className="order-detail-label">
            Shipping address
          </p>

          <div className="order-address">
            <MapPin
              size={14}
              strokeWidth={1.6}
            />

            <span>
              {order.customer_address || '—'}
            </span>
          </div>
        </div>
      </>
    )
  }

  function renderItems(order) {
    return (
      <div className="order-detail-section">
        <p className="order-detail-label">
          Pieces
        </p>

        <div className="order-items">
          {(order.order_items || []).map(
            (item) => (
              <div
                className="order-item"
                key={item.id}
              >
                <div className="order-item-icon">
                  <ShoppingBag
                    size={15}
                    strokeWidth={1.5}
                  />
                </div>

                <div className="order-item-info">
                  <strong>
                    {item.products?.name ||
                      'Unknown piece'}
                  </strong>

                  {item.products?.sku && (
                    <span>
                      {item.products.sku}
                    </span>
                  )}
                </div>

                <strong className="order-item-price">
                  {formatPrice(item.price)}
                </strong>
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  function renderOrderTotal(order) {
    return (
      <div className="order-total-row">
        <span>Order total</span>

        <strong>
          {formatPrice(
            getOrderTotal(order)
          )}
        </strong>
      </div>
    )
  }

  function renderPendingOrder(order) {
    const isExpanded =
      expandedOrder === order.id

    const remaining =
      getRemainingTime(order.expires_at)

    const total = getOrderTotal(order)

    const itemCount =
      order.order_items?.length || 0

    return (
      <div
        className={`order-card ${
          isExpanded
            ? 'order-card-expanded'
            : ''
        }`}
        key={order.id}
      >
        <button
          type="button"
          className="order-card-header"
          onClick={() =>
            toggleOrder(order.id)
          }
        >
          <div className="order-customer">
            <div className="order-customer-icon">
              <User
                size={17}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <strong>
                {order.customer_name}
              </strong>

              <span>
                {itemCount}{' '}
                {itemCount === 1
                  ? 'piece'
                  : 'pieces'}{' '}
                · {formatPrice(total)}
              </span>
            </div>
          </div>

          <div className="order-card-meta">
            <span
              className={`order-expiry ${
                remaining.expired
                  ? 'order-expiry-expired'
                  : ''
              }`}
            >
              <Clock
                size={13}
                strokeWidth={1.7}
              />

              {remaining.text}
            </span>

            {isExpanded ? (
              <ChevronUp
                size={18}
                strokeWidth={1.6}
              />
            ) : (
              <ChevronDown
                size={18}
                strokeWidth={1.6}
              />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="order-card-body">
            {renderCustomerDetails(order)}
            {renderItems(order)}
            {renderOrderTotal(order)}

            <div className="order-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  handleConfirmPayment(order)
                }
                disabled={
                  confirmingOrder === order.id
                }
              >
                <Check
                  size={15}
                  strokeWidth={1.8}
                />

                {confirmingOrder === order.id
                  ? 'Confirming...'
                  : 'Confirm payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderReadyOrder(order) {
    const isExpanded =
      expandedOrder === order.id

    const form =
      shippingForms[order.id] || {}

    const shipping =
      shippingOrder === order.id

    const itemCount =
      order.order_items?.length || 0

    const courier = order.courier

    return (
      <div
        className={`order-card ${
          isExpanded
            ? 'order-card-expanded'
            : ''
        }`}
        key={order.id}
      >
        <button
          type="button"
          className="order-card-header"
          onClick={() =>
            toggleOrder(order.id)
          }
        >
          <div className="order-customer">
            <div className="order-customer-icon">
              <Truck
                size={17}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <strong>
                {order.customer_name}
              </strong>

              <span>
                {order.receipt_number ||
                  'No receipt'}{' '}
                · {itemCount}{' '}
                {itemCount === 1
                  ? 'piece'
                  : 'pieces'}{' '}
                ·{' '}
                {formatPrice(
                  getOrderTotal(order)
                )}
              </span>
            </div>
          </div>

          <div className="order-card-meta">
            <span className="order-expiry">
              <Check
                size={13}
                strokeWidth={1.7}
              />

              Paid
            </span>

            {isExpanded ? (
              <ChevronUp
                size={18}
                strokeWidth={1.6}
              />
            ) : (
              <ChevronDown
                size={18}
                strokeWidth={1.6}
              />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="order-card-body">
            {renderCustomerDetails(order)}
            {renderItems(order)}
            {renderOrderTotal(order)}

            <div className="shipping-form">
              <div className="shipping-form-heading">
                <div>
                  <p className="order-detail-label">
                    Shipping
                  </p>

                  <span>
                    The customer selected{' '}
                    <strong>
                      {formatCourier(courier)}
                    </strong>
                    . Add the tracking details
                    below.
                  </span>
                </div>
              </div>

              <div className="shipping-form-grid">
                <div className="form-field">
                  <span>Courier</span>

                  <div className="shipping-courier-display">
                    <Truck
                      size={15}
                      strokeWidth={1.6}
                    />

                    <strong>
                      {formatCourier(courier)}
                    </strong>
                  </div>
                </div>

                {courier === 'j&t' && (
                  <label className="form-field">
                    <span>
                      Tracking number
                    </span>

                    <input
                      type="text"
                      value={
                        form.trackingNumber ||
                        ''
                      }
                      onChange={(event) =>
                        updateShippingForm(
                          order.id,
                          'trackingNumber',
                          event.target.value
                        )
                      }
                      placeholder="Enter J&T tracking number"
                      disabled={shipping}
                    />
                  </label>
                )}

                {courier === 'lalamove' && (
                  <label className="form-field">
                    <span>
                      Tracking link
                    </span>

                    <input
                      type="url"
                      value={
                        form.trackingUrl || ''
                      }
                      onChange={(event) =>
                        updateShippingForm(
                          order.id,
                          'trackingUrl',
                          event.target.value
                        )
                      }
                      placeholder="Paste Lalamove tracking link"
                      disabled={shipping}
                    />
                  </label>
                )}
              </div>

              <div className="order-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    handleShipOrder(order)
                  }
                  disabled={shipping}
                >
                  <Send
                    size={15}
                    strokeWidth={1.8}
                  />

                  {shipping
                    ? 'Shipping...'
                    : 'Mark shipped & send email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderShippedOrder(order) {
    const isExpanded =
      expandedOrder === order.id

    return (
      <div
        className={`order-card ${
          isExpanded
            ? 'order-card-expanded'
            : ''
        }`}
        key={order.id}
      >
        <button
          type="button"
          className="order-card-header"
          onClick={() =>
            toggleOrder(order.id)
          }
        >
          <div className="order-customer">
            <div className="order-customer-icon">
              <Check
                size={17}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <strong>
                {order.customer_name}
              </strong>

              <span>
                {order.receipt_number ||
                  'No receipt'}{' '}
                ·{' '}
                {formatPrice(
                  getOrderTotal(order)
                )}
              </span>
            </div>
          </div>

          <div className="order-card-meta">
            <span className="order-expiry">
              <Truck
                size={13}
                strokeWidth={1.7}
              />

              Shipped
            </span>

            {isExpanded ? (
              <ChevronUp
                size={18}
                strokeWidth={1.6}
              />
            ) : (
              <ChevronDown
                size={18}
                strokeWidth={1.6}
              />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="order-card-body">
            {renderCustomerDetails(order)}
            {renderItems(order)}
            {renderOrderTotal(order)}

            <div className="shipping-summary">
              <div>
                <span>Courier</span>

                <strong>
                  {formatCourier(
                    order.courier
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {order.courier === 'j&t'
                    ? 'Tracking number'
                    : 'Tracking link'}
                </span>

                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>
                      View tracking
                    </span>

                    <ExternalLink
                      size={13}
                    />
                  </a>
                ) : (
                  <strong>
                    {order.tracking_number ||
                      '—'}
                  </strong>
                )}
              </div>

              <div>
                <span>Shipped</span>

                <strong>
                  {formatDateTime(
                    order.shipped_at
                  )}
                </strong>
              </div>

              <div>
                <span>Shipping email</span>

                <strong>
                  {order.shipping_email_sent_at
                    ? 'Sent'
                    : 'Not sent'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const pendingPieces =
    pendingOrders.reduce(
      (total, order) =>
        total +
        (order.order_items?.length || 0),
      0
    )

  const readyValue =
    readyOrders.reduce(
      (total, order) =>
        total + getOrderTotal(order),
      0
    )

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">
          Customer claims
        </p>

        <h2>Orders</h2>

        <p className="page-description">
          Confirm payments, prepare shipments,
          and send tracking details to customers.
        </p>
      </div>

      {error && (
        <div className="page-error">
          <strong>
            Couldn't load orders.
          </strong>

          <span>{error}</span>

          <button
            className="secondary-button"
            onClick={fetchOrders}
          >
            Try again
          </button>
        </div>
      )}

      {actionError && (
        <div className="page-error">
          <strong>
            Couldn't update order.
          </strong>

          <span>{actionError}</span>

          <button
            className="secondary-button"
            onClick={() => {
              setActionError('')
              fetchOrders()
            }}
          >
            Try again
          </button>
        </div>
      )}

      <div className="orders-summary">
        <div className="summary-card">
          <div className="summary-card-icon">
            <Clock
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div>
            <span>Pending payment</span>

            <strong>
              {pendingOrders.length}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <ShoppingBag
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div>
            <span>Pieces on hold</span>

            <strong>
              {pendingPieces}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <Truck
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div>
            <span>Ready to ship</span>

            <strong>
              {readyOrders.length}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>Ready value</span>

            <strong>
              {formatPrice(readyValue)}
            </strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="orders-container">
          <div className="loading-content">
            Loading orders...
          </div>
        </div>
      ) : (
        <>
          {pendingOrders.length > 0 && (
            <section className="orders-section">
              <div className="orders-section-heading">
                <div>
                  <p className="eyebrow">
                    Awaiting payment
                  </p>

                  <h3>
                    Pending orders
                  </h3>
                </div>
              </div>

              <div className="orders-list">
                {pendingOrders.map(
                  renderPendingOrder
                )}
              </div>
            </section>
          )}

          {readyOrders.length > 0 && (
            <section className="orders-section">
              <div className="orders-section-heading">
                <div>
                  <p className="eyebrow">
                    Paid
                  </p>

                  <h3>
                    Ready to ship
                  </h3>
                </div>
              </div>

              <div className="orders-list">
                {readyOrders.map(
                  renderReadyOrder
                )}
              </div>
            </section>
          )}

          {shippedOrders.length > 0 && (
            <section className="orders-section">
              <div className="orders-section-heading">
                <div>
                  <p className="eyebrow">
                    Completed
                  </p>

                  <h3>
                    Shipped
                  </h3>
                </div>
              </div>

              <div className="orders-list">
                {shippedOrders.map(
                  renderShippedOrder
                )}
              </div>
            </section>
          )}

          {pendingOrders.length === 0 &&
            readyOrders.length === 0 &&
            shippedOrders.length === 0 && (
              <div className="orders-container">
                <div className="empty-state">
                  <Package
                    size={32}
                    strokeWidth={1.4}
                  />

                  <h4>
                    No orders yet
                  </h4>

                  <p>
                    Customer claims will appear
                    here once someone submits an
                    order.
                  </p>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  )
}

export default Orders