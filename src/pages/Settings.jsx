import { Download, LogOut, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Settings() {
  async function handleExport() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      window.alert(error.message)
      return
    }

    const headers = [
      'Item Name',
      'Listing Price',
      'Status',
      'Sale Price',
      'Sale Channel',
      'Date Added',
      'Date Sold',
    ]

    const rows = (data || []).map((product) => [
      product.name,
      product.price,
      product.status,
      product.sale_price ?? '',
      product.sale_channel ?? '',
      product.created_at,
      product.sold_at ?? '',
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `milkmoth-inventory-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <div className="page-heading">
        <p className="eyebrow">Preferences</p>
        <h2>Settings</h2>
        <p className="page-description">
          Manage your Milkmoth POS account and data.
        </p>
      </div>

      <div className="settings-list">
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <UserRound size={18} strokeWidth={1.7} />
            </div>

            <div>
              <h3>Account</h3>
              <p>Your POS account.</p>
            </div>
          </div>

          <div className="settings-detail">
            <span>Authentication</span>
            <strong>Supabase account</strong>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <Download size={18} strokeWidth={1.7} />
            </div>

            <div>
              <h3>Export inventory</h3>
              <p>
                Download your products and sales records as a CSV file.
              </p>
            </div>
          </div>

          <button
            className="secondary-button settings-action"
            onClick={handleExport}
          >
            <Download size={16} />
            Export CSV
          </button>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <LogOut size={18} strokeWidth={1.7} />
            </div>

            <div>
              <h3>Sign out</h3>
              <p>Sign out of your Milkmoth POS account.</p>
            </div>
          </div>

          <button
            className="secondary-button settings-action"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </section>
      </div>
    </div>
  )
}

export default Settings