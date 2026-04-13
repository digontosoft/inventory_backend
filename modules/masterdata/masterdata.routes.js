const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const {
  getUnits, createUnit, updateUnit, deleteUnit,
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
} = require('./masterdata.controller');
const {
  getLocations, getLocation, createLocation, updateLocation, setDefaultLocation, deleteLocation, getLocationStock,
} = require('./locations.controller');

router.use(authenticate);

// Units
router.route('/units').get(getUnits).post(createUnit);
router.route('/units/:id').put(updateUnit).delete(deleteUnit);

// Categories
router.route('/categories').get(getCategories).post(createCategory);
router.route('/categories/:id').put(updateCategory).delete(deleteCategory);

// Products
router.route('/products').get(getProducts).post(createProduct);
router.route('/products/:id').put(updateProduct).delete(deleteProduct);

// Suppliers
router.route('/suppliers').get(getSuppliers).post(createSupplier);
router.route('/suppliers/:id').put(updateSupplier).delete(deleteSupplier);

// Customers
router.route('/customers').get(getCustomers).post(createCustomer);
router.route('/customers/:id').put(updateCustomer).delete(deleteCustomer);

// Locations
router.route('/locations').get(getLocations).post(createLocation);
router.route('/locations/:id').get(getLocation).put(updateLocation).delete(deleteLocation);
router.put('/locations/:id/set-default', setDefaultLocation);
router.get('/locations/:id/stock', getLocationStock);

module.exports = router;
