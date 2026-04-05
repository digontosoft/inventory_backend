# StockBD — Express.js REST API Specification
# Complete endpoint list with sample request/response JSON

---

## Base URL
```
http://localhost:5000/api/v1
```

## Auth Headers (for all requests)
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

# 1. AUTHENTICATION

---

### POST /auth/register
```json
// Request
{
  "name": "Rahim Uddin",
  "email": "rahim@stockbd.com",
  "password": "securePass123",
  "phone": "01712345678",
  "shopName": "Rahim General Store"
}

// Response 201
{
  "success": true,
  "data": {
    "user": {
      "id": "u1",
      "name": "Rahim Uddin",
      "email": "rahim@stockbd.com",
      "phone": "01712345678",
      "role": "admin",
      "shopName": "Rahim General Store"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login
```json
// Request
{ "email": "rahim@stockbd.com", "password": "securePass123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": "u1", "name": "Rahim Uddin", "role": "admin" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/logout
```json
// Response 200
{ "success": true, "message": "Logged out successfully" }
```

### GET /auth/me
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "u1",
    "name": "Rahim Uddin",
    "email": "rahim@stockbd.com",
    "phone": "01712345678",
    "role": "admin",
    "shopName": "Rahim General Store"
  }
}
```

---

# 2. MASTER DATA — PRODUCTS

---

### GET /products
```
Query: ?search=rice&category=cat1&status=active&sort=name&order=asc&page=1&limit=25
```
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "p1",
      "name": "Miniket Rice 1kg",
      "sku": "SKU-001",
      "barcode": "8801234567890",
      "categoryId": "cat1",
      "categoryName": "Food & Grocery",
      "unitId": "unit1",
      "unitName": "kg",
      "purchasePrice": 62,
      "sellingPrice": 75,
      "vatRate": 0,
      "stock": 150,
      "lowStockThreshold": 20,
      "image": "",
      "description": "",
      "status": "active",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2
  }
}
```

### GET /products/:id
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "p1",
    "name": "Miniket Rice 1kg",
    "sku": "SKU-001",
    "barcode": "8801234567890",
    "categoryId": "cat1",
    "unitId": "unit1",
    "purchasePrice": 62,
    "sellingPrice": 75,
    "vatRate": 0,
    "stock": 150,
    "lowStockThreshold": 20,
    "image": "",
    "description": "",
    "status": "active",
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

### POST /products
```json
// Request
{
  "name": "Miniket Rice 1kg",
  "sku": "SKU-001",
  "barcode": "8801234567890",
  "categoryId": "cat1",
  "unitId": "unit1",
  "purchasePrice": 62,
  "sellingPrice": 75,
  "vatRate": 0,
  "stock": 150,
  "lowStockThreshold": 20,
  "image": "",
  "description": "",
  "status": "active"
}

// Response 201
{
  "success": true,
  "data": { "id": "p1", "name": "Miniket Rice 1kg", "sku": "SKU-001", "...": "..." },
  "message": "Product created successfully"
}
```

### PUT /products/:id
```json
// Request (partial update allowed)
{ "sellingPrice": 80, "lowStockThreshold": 25 }

// Response 200
{
  "success": true,
  "data": { "id": "p1", "sellingPrice": 80, "lowStockThreshold": 25, "...": "..." },
  "message": "Product updated successfully"
}
```

### DELETE /products/:id
```json
// Response 200
{ "success": true, "message": "Product deleted successfully" }

// Response 400 (if product has transactions)
{ "success": false, "error": "Cannot delete product with existing transactions" }
```

---

# 3. MASTER DATA — CATEGORIES

---

### GET /categories
```json
// Response 200
{
  "success": true,
  "data": [
    { "id": "cat1", "name": "Food & Grocery", "description": "Rice, oil, spices, etc." },
    { "id": "cat2", "name": "Personal Care", "description": "Soap, shampoo, etc." },
    { "id": "cat3", "name": "Beverages", "description": "Juice, drinks, water" }
  ]
}
```

### POST /categories
```json
// Request
{ "name": "Electronics", "description": "Chargers, cables, etc." }

// Response 201
{ "success": true, "data": { "id": "cat5", "name": "Electronics", "description": "Chargers, cables, etc." } }
```

### PUT /categories/:id
```json
// Request
{ "name": "Electronics & Gadgets" }

// Response 200
{ "success": true, "data": { "id": "cat5", "name": "Electronics & Gadgets", "description": "Chargers, cables, etc." } }
```

### DELETE /categories/:id
```json
// Response 200
{ "success": true, "message": "Category deleted" }
```

---

# 4. MASTER DATA — UNITS

---

### GET /units
```json
{
  "success": true,
  "data": [
    { "id": "unit1", "name": "Kilogram", "abbreviation": "kg", "description": "Weight unit" },
    { "id": "unit2", "name": "Litre", "abbreviation": "ltr", "description": "Volume unit" },
    { "id": "unit3", "name": "Piece", "abbreviation": "pcs", "description": "Count unit" }
  ]
}
```

### POST /units
```json
// Request
{ "name": "Dozen", "abbreviation": "dz", "description": "12 pieces" }

// Response 201
{ "success": true, "data": { "id": "unit5", "name": "Dozen", "abbreviation": "dz", "description": "12 pieces" } }
```

### PUT /units/:id
```json
{ "description": "12 units" }
```

### DELETE /units/:id
```json
{ "success": true, "message": "Unit deleted" }
```

---

# 5. MASTER DATA — SUPPLIERS

---

### GET /suppliers
```
Query: ?search=karim&status=active&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "sup1",
      "name": "Karim Traders",
      "phone": "01811111111",
      "email": "karim@traders.com",
      "address": "Kawran Bazar, Dhaka",
      "paymentTerms": "30 days",
      "openingBalance": 0,
      "totalPurchases": 45000,
      "dueBalance": 12000,
      "status": "active"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 8, "totalPages": 1 }
}
```

### POST /suppliers
```json
// Request
{
  "name": "Karim Traders",
  "phone": "01811111111",
  "email": "karim@traders.com",
  "address": "Kawran Bazar, Dhaka",
  "paymentTerms": "30 days",
  "openingBalance": 0,
  "status": "active"
}

// Response 201
{ "success": true, "data": { "id": "sup1", "...": "..." } }
```

### PUT /suppliers/:id
### DELETE /suppliers/:id

---

# 6. MASTER DATA — CUSTOMERS

---

### GET /customers
```
Query: ?search=hasan&type=Retail&status=active&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "cust1",
      "name": "Hasan Grocery",
      "phone": "01911111111",
      "type": "Wholesale",
      "address": "Mirpur-10, Dhaka",
      "customPrice": false,
      "creditLimit": 50000,
      "openingBalance": 0,
      "totalSales": 32000,
      "dueBalance": 5200,
      "status": "active"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 15, "totalPages": 1 }
}
```

### POST /customers
```json
{
  "name": "Hasan Grocery",
  "phone": "01911111111",
  "type": "Wholesale",
  "address": "Mirpur-10, Dhaka",
  "customPrice": false,
  "creditLimit": 50000,
  "openingBalance": 0,
  "status": "active"
}
```

### PUT /customers/:id
### DELETE /customers/:id

---

# 7. PURCHASES

---

### GET /purchases
```
Query: ?search=PUR&supplierId=sup1&status=received&dateFrom=2026-04-01&dateTo=2026-04-30&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "pur1",
      "invoiceNo": "PUR-0001",
      "date": "2026-04-01",
      "supplierId": "sup1",
      "supplierName": "Karim Traders",
      "items": [
        {
          "productId": "p1",
          "productName": "Miniket Rice 1kg",
          "unit": "kg",
          "qty": 100,
          "purchasePrice": 62,
          "discount": 0,
          "vatRate": 0,
          "vatAmount": 0,
          "lineTotal": 6200
        }
      ],
      "subtotal": 6200,
      "totalDiscount": 0,
      "totalVat": 0,
      "freightCost": 200,
      "grandTotal": 6400,
      "paymentMethod": "cash",
      "amountPaid": 6400,
      "dueAmount": 0,
      "status": "received",
      "notes": "",
      "createdBy": "Rahim",
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-01T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 5, "totalPages": 1 }
}
```

### GET /purchases/:id
```json
// Same single object as above
```

### POST /purchases
```json
// Request
{
  "date": "2026-04-05",
  "supplierId": "sup1",
  "items": [
    {
      "productId": "p1",
      "qty": 100,
      "purchasePrice": 62,
      "discount": 0,
      "vatRate": 0
    },
    {
      "productId": "p7",
      "qty": 10,
      "purchasePrice": 720,
      "discount": 5,
      "vatRate": 15
    }
  ],
  "freightCost": 300,
  "paymentMethod": "credit",
  "amountPaid": 5000,
  "notes": "Monthly restock",
  "status": "received"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "pur6",
    "invoiceNo": "PUR-0006",
    "grandTotal": 13550,
    "dueAmount": 8550,
    "...": "..."
  },
  "message": "Purchase PUR-0006 created. Stock updated for 2 products."
}
```

### PUT /purchases/:id
```json
// Only draft purchases can be edited
// Request: same structure as POST
```

### DELETE /purchases/:id
```json
// Only draft purchases
{ "success": true, "message": "Purchase deleted" }
```

### GET /purchases/next-number
```json
{ "success": true, "data": { "invoiceNo": "PUR-0006" } }
```

---

# 8. PURCHASE RETURNS

---

### GET /purchase-returns
```
Query: ?dateFrom=&dateTo=&supplierId=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "pret1",
      "returnNo": "PRET-0001",
      "date": "2026-04-03",
      "purchaseId": "pur1",
      "supplierId": "sup1",
      "supplierName": "Karim Traders",
      "items": [
        {
          "productId": "p1",
          "productName": "Miniket Rice 1kg",
          "qty": 5,
          "purchasePrice": 62,
          "lineTotal": 310
        }
      ],
      "totalAmount": 310,
      "reason": "Damaged packaging",
      "status": "completed",
      "createdAt": "2026-04-03T14:00:00Z"
    }
  ]
}
```

### POST /purchase-returns
```json
// Request
{
  "date": "2026-04-05",
  "purchaseId": "pur1",
  "items": [
    { "productId": "p1", "qty": 5, "purchasePrice": 62 }
  ],
  "reason": "Damaged packaging"
}

// Response 201
{
  "success": true,
  "data": { "id": "pret2", "returnNo": "PRET-0002", "totalAmount": 310, "...": "..." },
  "message": "Return PRET-0002 processed. Stock adjusted."
}
```

---

# 9. SUPPLIER PAYMENTS

---

### GET /supplier-payments
```
Query: ?supplierId=&dateFrom=&dateTo=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "spay1",
      "paymentNo": "SPAY-0001",
      "date": "2026-04-02",
      "supplierId": "sup1",
      "supplierName": "Karim Traders",
      "amount": 5000,
      "paymentMethod": "cash",
      "referenceNo": "",
      "notes": "Partial payment for PUR-0001",
      "createdAt": "2026-04-02T11:00:00Z"
    }
  ]
}
```

### POST /supplier-payments
```json
// Request
{
  "date": "2026-04-05",
  "supplierId": "sup1",
  "amount": 5000,
  "paymentMethod": "bkash",
  "referenceNo": "TXN123456",
  "notes": ""
}

// Response 201
{
  "success": true,
  "data": { "id": "spay2", "paymentNo": "SPAY-0002", "...": "..." },
  "message": "Payment SPAY-0002 recorded. Supplier balance updated."
}
```

---

# 10. SALES INVOICES

---

### GET /sales
```
Query: ?search=SINV&customerId=&status=confirmed&salesperson=&dateFrom=&dateTo=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "sinv1",
      "invoiceNo": "SINV-0001",
      "quotationId": null,
      "date": "2026-04-02",
      "dueDate": "2026-05-02",
      "customerId": "cust1",
      "customerName": "Hasan Grocery",
      "customerPhone": "01911111111",
      "customerAddress": "Mirpur-10, Dhaka",
      "items": [
        {
          "productId": "p3",
          "productName": "Lifebuoy Soap 100g",
          "sku": "SKU-003",
          "unit": "pcs",
          "qty": 50,
          "sellingPrice": 45,
          "discountPct": 0,
          "discountAmt": 0,
          "vatRate": 15,
          "vatAmount": 337.5,
          "lineTotal": 2587.5
        }
      ],
      "subtotal": 2250,
      "totalDiscountAmt": 0,
      "orderDiscountType": "flat",
      "orderDiscountValue": 0,
      "orderDiscountAmt": 0,
      "totalVat": 337.5,
      "grandTotal": 2587.5,
      "amountPaid": 2000,
      "dueAmount": 587.5,
      "paymentMethod": "cash",
      "paymentReference": "",
      "mixedPayments": [],
      "status": "partial",
      "notes": "",
      "salesperson": "Rahim",
      "createdAt": "2026-04-02T09:00:00Z",
      "updatedAt": "2026-04-02T09:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 12, "totalPages": 1 }
}
```

### POST /sales
```json
// Request
{
  "date": "2026-04-05",
  "dueDate": "2026-05-05",
  "customerId": "cust1",
  "items": [
    {
      "productId": "p3",
      "qty": 50,
      "sellingPrice": 45,
      "discountPct": 0,
      "vatRate": 15
    }
  ],
  "orderDiscountType": "flat",
  "orderDiscountValue": 100,
  "paymentMethod": "mixed",
  "amountPaid": 2000,
  "mixedPayments": [
    { "method": "cash", "amount": 1500, "reference": "" },
    { "method": "bkash", "amount": 500, "reference": "TXN789" }
  ],
  "notes": "",
  "salesperson": "Rahim",
  "status": "confirmed"
}

// Response 201
{
  "success": true,
  "data": { "id": "sinv5", "invoiceNo": "SINV-0005", "grandTotal": 2487.5, "dueAmount": 487.5, "...": "..." },
  "message": "Invoice SINV-0005 created. Stock deducted for 1 product."
}
```

### PUT /sales/:id
### DELETE /sales/:id (draft only)

---

# 11. SALES RETURNS

---

### GET /sales-returns
```json
{
  "success": true,
  "data": [
    {
      "id": "sret1",
      "returnNo": "SRET-0001",
      "date": "2026-04-04",
      "originalInvoiceId": "sinv1",
      "originalInvoiceNo": "SINV-0001",
      "customerId": "cust1",
      "customerName": "Hasan Grocery",
      "items": [
        { "productId": "p3", "productName": "Lifebuoy Soap 100g", "qty": 5, "sellingPrice": 45, "lineTotal": 225 }
      ],
      "totalAmount": 225,
      "refundMethod": "cash",
      "refundReference": "",
      "reason": "Damaged product",
      "status": "refunded",
      "createdAt": "2026-04-04T15:00:00Z"
    }
  ]
}
```

### POST /sales-returns
```json
{
  "date": "2026-04-05",
  "originalInvoiceId": "sinv1",
  "items": [
    { "productId": "p3", "qty": 5, "sellingPrice": 45 }
  ],
  "refundMethod": "cash",
  "reason": "Damaged product"
}
```

---

# 12. CUSTOMER PAYMENTS

---

### GET /customer-payments
```json
{
  "success": true,
  "data": [
    {
      "id": "cpay1",
      "paymentNo": "CPAY-0001",
      "date": "2026-04-03",
      "customerId": "cust1",
      "customerName": "Hasan Grocery",
      "amount": 3000,
      "paymentMethod": "cash",
      "referenceNo": "",
      "allocatedInvoices": [
        { "invoiceId": "sinv1", "invoiceNo": "SINV-0001", "amount": 3000 }
      ],
      "notes": "",
      "createdAt": "2026-04-03T10:00:00Z"
    }
  ]
}
```

### POST /customer-payments
```json
{
  "date": "2026-04-05",
  "customerId": "cust1",
  "amount": 3000,
  "paymentMethod": "bkash",
  "referenceNo": "TXN456",
  "allocatedInvoices": [
    { "invoiceId": "sinv1", "amount": 2000 },
    { "invoiceId": "sinv2", "amount": 1000 }
  ],
  "notes": "Monthly collection"
}
```

---

# 13. QUOTATIONS

---

### GET /quotations
```json
{
  "success": true,
  "data": [
    {
      "id": "q1",
      "quotationNo": "QTN-0001",
      "date": "2026-04-01",
      "validUntil": "2026-04-15",
      "customerId": "cust1",
      "customerName": "Hasan Grocery",
      "customerPhone": "01911111111",
      "items": [
        {
          "productId": "p1",
          "productName": "Miniket Rice 1kg",
          "sku": "SKU-001",
          "unit": "kg",
          "qty": 200,
          "sellingPrice": 75,
          "discountPct": 5,
          "discountAmt": 750,
          "vatRate": 0,
          "vatAmount": 0,
          "lineTotal": 14250
        }
      ],
      "subtotal": 15000,
      "totalDiscount": 750,
      "totalVat": 0,
      "grandTotal": 14250,
      "notes": "Bulk order quote",
      "termsAndConditions": "Valid for 15 days",
      "status": "sent",
      "convertedInvoiceId": null,
      "createdAt": "2026-04-01T08:00:00Z"
    }
  ]
}
```

### POST /quotations
### PUT /quotations/:id
### POST /quotations/:id/convert — Convert quotation to sales invoice
```json
// Response 201
{
  "success": true,
  "data": { "invoiceId": "sinv6", "invoiceNo": "SINV-0006" },
  "message": "Quotation converted to invoice SINV-0006"
}
```

---

# 14. POS — SESSIONS

---

### GET /pos/sessions
```json
{
  "success": true,
  "data": [
    {
      "id": "sess1",
      "sessionNo": "SESS-0001",
      "openedAt": "2026-04-05T09:00:00Z",
      "closedAt": "2026-04-05T21:00:00Z",
      "openedBy": "Rahim",
      "openingCash": 5000,
      "closingCash": 18500,
      "expectedCash": 19000,
      "cashVariance": -500,
      "totalSales": 25,
      "totalRevenue": 18500,
      "totalCashSales": 12000,
      "totalBkashSales": 4500,
      "totalCardSales": 0,
      "totalDueSales": 2000,
      "totalReturns": 450,
      "totalDiscount": 300,
      "status": "closed"
    }
  ]
}
```

### POST /pos/sessions/open
```json
// Request
{ "openingCash": 5000, "openedBy": "Rahim" }

// Response 201
{
  "success": true,
  "data": { "id": "sess2", "sessionNo": "SESS-0002", "status": "open", "...": "..." },
  "message": "POS session opened"
}
```

### POST /pos/sessions/:id/close
```json
// Request
{ "closingCash": 18500 }

// Response 200
{
  "success": true,
  "data": { "id": "sess1", "status": "closed", "cashVariance": -500, "...": "..." },
  "message": "Session closed. Variance: -৳500"
}
```

---

# 15. POS — INVOICES

---

### GET /pos/invoices
```
Query: ?sessionId=sess1&status=completed&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "pinv1",
      "invoiceNo": "POS-0001",
      "sessionId": "sess1",
      "date": "2026-04-05",
      "time": "10:15 AM",
      "customerId": null,
      "customerName": "Walk-in Customer",
      "customerPhone": "",
      "items": [
        {
          "productId": "p1",
          "productName": "Miniket Rice 1kg",
          "sku": "SKU-001",
          "unit": "kg",
          "qty": 2,
          "sellingPrice": 75,
          "discount": 0,
          "vatRate": 0,
          "vatAmount": 0,
          "lineTotal": 150
        }
      ],
      "subtotal": 150,
      "totalDiscount": 0,
      "totalVat": 0,
      "grandTotal": 150,
      "amountPaid": 200,
      "changeDue": 50,
      "dueAmount": 0,
      "paymentMethod": "cash",
      "paymentReference": "",
      "status": "completed",
      "notes": "",
      "printCount": 1
    }
  ]
}
```

### POST /pos/invoices
```json
// Request
{
  "sessionId": "sess1",
  "customerId": null,
  "customerName": "Walk-in Customer",
  "customerPhone": "",
  "items": [
    { "productId": "p1", "qty": 2, "sellingPrice": 75, "discount": 0, "vatRate": 0 },
    { "productId": "p3", "qty": 3, "sellingPrice": 45, "discount": 0, "vatRate": 15 }
  ],
  "amountPaid": 350,
  "paymentMethod": "cash",
  "paymentReference": "",
  "notes": ""
}

// Response 201
{
  "success": true,
  "data": {
    "id": "pinv5",
    "invoiceNo": "POS-0005",
    "grandTotal": 305.25,
    "changeDue": 44.75,
    "...": "..."
  },
  "message": "Sale completed"
}
```

---

# 16. POS — HELD SALES

---

### GET /pos/held-sales
```json
{
  "success": true,
  "data": [
    {
      "id": "hold1",
      "holdNo": "HOLD-0001",
      "heldAt": "2026-04-05T14:30:00Z",
      "label": "Customer waiting - blue bag",
      "customerId": null,
      "customerName": "Walk-in",
      "items": [
        { "productId": "p1", "productName": "Miniket Rice 1kg", "sku": "SKU-001", "unit": "kg", "qty": 5, "sellingPrice": 75, "discount": 0, "vatRate": 0, "vatAmount": 0, "lineTotal": 375 }
      ],
      "subtotal": 375,
      "grandTotal": 375
    }
  ]
}
```

### POST /pos/held-sales
```json
// Request
{
  "sessionId": "sess1",
  "label": "Customer waiting",
  "customerId": null,
  "customerName": "Walk-in",
  "items": [
    { "productId": "p1", "qty": 5, "sellingPrice": 75, "discount": 0, "vatRate": 0 }
  ]
}
```

### POST /pos/held-sales/:id/recall — Move back to active cart
### DELETE /pos/held-sales/:id

---

# 17. POS — RETURNS

---

### GET /pos/returns
### POST /pos/returns
```json
// Request
{
  "sessionId": "sess1",
  "originalInvoiceId": "pinv1",
  "items": [
    { "productId": "p1", "qty": 1, "sellingPrice": 75 }
  ],
  "refundMethod": "cash",
  "reason": "Customer changed mind"
}
```

---

# 18. POS — CASH IN/OUT

---

### GET /pos/cash-transactions
```
Query: ?sessionId=sess1
```
```json
{
  "success": true,
  "data": [
    {
      "id": "pct1",
      "sessionId": "sess1",
      "type": "cash_out",
      "amount": 500,
      "reason": "Change for customer",
      "createdAt": "2026-04-05T12:00:00Z"
    }
  ]
}
```

### POST /pos/cash-transactions
```json
{ "sessionId": "sess1", "type": "cash_out", "amount": 500, "reason": "Change for customer" }
```

---

# 19. INVENTORY — STOCK MOVEMENTS

---

### GET /inventory/movements
```
Query: ?productId=&type=purchase_in,sale_out&category=&dateFrom=&dateTo=&search=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "m1",
      "date": "2026-04-04",
      "time": "10:00 AM",
      "productId": "p1",
      "productName": "Miniket Rice 1kg",
      "sku": "SKU-001",
      "type": "purchase_in",
      "referenceType": "purchase",
      "referenceId": "pur1",
      "referenceNo": "PUR-0001",
      "qtyBefore": 50,
      "qtyChange": 100,
      "qtyAfter": 150,
      "unitCost": 62,
      "totalValue": 6200,
      "location": "Main Store",
      "notes": "",
      "createdBy": "Rahim"
    }
  ],
  "summary": {
    "totalIn": 230,
    "totalOut": 105,
    "netMovement": 125
  },
  "pagination": { "page": 1, "limit": 25, "total": 6, "totalPages": 1 }
}
```

---

# 20. INVENTORY — STOCK ADJUSTMENTS

---

### GET /inventory/adjustments
```json
{
  "success": true,
  "data": [
    {
      "id": "adj1",
      "adjustmentNo": "ADJ-0001",
      "date": "2026-04-05",
      "reason": "damage",
      "reasonNote": "",
      "items": [
        {
          "productId": "p9",
          "productName": "Dollar Notebook",
          "sku": "SKU-009",
          "unit": "pcs",
          "currentStock": 65,
          "adjustedQty": 60,
          "difference": -5,
          "unitCost": 30,
          "valueImpact": -150
        }
      ],
      "totalValueImpact": -150,
      "status": "approved",
      "approvedBy": "Rahim",
      "notes": "Water damage in storage",
      "createdBy": "Rahim",
      "createdAt": "2026-04-05T10:00:00Z"
    }
  ]
}
```

### POST /inventory/adjustments
```json
// Request
{
  "date": "2026-04-05",
  "reason": "damage",
  "reasonNote": "",
  "items": [
    { "productId": "p9", "adjustedQty": 60, "unitCost": 30 }
  ],
  "notes": "Water damage",
  "status": "approved"
}

// Response 201
{
  "success": true,
  "data": { "id": "adj2", "adjustmentNo": "ADJ-0002", "totalValueImpact": -150, "...": "..." },
  "message": "Adjustment ADJ-0002 approved. 1 product updated."
}
```

### PUT /inventory/adjustments/:id (draft only)
### DELETE /inventory/adjustments/:id (draft only)
### POST /inventory/adjustments/:id/approve

---

# 21. INVENTORY — STOCK TRANSFERS

---

### GET /inventory/transfers
### GET /inventory/transfers/:id

### POST /inventory/transfers
```json
{
  "date": "2026-04-05",
  "expectedDate": "2026-04-06",
  "fromBranch": "Main Store",
  "toBranch": "Branch - Uttara",
  "items": [
    { "productId": "p1", "qtyRequested": 20 },
    { "productId": "p2", "qtyRequested": 10 }
  ],
  "notes": "Regular replenishment",
  "status": "draft"
}
```

### POST /inventory/transfers/:id/dispatch
```json
// Request
{
  "items": [
    { "productId": "p1", "qtySent": 20 },
    { "productId": "p2", "qtySent": 10 }
  ]
}

// Response 200
{ "success": true, "message": "Transfer dispatched. Stock deducted from Main Store." }
```

### POST /inventory/transfers/:id/receive
```json
// Request
{
  "receivedDate": "2026-04-06",
  "items": [
    { "productId": "p1", "qtyReceived": 20 },
    { "productId": "p2", "qtyReceived": 9 }
  ],
  "notes": "1 unit damaged in transit"
}

// Response 200
{ "success": true, "message": "Transfer received (partial). Stock updated." }
```

### DELETE /inventory/transfers/:id (draft only)

---

# 22. INVENTORY — STOCK COUNTS

---

### GET /inventory/stock-counts
### GET /inventory/stock-counts/:id

### POST /inventory/stock-counts
```json
{
  "title": "Monthly Count April 2026",
  "type": "full",
  "categoryFilter": "",
  "date": "2026-04-05",
  "notes": ""
}

// Response 201 — items auto-populated with current system quantities
{
  "success": true,
  "data": {
    "id": "cnt2",
    "countNo": "CNT-0002",
    "status": "in_progress",
    "items": [
      { "productId": "p1", "productName": "Miniket Rice 1kg", "sku": "SKU-001", "unit": "kg", "category": "Food & Grocery", "systemQty": 150, "countedQty": null, "difference": 0, "unitCost": 62, "valueVariance": 0, "status": "pending" },
      "..."
    ],
    "totalItemsToCount": 10,
    "totalItemsCounted": 0
  }
}
```

### PUT /inventory/stock-counts/:id — Update counted quantities
```json
{
  "items": [
    { "productId": "p1", "countedQty": 148 },
    { "productId": "p2", "countedQty": 45 }
  ]
}
```

### POST /inventory/stock-counts/:id/complete
```json
// Response 200
{ "success": true, "message": "Stock count completed. Review and approve to apply changes." }
```

### POST /inventory/stock-counts/:id/approve
```json
// Response 200
{
  "success": true,
  "message": "Stock count approved. 3 products adjusted. Net variance: -৳160"
}
```

### DELETE /inventory/stock-counts/:id (draft only)

---

# 23. INVENTORY — EXPIRY TRACKING

---

### GET /inventory/expiry-records
```
Query: ?status=near_expiry,expired&search=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "exp1",
      "productId": "p5",
      "productName": "Pran Mango Juice 1ltr",
      "sku": "SKU-005",
      "batchNo": "B-2026-001",
      "expiryDate": "2026-05-15",
      "manufacturingDate": "2025-11-15",
      "qty": 15,
      "location": "Main Store",
      "status": "active",
      "disposedAt": "",
      "disposedQty": 0,
      "notes": ""
    }
  ]
}
```

### POST /inventory/expiry-records
```json
{
  "productId": "p5",
  "batchNo": "B-2026-005",
  "expiryDate": "2026-08-15",
  "manufacturingDate": "2026-02-15",
  "qty": 20,
  "location": "Main Store",
  "notes": ""
}
```

### PUT /inventory/expiry-records/:id
### POST /inventory/expiry-records/:id/dispose
```json
{ "disposedQty": 3, "notes": "Expired - thrown out" }
```

### DELETE /inventory/expiry-records/:id

---

# 24. FINANCE — CASH TRANSACTIONS

---

### GET /finance/cash-transactions
```
Query: ?paymentMethod=cash&type=in&dateFrom=&dateTo=&category=&search=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "ct1",
      "transactionNo": "CASH-0001",
      "date": "2026-04-01",
      "time": "09:00 AM",
      "type": "in",
      "category": "opening",
      "referenceType": "manual",
      "referenceId": "",
      "referenceNo": "",
      "description": "Opening cash balance",
      "amount": 25000,
      "paymentMethod": "cash",
      "balance": 25000,
      "createdBy": "Rahim",
      "createdAt": "2026-04-01T09:00:00Z"
    }
  ],
  "summary": {
    "totalIn": 85000,
    "totalOut": 62000,
    "netCashFlow": 23000,
    "openingBalance": 25000,
    "closingBalance": 48000
  }
}
```

### POST /finance/cash-transactions
```json
{
  "type": "in",
  "date": "2026-04-05",
  "paymentMethod": "cash",
  "category": "customer_collection",
  "description": "Collection from Hasan Grocery",
  "amount": 5000,
  "referenceNo": ""
}

// Response 201
{
  "success": true,
  "data": { "id": "ct31", "transactionNo": "CASH-0031", "balance": 53000, "...": "..." },
  "message": "Transaction CASH-0031 recorded"
}
```

---

# 25. FINANCE — EXPENSES

---

### GET /finance/expenses
```
Query: ?categoryId=&status=paid&paymentMethod=&dateFrom=&dateTo=&search=&page=1&limit=25
```
```json
{
  "success": true,
  "data": [
    {
      "id": "exp1",
      "expenseNo": "EXP-0001",
      "date": "2026-04-01",
      "categoryId": "ecat1",
      "categoryName": "Rent",
      "description": "Monthly shop rent - April",
      "amount": 15000,
      "paymentMethod": "cash",
      "referenceNo": "",
      "receiptImage": "",
      "isRecurring": true,
      "recurringFrequency": "monthly",
      "nextDueDate": "2026-05-01",
      "status": "paid",
      "notes": "",
      "createdBy": "Rahim",
      "createdAt": "2026-04-01T08:00:00Z"
    }
  ],
  "summary": {
    "totalThisMonth": 46250,
    "totalPaid": 42250,
    "totalPending": 4000,
    "overBudgetCategories": 1
  }
}
```

### POST /finance/expenses
```json
{
  "date": "2026-04-05",
  "categoryId": "ecat1",
  "description": "Monthly shop rent - April",
  "amount": 15000,
  "paymentMethod": "cash",
  "referenceNo": "",
  "receiptImage": "",
  "isRecurring": true,
  "recurringFrequency": "monthly",
  "status": "paid",
  "notes": ""
}
```

### PUT /finance/expenses/:id
### DELETE /finance/expenses/:id
### POST /finance/expenses/:id/mark-paid
```json
{ "paymentMethod": "cash", "date": "2026-04-05" }
```

---

# 26. FINANCE — EXPENSE CATEGORIES

---

### GET /finance/expense-categories
```json
{
  "success": true,
  "data": [
    {
      "id": "ecat1",
      "name": "Rent",
      "icon": "🏠",
      "description": "Monthly shop rent",
      "budgetMonthly": 15000,
      "isActive": true,
      "spentThisMonth": 15000
    },
    {
      "id": "ecat2",
      "name": "Salary & Wages",
      "icon": "👤",
      "description": "Staff salaries",
      "budgetMonthly": 30000,
      "isActive": true,
      "spentThisMonth": 25000
    }
  ]
}
```

### POST /finance/expense-categories
```json
{ "name": "Rent", "icon": "🏠", "description": "Monthly shop rent", "budgetMonthly": 15000, "isActive": true }
```

### PUT /finance/expense-categories/:id
### DELETE /finance/expense-categories/:id

---

# 27. FINANCE — SUPPLIER LEDGER

---

### GET /finance/supplier-ledger
```json
{
  "success": true,
  "data": [
    {
      "supplierId": "sup1",
      "supplierName": "Karim Traders",
      "phone": "01811111111",
      "totalPurchases": 45000,
      "totalPaid": 33000,
      "dueBalance": 12000,
      "lastTransaction": "2026-04-03",
      "paymentTerms": "30 days"
    }
  ],
  "summary": {
    "totalPayable": 22000,
    "paidThisMonth": 15000,
    "overdueCount": 1
  }
}
```

### GET /finance/supplier-ledger/:supplierId/statement
```
Query: ?dateFrom=2026-04-01&dateTo=2026-04-30
```
```json
{
  "success": true,
  "data": {
    "supplier": { "id": "sup1", "name": "Karim Traders", "phone": "01811111111", "address": "Kawran Bazar" },
    "period": { "from": "2026-04-01", "to": "2026-04-30" },
    "openingBalance": 8000,
    "entries": [
      { "id": "sle1", "date": "2026-04-01", "type": "purchase", "referenceNo": "PUR-0001", "description": "Purchase invoice", "debit": 6400, "credit": 0, "balance": 14400 },
      { "id": "sle2", "date": "2026-04-02", "type": "payment", "referenceNo": "SPAY-0001", "description": "Cash payment", "debit": 0, "credit": 5000, "balance": 9400 }
    ],
    "closingBalance": 12000,
    "summary": {
      "totalPurchases": 15000,
      "totalReturns": 310,
      "totalPaid": 8000,
      "closingBalance": 12000
    }
  }
}
```

---

# 28. FINANCE — CUSTOMER LEDGER

---

### GET /finance/customer-ledger
```json
{
  "success": true,
  "data": [
    {
      "customerId": "cust1",
      "customerName": "Hasan Grocery",
      "phone": "01911111111",
      "type": "Wholesale",
      "totalSales": 32000,
      "totalCollected": 26800,
      "dueBalance": 5200,
      "lastTransaction": "2026-04-04",
      "creditLimit": 50000
    }
  ],
  "summary": {
    "totalReceivable": 15200,
    "collectedThisMonth": 8000,
    "overdueCount": 2
  }
}
```

### GET /finance/customer-ledger/:customerId/statement
```json
// Same structure as supplier statement but with customer fields
```

---

# 29. FINANCE — VAT ENTRIES

---

### GET /finance/vat
```
Query: ?month=4&year=2026
```
```json
{
  "success": true,
  "data": {
    "period": { "month": 4, "year": 2026, "label": "April 2026" },
    "summary": {
      "outputVat": 4500,
      "inputVat": 2000,
      "netPayable": 2500,
      "transactionCount": 18
    },
    "outputEntries": [
      { "id": "vat1", "date": "2026-04-02", "type": "output", "referenceType": "sale", "referenceNo": "SINV-0001", "taxableAmount": 2250, "vatRate": 15, "vatAmount": 337.5 }
    ],
    "inputEntries": [
      { "id": "vat5", "date": "2026-04-01", "type": "input", "referenceType": "purchase", "referenceNo": "PUR-0002", "taxableAmount": 6840, "vatRate": 15, "vatAmount": 1026 }
    ]
  }
}
```

---

# 30. FINANCE — PROFIT & LOSS

---

### GET /finance/profit-loss
```
Query: ?dateFrom=2026-04-01&dateTo=2026-04-30
```
```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-04-01", "to": "2026-04-30" },
    "revenue": {
      "salesRevenue": 85000,
      "salesReturns": 2200,
      "netRevenue": 82800
    },
    "cogs": {
      "openingStock": 125000,
      "purchases": 45000,
      "purchaseReturns": 800,
      "closingStock": 107200,
      "totalCogs": 62000
    },
    "grossProfit": 20800,
    "grossMarginPct": 25.1,
    "expenses": {
      "categories": [
        { "name": "Rent", "amount": 15000 },
        { "name": "Salary & Wages", "amount": 25000 },
        { "name": "Electricity & Utilities", "amount": 3200 },
        { "name": "Transport & Delivery", "amount": 1800 },
        { "name": "Mobile & Internet", "amount": 800 },
        { "name": "Staff Refreshments", "amount": 450 },
        { "name": "Miscellaneous", "amount": 750 }
      ],
      "totalExpenses": 47000
    },
    "netProfit": -26200,
    "netMarginPct": -31.6,
    "monthlyTrend": [
      { "month": "Nov 2025", "revenue": 72000, "grossProfit": 18000, "netProfit": 8000 },
      { "month": "Dec 2025", "revenue": 88000, "grossProfit": 22000, "netProfit": 12000 },
      { "month": "Jan 2026", "revenue": 65000, "grossProfit": 16000, "netProfit": 6000 },
      { "month": "Feb 2026", "revenue": 78000, "grossProfit": 19000, "netProfit": 9000 },
      { "month": "Mar 2026", "revenue": 82000, "grossProfit": 21000, "netProfit": 11000 },
      { "month": "Apr 2026", "revenue": 85000, "grossProfit": 20800, "netProfit": -26200 }
    ]
  }
}
```

---

# 31. FINANCE — BALANCE SHEET

---

### GET /finance/balance-sheet
```
Query: ?asOf=2026-04-05
```
```json
{
  "success": true,
  "data": {
    "asOf": "2026-04-05",
    "assets": {
      "currentAssets": {
        "cashInHand": 48000,
        "bkashBalance": 12000,
        "bankBalance": 35000,
        "accountsReceivable": 15200,
        "inventoryValue": 107200
      },
      "totalCurrentAssets": 217400,
      "totalAssets": 217400
    },
    "liabilities": {
      "currentLiabilities": {
        "accountsPayable": 22000,
        "vatPayable": 2500
      },
      "totalLiabilities": 24500
    },
    "equity": {
      "netProfitYtd": 42900,
      "ownersCapital": 150000,
      "totalEquity": 192900
    },
    "totalLiabilitiesAndEquity": 217400,
    "isBalanced": true,
    "variance": 0
  }
}
```

---

# 32. REPORTS — AGGREGATED ENDPOINTS

---

### GET /reports/sales/summary
```
Query: ?period=this_month&dateFrom=&dateTo=
```
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalSales": 85000,
      "totalInvoices": 28,
      "avgInvoiceValue": 3035,
      "totalDiscount": 1200
    },
    "dailyData": [
      { "date": "2026-04-01", "invoices": 3, "grossSales": 4500, "discount": 100, "vat": 450, "netSales": 4850, "cash": 3000, "bkash": 1000, "credit": 850, "returns": 0 }
    ],
    "totals": { "invoices": 28, "grossSales": 86200, "discount": 1200, "vat": 6300, "netSales": 85000, "cash": 52000, "bkash": 18000, "credit": 15000, "returns": 2200 }
  }
}
```

### GET /reports/sales/by-product
```
Query: ?period=this_month&dateFrom=&dateTo=&sortBy=revenue
```
```json
{
  "success": true,
  "data": {
    "kpis": {
      "topProduct": { "name": "Miniket Rice 1kg", "qty": 320 },
      "totalUnitsSold": 1250,
      "highestRevenueProduct": { "name": "Teer Soybean Oil 5ltr", "revenue": 18000 },
      "uniqueProductsSold": 15
    },
    "products": [
      { "rank": 1, "productId": "p1", "name": "Miniket Rice 1kg", "sku": "SKU-001", "category": "Food & Grocery", "unit": "kg", "qtySold": 320, "avgPrice": 75, "revenue": 24000, "cogs": 19840, "grossProfit": 4160, "marginPct": 17.3 }
    ]
  }
}
```

### GET /reports/sales/by-customer
```
Query: ?period=this_month
```
```json
{
  "success": true,
  "data": {
    "kpis": { "topCustomer": { "name": "Hasan Grocery", "amount": 32000 }, "activeCustomers": 8, "avgSpend": 10625, "totalDue": 15200 },
    "customers": [
      { "rank": 1, "customerId": "cust1", "name": "Hasan Grocery", "type": "Wholesale", "invoices": 12, "grossSales": 34000, "discount": 500, "netSales": 33500, "paid": 28300, "due": 5200, "lastPurchase": "2026-04-04" }
    ]
  }
}
```

### GET /reports/sales/by-salesperson
### GET /reports/sales/returns
### GET /reports/sales/payment-methods

### GET /reports/purchase/summary
### GET /reports/purchase/by-supplier
### GET /reports/purchase/by-product
### GET /reports/purchase/returns

### GET /reports/inventory/stock-status
### GET /reports/inventory/valuation
### GET /reports/inventory/movements
### GET /reports/inventory/low-stock
```json
{
  "success": true,
  "data": {
    "kpis": { "belowReorder": 4, "outOfStock": 2, "estimatedReorderValue": 8500 },
    "items": [
      { "priority": "CRITICAL", "productId": "p4", "name": "Radhuni Turmeric 200g", "sku": "SKU-004", "category": "Spices", "unit": "pcs", "currentStock": 0, "reorderLevel": 15, "shortage": 15, "preferredSupplier": "Karim Traders", "lastPurchasePrice": 48, "reorderValue": 720 }
    ]
  }
}
```

### GET /reports/inventory/expiry
### GET /reports/inventory/dead-stock

### GET /reports/finance/cash-flow
### GET /reports/finance/expenses
### GET /reports/finance/supplier-dues
```json
{
  "success": true,
  "data": {
    "kpis": { "totalPayable": 22000, "current": 12000, "overdue": 10000 },
    "suppliers": [
      { "supplierId": "sup1", "name": "Karim Traders", "totalDue": 12000, "current": 6000, "days1to30": 4000, "days31to60": 2000, "days61to90": 0, "days90plus": 0, "lastPayment": "2026-04-02" }
    ]
  }
}
```

### GET /reports/finance/customer-dues
### GET /reports/pos/daily
### GET /reports/pos/sessions
### GET /reports/pos/products

---

# 33. DASHBOARD

---

### GET /dashboard
```json
{
  "success": true,
  "data": {
    "salesKpis": {
      "todaySales": 8500,
      "todayInvoices": 5,
      "monthSales": 85000,
      "monthGrowth": 3.7
    },
    "inventoryKpis": {
      "totalSkus": 42,
      "lowStockItems": 4,
      "outOfStockItems": 2,
      "totalStockValue": 107200
    },
    "financeKpis": {
      "cashInHand": 48000,
      "totalReceivable": 15200,
      "totalPayable": 22000,
      "netProfitThisMonth": 11000
    },
    "recentSales": [
      { "id": "sinv5", "invoiceNo": "SINV-0005", "customerName": "Walk-in", "amount": 850, "date": "2026-04-05", "status": "paid" }
    ],
    "topProducts": [
      { "name": "Miniket Rice 1kg", "qtySold": 320, "revenue": 24000 }
    ],
    "salesTrend": [
      { "date": "2026-04-01", "sales": 4500 },
      { "date": "2026-04-02", "sales": 6200 }
    ],
    "lowStockAlerts": [
      { "productId": "p4", "name": "Radhuni Turmeric 200g", "stock": 0, "threshold": 15 }
    ]
  }
}
```

---

# 34. SETTINGS

---

### GET /settings
```json
{
  "success": true,
  "data": {
    "shop": {
      "name": "Rahim General Store",
      "address": "123 Main Road, Mirpur, Dhaka",
      "phone": "01712345678",
      "email": "rahim@stockbd.com",
      "logo": ""
    },
    "finance": {
      "cashOpeningBalance": 25000,
      "bkashOpeningBalance": 5000,
      "bankOpeningBalance": 30000,
      "vatRegNo": "BIN-12345678",
      "financialYearStartMonth": 7,
      "currency": "BDT",
      "decimalPlaces": 0
    },
    "branches": [
      { "id": "br1", "name": "Main Store", "address": "Mirpur, Dhaka", "isMain": true },
      { "id": "br2", "name": "Branch - Uttara", "address": "Uttara, Dhaka", "isMain": false }
    ]
  }
}
```

### PUT /settings
```json
// Request (partial update)
{
  "shop": { "name": "Rahim General Store Updated" },
  "finance": { "vatRegNo": "BIN-99999999" }
}
```

---

# ERROR RESPONSE FORMAT (all endpoints)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must be greater than 0" },
    { "field": "supplierId", "message": "Supplier is required" }
  ]
}
```

# HTTP STATUS CODES
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (duplicate SKU, etc.)
- 500: Internal Server Error

---

# TOTAL ENDPOINTS SUMMARY

| Module               | Endpoints |
|----------------------|-----------|
| Auth                 | 4         |
| Products             | 5         |
| Categories           | 4         |
| Units                | 4         |
| Suppliers            | 4         |
| Customers            | 4         |
| Purchases            | 6         |
| Purchase Returns     | 2         |
| Supplier Payments    | 2         |
| Sales                | 5         |
| Sales Returns        | 2         |
| Customer Payments    | 2         |
| Quotations           | 4         |
| POS Sessions         | 3         |
| POS Invoices         | 2         |
| POS Held Sales       | 3         |
| POS Returns          | 2         |
| POS Cash Txns        | 2         |
| Inventory Movements  | 1         |
| Stock Adjustments    | 4         |
| Stock Transfers      | 5         |
| Stock Counts         | 5         |
| Expiry Records       | 5         |
| Cash Transactions    | 2         |
| Expenses             | 4         |
| Expense Categories   | 4         |
| Supplier Ledger      | 2         |
| Customer Ledger      | 2         |
| VAT                  | 1         |
| Profit & Loss        | 1         |
| Balance Sheet        | 1         |
| Reports (aggregated) | 18        |
| Dashboard            | 1         |
| Settings             | 2         |
| **TOTAL**            | **~118**  |
