import { useEffect, useState } from 'react'
import { Receipt, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchSales() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })

    if (error) {
      setError(error.message)
      setSales([])
    } else {
      setSales(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchSales()
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

    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatChannel(channel) {
    if (channel === 'instagram') return 'Instagram'
    if (channel === 'tiktok') return 'TikTok'
    return 'Other'
  }

  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.sale_price || 0),
    0
  )

  const averageSale = sales.length > 0
    ? totalSales / sales.length
    : 0

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Records</p>
        <h2>Sales</h2>
        <p className="page-description">
          Keep track of every piece that has found a new home.
        </p>
      </div>

      {error && (
        <div className="page-error">
          <strong>Couldn't load sales.</strong>
          <span>{error}</span>

          <button
            className="secondary-button"
            onClick={fetchSales}
          >
            Try again
          </button>
        </div>
      )}

      <div className="sales-summary">
        <div className="summary-card">
          <div className="summary-card-icon">
            <Receipt size={18} strokeWidth={1.7} />
          </div>

          <div>
            <span>Total sales</span>
            <strong>{formatPrice(totalSales)}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <ShoppingBag size={18} strokeWidth={1.7} />
          </div>

          <div>
            <span>Items sold</span>
            <strong>{sales.length}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>Average sale</span>
            <strong>{formatPrice(averageSale)}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sales-container">
          <div className="loading-content">
            Loading sales...
          </div>
        </div>
      ) : sales.length === 0 ? (
        <div className="sales-container">
          <div className="empty-state">
            <Receipt size={32} strokeWidth={1.4} />

            <h4>No sales yet</h4>

            <p>
              Sold items will appear here once you record your first sale.
            </p>
          </div>
        </div>
      ) : (
        <div className="sales-table-container">
          <div className="sales-table">
            <div className="sales-table-header">
              <span>Item</span>
              <span>Sale price</span>
              <span>Channel</span>
              <span>Date sold</span>
            </div>

            {sales.map((sale) => (
              <div
                className="sales-table-row"
                key={sale.id}
              >
                <div className="sale-item">
                  <div className="sale-item-icon">
                    <ShoppingBag
                      size={17}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div>
                    <strong>{sale.name}</strong>

                    <span>
                      Listed at {formatPrice(sale.price)}
                    </span>
                  </div>
                </div>

                <strong className="sale-price">
                  {formatPrice(sale.sale_price)}
                </strong>

                <span className="sale-channel">
                  {formatChannel(sale.sale_channel)}
                </span>

                <span className="sale-date">
                  {formatDate(sale.sold_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales