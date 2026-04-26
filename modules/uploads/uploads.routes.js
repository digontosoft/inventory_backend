const { Router } = require('express');
const { getPresignedUrl, deleteFile } = require('./uploads.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.post('/uploads/presign', authenticate, getPresignedUrl);
router.delete('/uploads/:key(*)', authenticate, deleteFile);

module.exports = router;
