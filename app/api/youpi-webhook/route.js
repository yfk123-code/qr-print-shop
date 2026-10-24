// Save as: app/api/youpi-webhook/route.js
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function POST(req) {
  // Raw body chahiye (JSON parse se pehle) tabhi signature sahi match hoga
  const raw = await req.text();

  const secret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get('x-gateway-signature') || '';
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');

  if (!safeEqual(signature, expected)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let p;
  try {
    p = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Bad JSON' }, { status: 400 });
  }

  if (p.event !== 'SUCCESS') {
    return Response.json({ received: true });
  }

  // order_id format: PRINT-<token_number>  (print/page.js me yehi bhejna hai)
  const token = parseInt(String(p.orderId).replace(/^PRINT-/, ''), 10);
  if (!Number.isInteger(token)) {
    return Response.json({ error: 'Bad orderId' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: rows, error } = await supabase
    .from('orders')
    .select('id, amount, payment_status, payment_method')
    .eq('token_number', token)
    .eq('payment_method', 'online');

  if (error) {
    // 500 par YouPI baad me dobara try karega
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // Duplicate / retry delivery: pehle se verified hai to kuch mat karo
  if (rows.every((r) => r.payment_status === 'verified')) {
    return Response.json({ received: true });
  }

  // Poore token ka total (paise me) YouPI ke amountPaise se match hona chahiye
  const totalPaise = rows.reduce(
    (sum, r) => sum + Math.round(Number(r.amount) * 100),
    0
  );

  if (totalPaise !== p.amountPaise) {
    await supabase
      .from('orders')
      .update({ payment_status: 'amount_mismatch', utr_number: p.utr || '' })
      .eq('token_number', token)
      .eq('payment_method', 'online');
    return Response.json({ received: true });
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update({ payment_status: 'verified', utr_number: p.utr || '' })
    .eq('token_number', token)
    .eq('payment_method', 'online');

  if (updErr) {
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}
