const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');
const { getDefaultLocation, incrementLocationStock, getLocationStock } = require('./locationStockHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextTransferNo(shopId) {
  const [row] = await db('stock_transfers')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(transfer_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `TRF-${String(next).padStart(4, '0')}`;
}

function fmtItem(i) {
  return {
    id:           i.id,
    productId:    i.product_id,
    productName:  i.product_name,
    sku:          i.sku          || '',
    unit:         i.unit         || '',
    qtyRequested: parseFloat(i.qty_requested) || 0,
    qtySent:      parseFloat(i.qty_sent)      || 0,
    qtyReceived:  parseFloat(i.qty_received)  || 0,
  };
}

function fmtTransfer(t, items = []) {
  return {
    id:             t.id,
    transferNo:     t.transfer_no,
    date:           t.date,
    expectedDate:   t.expected_date    || '',
    fromBranch:     t.from_branch      || '',
    toBranch:       t.to_branch        || '',
    fromLocationId: t.from_location_id || null,
    toLocationId:   t.to_location_id   || null,
    totalItems:     t.total_items      || 0,
    status:         t.status,
    dispatchedAt:   t.dispatched_at    || '',
    receivedAt:     t.received_at      || '',
    notes:          t.notes            || '',
    createdBy:      t.created_by_name  || '',
    createdAt:      t.created_at,
    items:          items.map(fmtItem),
  };
}

async function logTransferMovement(trx, { shopId, product, type, referenceId, referenceNo, qtyChange, locationId, notes, createdByName }) {
  const qtyBefore = parseFloat(product.stock) || 0;

  await incrementLocationStock(trx, { productId: product.id, locationId, shopId, delta: qtyChange });

  // after increment, fetch updated total from products
  const updated = await trx('products').where({ id: product.id }).select('stock').first();
  const qtyAfter = parseFloat(updated?.stock) || 0;

  await trx('stock_movements').insert({
    shop_id:         shopId,
    date:            new Date().toISOString().split('T')[0],
    time:            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    product_id:      product.id,
    product_name:    product.name,
    sku:             product.sku || '',
    type,
    reference_type:  'transfer',
    reference_id:    referenceId,
    reference_no:    referenceNo,
    qty_before:      qtyBefore,
    qty_change:      qtyChange,
    qty_after:       qtyAfter,
    unit_cost:       parseFloat(product.purchase_price) || 0,
    total_value:     Math.abs(qtyChange) * (parseFloat(product.purchase_price) || 0),
    location_id:     locationId,
    notes,
    created_by_name: createdByName,
  });
}

// ─── GET /stock-transfers ─────────────────────────────────────────────────────

const getStockTransfers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  let q = db('stock_transfers').where({ shop_id: req.shopId });
  if (search) q = q.whereILike('transfer_no', `%${search}%`);
  if (status && status !== 'all') q = q.where({ status });

  const rows = await q.orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map((t) => fmtTransfer(t)) });
});

// ─── GET /stock-transfers/:id ─────────────────────────────────────────────────

const getStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await db('stock_transfers').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });

  const items = await db('stock_transfer_items').where({ transfer_id: transfer.id });
  res.json({ success: true, data: fmtTransfer(transfer, items) });
});

// ─── POST /stock-transfers ────────────────────────────────────────────────────

const createStockTransfer = asyncHandler(async (req, res) => {
  const { date, expectedDate, fromLocationId, toLocationId, fromBranch, toBranch, notes, items, dispatch } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ success: false, error: 'At least one item required' });

  const trfNo = await nextTransferNo(req.shopId);
  const user  = await db('users').where({ id: req.user.id }).select('name').first();
  const today = new Date().toISOString().split('T')[0];

  const result = await db.transaction(async (trx) => {
    // resolve locations
    const defaultLoc = await getDefaultLocation(trx, req.shopId);
    const fromLocId  = fromLocationId || defaultLoc.id;
    const toLocId    = toLocationId   || defaultLoc.id;

    // get location names for display
    const fromLoc = await trx('locations').where({ id: fromLocId }).select('name').first();
    const toLoc   = await trx('locations').where({ id: toLocId   }).select('name').first();

    const [transfer] = await trx('stock_transfers').insert({
      shop_id:          req.shopId,
      transfer_no:      trfNo,
      date:             date         || today,
      expected_date:    expectedDate || null,
      from_branch:      fromBranch   || fromLoc?.name || 'Main Warehouse',
      to_branch:        toBranch     || toLoc?.name   || 'Main Warehouse',
      from_location_id: fromLocId,
      to_location_id:   toLocId,
      total_items:      items.length,
      status:           dispatch ? 'dispatched' : 'draft',
      dispatched_at:    dispatch ? today : null,
      notes:            notes || null,
      created_by:       req.user.id,
      created_by_name:  user?.name || '',
    }).returning('*');

    const itemRows = items.map((i) => ({
      transfer_id:   transfer.id,
      product_id:    i.productId,
      product_name:  i.productName,
      sku:           i.sku  || null,
      unit:          i.unit || null,
      qty_requested: i.qtyRequested,
      qty_sent:      dispatch ? i.qtyRequested : 0,
      qty_received:  0,
    }));
    await trx('stock_transfer_items').insert(itemRows);

    if (dispatch) {
      for (const item of items) {
        const product = await trx('products').where({ id: item.productId, shop_id: req.shopId }).first();
        if (!product) continue;

        await logTransferMovement(trx, {
          shopId:        req.shopId,
          product,
          type:          'transfer_out',
          referenceId:   transfer.id,
          referenceNo:   trfNo,
          qtyChange:     -item.qtyRequested,
          locationId:    fromLocId,
          notes:         `Transfer to ${toLoc?.name || toBranch}`,
          createdByName: user?.name || '',
        });
      }
    }

    return transfer;
  });

  const insertedItems = await db('stock_transfer_items').where({ transfer_id: result.id });
  res.status(201).json({ success: true, data: fmtTransfer(result, insertedItems) });
});

// ─── POST /stock-transfers/:id/dispatch ──────────────────────────────────────

const dispatchStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await db('stock_transfers').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (transfer.status !== 'draft') return res.status(400).json({ success: false, error: 'Only draft transfers can be dispatched' });

  const items = await db('stock_transfer_items').where({ transfer_id: transfer.id });
  const user  = await db('users').where({ id: req.user.id }).select('name').first();
  const today = new Date().toISOString().split('T')[0];

  await db.transaction(async (trx) => {
    const defaultLoc = await getDefaultLocation(trx, req.shopId);
    const fromLocId  = transfer.from_location_id || defaultLoc.id;

    await trx('stock_transfers').where({ id: transfer.id }).update({ status: 'dispatched', dispatched_at: today });
    await trx('stock_transfer_items').where({ transfer_id: transfer.id }).update({ qty_sent: db.raw('qty_requested') });

    for (const item of items) {
      const product = await trx('products').where({ id: item.product_id, shop_id: req.shopId }).first();
      if (!product) continue;

      await logTransferMovement(trx, {
        shopId:        req.shopId,
        product,
        type:          'transfer_out',
        referenceId:   transfer.id,
        referenceNo:   transfer.transfer_no,
        qtyChange:     -parseFloat(item.qty_requested),
        locationId:    fromLocId,
        notes:         `Transfer to ${transfer.to_branch}`,
        createdByName: user?.name || '',
      });
    }
  });

  const updated      = await db('stock_transfers').where({ id: transfer.id }).first();
  const updatedItems = await db('stock_transfer_items').where({ transfer_id: transfer.id });
  res.json({ success: true, data: fmtTransfer(updated, updatedItems) });
});

// ─── POST /stock-transfers/:id/receive ───────────────────────────────────────

const receiveStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await db('stock_transfers').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (transfer.status !== 'dispatched') return res.status(400).json({ success: false, error: 'Only dispatched transfers can be received' });

  const { receivedQtys = {}, notes: receiveNotes } = req.body;
  const items = await db('stock_transfer_items').where({ transfer_id: transfer.id });
  const user  = await db('users').where({ id: req.user.id }).select('name').first();
  const today = new Date().toISOString().split('T')[0];

  await db.transaction(async (trx) => {
    const defaultLoc = await getDefaultLocation(trx, req.shopId);
    const toLocId    = transfer.to_location_id || defaultLoc.id;

    let allReceived = true;

    for (const item of items) {
      const received = receivedQtys[item.product_id] !== undefined
        ? parseFloat(receivedQtys[item.product_id])
        : parseFloat(item.qty_sent);

      await trx('stock_transfer_items').where({ id: item.id }).update({ qty_received: received });

      if (received < parseFloat(item.qty_sent)) allReceived = false;

      if (received > 0) {
        const product = await trx('products').where({ id: item.product_id, shop_id: req.shopId }).first();
        if (!product) continue;

        await logTransferMovement(trx, {
          shopId:        req.shopId,
          product,
          type:          'transfer_in',
          referenceId:   transfer.id,
          referenceNo:   transfer.transfer_no,
          qtyChange:     received,
          locationId:    toLocId,
          notes:         `Transfer from ${transfer.from_branch}${receiveNotes ? `. ${receiveNotes}` : ''}`,
          createdByName: user?.name || '',
        });
      }
    }

    const newStatus    = allReceived ? 'received' : 'partial';
    const existingNotes = transfer.notes || '';
    await trx('stock_transfers').where({ id: transfer.id }).update({
      status:      newStatus,
      received_at: today,
      notes:       receiveNotes ? `${existingNotes}${existingNotes ? '\n' : ''}Receive: ${receiveNotes}` : existingNotes,
    });
  });

  const updated      = await db('stock_transfers').where({ id: transfer.id }).first();
  const updatedItems = await db('stock_transfer_items').where({ transfer_id: transfer.id });
  res.json({ success: true, data: fmtTransfer(updated, updatedItems) });
});

// ─── DELETE /stock-transfers/:id ─────────────────────────────────────────────

const deleteStockTransfer = asyncHandler(async (req, res) => {
  const transfer = await db('stock_transfers').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (transfer.status !== 'draft') return res.status(400).json({ success: false, error: 'Only draft transfers can be deleted' });

  await db('stock_transfers').where({ id: transfer.id }).delete();
  res.json({ success: true, message: 'Transfer deleted' });
});

module.exports = { getStockTransfers, getStockTransfer, createStockTransfer, dispatchStockTransfer, receiveStockTransfer, deleteStockTransfer };
