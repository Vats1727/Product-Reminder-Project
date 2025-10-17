# **Product Reminder System**

A **full-stack application** for managing **customers**, **products**, and **subscription-based product reminders**.  
Built with **React (Toastify UI)**, **Node.js**, **Express**, and **MongoDB**.

---


## **Dashboard**

- View all **customer-product mappings**.  
- See **purchase date**, **expiry date**, and **remaining due period** (in years, months, days).  
- **Search**, **sort**, and **filter** mappings.  
- **Reminders:** API endpoint for product reminders (backend).  
- **Modern UI:** Toastify components, toast notifications, and responsive tables.


## **Features**

- **Customer Management:**  
  Add, edit, and view customers with validation for **email** and **phone number**.

- **Product Management:**  
  Add, edit, and view products with support for **one-time** and **recurring** types.

- **Customer-Product Mapping:**  
  Map products to customers, assign **remarks**, and track **assignment dates**.

- **Subscription Management:**  
  - Record **payments/subscriptions** for mapped products.  
  - Supports **recurring subscriptions** (days, months, years).   
  - Restricts deletion of **active/past subscriptions** (only future ones can be deleted).  
  - Displays **subscription history** with **calendar selection** for new periods.

---

## **Tech Stack**

- **Frontend:** React, React Router, React Toastify, Vite  
- **Backend:** Node.js, Express, Mongoose, MongoDB  
- **Other Tools:** dotenv, CORS  

---

## **API Endpoints**

- **Customers:** `/api/customers`  
- **Products:** `/api/products`  
- **Mappings:** `/api/mappings`  
- **Reminders:** `/api/reminders`  
- **Subscription Payment:** `/api/mappings/:id/pay`  
- **Subscription Edit/Delete:** `/api/mappings/:id/subscription/:subIdx`  

---

## **Usage**

1. **Add customers and products.**  
2. **Map products to customers** and assign **subscriptions**.  
3. **View and manage** all mappings and subscriptions in the **dashboard**.  
4. **Get reminders** for expiring subscriptions.  
5. Supports **recurring subscriptions** (days, months, years).  
6. Handles **gaps** in subscription periods and **restricts deletion** of active/past subscriptions.  
7. Displays **subscription history** with **calendar selection** for new periods.





