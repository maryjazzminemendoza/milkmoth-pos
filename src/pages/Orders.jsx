import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [confirmingOrder, setConfirmingOrder] =
    useState(null)
  const [actionError, setActionError] = useState('')
  const [now, setNow] = useState(Date.now())

  async function fetchOrders() {
    setLoading(true)
    setError('')

    /*
     * First release any expired reservations.
     */
    await supabase.rpc('expire_old_orders')

    /*
     * Fetch pending orders together with their
     * order items and product information.
     */
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_contact,
        customer_address,
        source,
        status,
        created_at,
        paid_at,
        expires_at,
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
      .eq('status', 'payment_pending')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Failed to load orders:',
        error
      )

      setError(error.message)
      setOrders([])
    } else {
      setOrders(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    /*
     * Update countdowns every minute.
     */
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

  function formatDate(date) {
    if (!date) return '—'

    return new Date(date).toLocaleDateString(
      'en-PH',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
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
    if (source === 'instagram') {
      return 'Instagram'
    }

    if (source === 'tiktok') {
      return 'TikTok'
    }

    if (source === 'facebook') {
      return 'Facebook'
    }

    if (source === 'referral') {
      return 'Friend / referral'
    }

    return 'Other'
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
        `This will mark all pieces as SOLD.`
    )

    if (!confirmed) {
      return
    }

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

      /*
       * Remove the order from the pending list.
       */
      setOrders((current) =>
        current.filter(
          (item) => item.id !== order.id
        )
      )

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

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Customer claims</p>

        <h2>Orders</h2>

        <p className="page-description">
          Review customer claims and confirm
          payments before sending their pieces.
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
            <span>Pending orders</span>

            <strong>
              {orders.length}
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
              {orders.reduce(
                (total, order) =>
                  total +
                  (order.order_items
                    ?.length || 0),
                0
              )}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>Pending value</span>

            <strong>
              {formatPrice(
                orders.reduce(
                  (total, order) =>
                    total +
                    getOrderTotal(order),
                  0
                )
              )}
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
      ) : orders.length === 0 ? (
        <div className="orders-container">
          <div className="empty-state">
            <Package
              size={32}
              strokeWidth={1.4}
            />

            <h4>No pending orders</h4>

            <p>
              Customer claims will appear here
              once someone submits an order.
            </p>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const isExpanded =
              expandedOrder === order.id

            const remaining =
              getRemainingTime(
                order.expires_at
              )

            const total =
              getOrderTotal(order)

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
                        ·{' '}
                        {formatPrice(total)}
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
                            {order.customer_email ||
                              '—'}
                          </span>
                        </div>

                        <div className="order-detail-row">
                          <Phone
                            size={14}
                            strokeWidth={1.6}
                          />

                          <span>
                            {order.customer_contact ||
                              '—'}
                          </span>
                        </div>
                      </div>

                      <div className="order-detail-section">
                        <p className="order-detail-label">
                          Order
                        </p>

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
                            {formatSource(
                              order.source
                            )}
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
                          {order.customer_address ||
                            '—'}
                        </span>
                      </div>
                    </div>

                    <div className="order-detail-section">
                      <p className="order-detail-label">
                        Pieces
                      </p>

                      <div className="order-items">
                        {(
                          order.order_items ||
                          []
                        ).map((item) => (
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
                                {item.products
                                  ?.name ||
                                  'Unknown piece'}
                              </strong>

                              {item.products
                                ?.sku && (
                                <span>
                                  {
                                    item
                                      .products
                                      .sku
                                  }
                                </span>
                              )}
                            </div>

                            <strong className="order-item-price">
                              {formatPrice(
                                item.price
                              )}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-total-row">
                      <span>
                        Order total
                      </span>

                      <strong>
                        {formatPrice(total)}
                      </strong>
                    </div>

                    <div className="order-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          handleConfirmPayment(
                            order
                          )
                        }
                        disabled={
                          confirmingOrder ===
                          order.id
                        }
                      >
                        <Check
                          size={15}
                          strokeWidth={1.8}
                        />

                        {confirmingOrder ===
                        order.id
                          ? 'Confirming...'
                          : 'Confirm payment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Orders