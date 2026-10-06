import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { supabase } from './lib/supabase'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import OrderForm from './pages/OrderForm'

import Layout from './components/Layout'

function ProtectedRoutes({ session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/sales"
          element={<Sales />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </Layout>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public customer order form */}
        <Route
          path="/order"
          element={<OrderForm />}
        />

        <Route
          path="/order/:productId"
          element={<OrderForm />}
        />

        {/* Login */}
        {!session && (
          <Route
            path="*"
            element={<Login />}
          />
        )}

        {/* Authenticated POS */}
        {session && (
          <Route
            path="*"
            element={
              <ProtectedRoutes session={session} />
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App