const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const asyncHandler = require('express-async-handler');
const db = require('../../config/db');
const r2Client = require('../../utils/r2');

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// POST /api/uploads/presign
// Body: { filename, contentType, categoryId? }
const getPresignedUrl = asyncHandler(async (req, res) => {
  const { filename, contentType, categoryId } = req.body;

  if (!filename || !contentType) {
    res.status(400);
    throw new Error('filename and contentType are required');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(contentType)) {
    res.status(400);
    throw new Error('Only JPEG, PNG, WEBP, and GIF images are allowed');
  }

  // look up shop name server-side so the key is always scoped correctly
  const shop = await db('shops').where({ id: req.shopId }).first();
  if (!shop) { res.status(404); throw new Error('Shop not found'); }
  const shopSlug = slugify(shop.name);

  let categorySlug = 'general';
  if (categoryId) {
    const cat = await db('categories').where({ id: categoryId, shop_id: req.shopId }).first();
    if (cat) categorySlug = slugify(cat.name);
  }

  const ext = filename.split('.').pop().toLowerCase();
  const key = `${shopSlug}/products/${categorySlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicUrl = `${PUBLIC_URL}/${key}`;

  res.json({ presignedUrl, publicUrl, key });
});

// DELETE /api/uploads/:key
const deleteFile = asyncHandler(async (req, res) => {
  const key = req.params.key;
  if (!key) { res.status(400); throw new Error('key is required'); }

  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  res.json({ message: 'File deleted successfully' });
});

module.exports = { getPresignedUrl, deleteFile };
