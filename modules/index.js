const { Router } = require('express');
const authRoutes = require('./auth/auth.route');

const router = Router();

router.use(authRoutes);

module.exports = router;
