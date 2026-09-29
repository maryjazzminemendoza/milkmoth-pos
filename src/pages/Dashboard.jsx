import { useEffect, useState } from 'react'
import {
  PhilippinePeso,
  TrendingUp,
  ShoppingBag,
  Package,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

function Dashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(price || 0)
  }

  const soldProducts = products.filter(
    (product) => product.status === 'sold'
  )

  const totalCapital = products.reduce(
    (total, product) =>
      total + Number(product.price || 0),
    0
  )

  const totalSales = soldProducts.reduce(
    (total, product) =>
      total + Number(product.sale_price || 0),
    0
  )

  const totalProfit = soldProducts.reduce(
    (total, product) =>
      total +
      (Number(product.sale_price || 0) -
        Number(product.price || 0)),
    0
  )

  const soldItems = soldProducts.length

  const recentSales = soldProducts.slice(0, 5)

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Overview</p>

        <h2>Dashboard</h2>

        <p className="page-description">
          A quick look at your Milkmoth inventory and sales.
        </p>
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
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <PhilippinePeso size={18} />
              </div>

              <div>
                <span>Capital</span>
                <strong>{formatPrice(totalCapital)}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <PhilippinePeso size={18} />
              </div>

              <div>
                <span>Total sales</span>
                <strong>{formatPrice(totalSales)}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <TrendingUp size={18} />
              </div>

              <div>
                <span>Profit</span>
                <strong>{formatPrice(totalProfit)}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <ShoppingBag size={18} />
              </div>

              <div>
                <span>Items sold</span>
                <strong>{soldItems}</strong>
              </div>
            </div>
          </div>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Latest</p>

                <h3>Recent sales</h3>
              </div>
            </div>

            {recentSales.length === 0 ? (
              <div className="dashboard-empty">
                <Package
                  size={28}
                  strokeWidth={1.4}
                />

                <h4>No sales yet</h4>

                <p>
                  Your recent sales will appear here once
                  you start selling.
                </p>
              </div>
            ) : (
              <div className="recent-sales-list">
                {recentSales.map((product) => (
                  <div
                    className="recent-sale"
                    key={product.id}
                  >
                    <div className="recent-sale-main">
                      <div className="recent-sale-icon">
                        <Package
                          size={17}
                          strokeWidth={1.5}
                        />
                      </div>

                      <div>
                        <strong>{product.name}</strong>

                        <span>
                          {product.sale_channel === 'instagram'
                            ? 'Instagram'
                            : product.sale_channel === 'tiktok'
                            ? 'TikTok'
                            : 'Other'}
                          {' · '}
                          {new Date(
                            product.sold_at
                          ).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="recent-sale-price">
                      {formatPrice(product.sale_price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard