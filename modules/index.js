const { Router } = require('express');
const authRoutes       = require('./auth/auth.route');
const masterdataRoutes = require('./masterdata/masterdata.routes');

const router = Router();

router.use(authRoutes);
router.use(masterdataRoutes);

module.exports = router;
