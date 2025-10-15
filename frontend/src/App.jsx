import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

import AdminLayout from './components/AdminLayout'
import AddCustomer from './components/AddCustomer'
import AddProduct from './components/AddProduct'
import CustomerProductMapping from './components/CustomerProductMapping'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/map-products" element={<CustomerProductMapping />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminLayout>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  )
}
