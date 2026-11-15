/* ============================================================
   TechStore NP — shared.js (Supabase Version)
   Loaded by BOTH index.html and dashboard.html
   ============================================================ */

const SUPABASE_URL = "https://ezpskmkjkwrvqvhwljgs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Wdmy1zuWKkXE3GpFdo1CNA_vEDRSgUH";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Seed Data ---------- */
const SEED_CATEGORIES = [
    { key: 'smartwatch', label: 'Smartwatches' },
    { key: 'earbuds', label: 'Earbuds' },
    { key: 'power-banks', label: 'Power Banks' }
];

const SEED_PAYMENT_QR = {
    providerName: 'eSewa',
    accountId: '9800000000',
    qrImage: ''
};

const PAYMENT_STATUSES = [
    { key: 'Pending', label: 'Pending', color: 'gray' },
    { key: 'Payment Processing', label: 'Payment Processing', color: 'amber' },
    { key: 'Verified', label: 'Payment Received', color: 'green' },
    { key: 'Failed', label: 'Failed / Rejected', color: 'red' }
];

const ORDER_STATUSES = [
    { key: 'Order Placed', label: 'Order Placed', color: 'blue' },
    { key: 'Processing', label: 'Processing Your Order', color: 'amber' },
    { key: 'Packed', label: 'Order Packed', color: 'amber' },
    { key: 'Shipped', label: 'Shipped', color: 'indigo' },
    { key: 'Near You', label: 'Near Your Location', color: 'indigo' },
    { key: 'Out for Delivery', label: 'Out for Delivery – Attempting Today', color: 'purple' },
    { key: 'Delivered', label: 'Delivered', color: 'green' }
];

const SEED_DELIVERY = [
    { key: 'biratnagar', city: 'Biratnagar', province: 'Koshi', charge: 100 },
    { key: 'kathmandu', city: 'Kathmandu', province: 'Bagmati', charge: 150 },
    { key: 'dharan', city: 'Dharan', province: 'Koshi', charge: 150 },
    { key: 'itahari', city: 'Itahari', province: 'Koshi', charge: 150 },
    { key: 'pokhara', city: 'Pokhara', province: 'Gandaki', charge: 150 },
    { key: 'lalitpur', city: 'Lalitpur', province: 'Bagmati', charge: 150 },
    { key: 'bhaktapur', city: 'Bhaktapur', province: 'Bagmati', charge: 150 },
    { key: 'birgunj', city: 'Birgunj', province: 'Madhesh', charge: 150 },
    { key: 'butwal', city: 'Butwal', province: 'Lumbini', charge: 150 },
    { key: 'nepalgunj', city: 'Nepalgunj', province: 'Lumbini', charge: 150 },
    { key: 'dhangadhi', city: 'Dhangadhi', province: 'Sudurpashchim', charge: 150 }
];

/* ============================================================
   Utilities
   ============================================================ */
function slugify(str) {
    return String(str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getImages(p) {
    if (!p) return [];
    if (Array.isArray(p.images) && p.images.length) return p.images.filter(Boolean);
    if (typeof p.images === 'string') {
        try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
        } catch (e) { /* ignore */ }
    }
    return p.image ? [p.image] : [];
}

/* ============================================================
   Seeding
   ============================================================ */
async function ensureSeeded() {
    try {
        const { data: cats } = await db.from('categories').select('*').limit(1);
        if (!cats || cats.length === 0) await db.from('categories').insert(SEED_CATEGORIES);

        const { data: del } = await db.from('delivery_rates').select('*').limit(1);
        if (!del || del.length === 0) await db.from('delivery_rates').insert(SEED_DELIVERY);

        const { data: pm } = await db.from('payment_methods').select('*').limit(1);
        if (!pm || pm.length === 0) {
            await db.from('payment_methods').insert([
                {
                    key: 'esewa',
                    name: SEED_PAYMENT_QR.providerName,
                    type: 'qr',
                    enabled: true,
                    accountId: SEED_PAYMENT_QR.accountId,
                    qrImage: SEED_PAYMENT_QR.qrImage,
                    instructions: 'Add your Order ID in the remarks.'
                },
                { key: 'cod', name: 'Cash on Delivery', type: 'cod', enabled: true }
            ]);
        }
    } catch (err) {
        console.warn('ensureSeeded warning:', err?.message || err);
    }
}

/* ============================================================
   Subscriptions
   ============================================================ */
function subscribeProducts(callback) {
    const handler = async () => {
        const { data } = await db.from('products').select('*').order('created_at', { ascending: false });
        callback(data || []);
    };
    handler();
    const channel = db.channel('products-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribeCategories(callback) {
    const handler = async () => {
        const { data } = await db.from('categories').select('*');
        callback(data || []);
    };
    handler();
    const channel = db.channel('categories-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribeDelivery(callback) {
    const handler = async () => {
        const { data } = await db.from('delivery_rates').select('*');
        callback(data || []);
    };
    handler();
    const channel = db.channel('delivery-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_rates' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribePaymentMethods(callback) {
    const handler = async () => {
        const { data } = await db.from('payment_methods').select('*');
        callback(data || []);
    };
    handler();
    const channel = db.channel('payment-methods-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribeReviews(callback) {
    const handler = async () => {
        const { data } = await db.from('reviews').select('*').order('created_at', { ascending: false });
        callback(data || []);
    };
    handler();
    const channel = db.channel('reviews-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribeAllOrders(callback) {
    const handler = async () => {
        const { data } = await db.from('orders').select('*').order('created_at', { ascending: false });
        callback(data || []);
    };
    handler();
    const channel = db.channel('orders-all-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

function subscribeUserOrders(userId, callback) {
    const handler = async () => {
        const { data } = await db.from('orders')
            .select('*')
            .eq('user_id', String(userId))
            .order('created_at', { ascending: false });
        callback(data || []);
    };
    handler();
    const channel = db.channel(`orders-user-${userId}-rt`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
            handler)
        .subscribe();
    return () => db.removeChannel(channel);
}

/* ============================================================
   Reviews
   ============================================================ */
async function fetchAllReviews() {
    const { data, error } = await db.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

async function saveReview({ product_id, user_id, user_name, rating, comment }) {
    const row = {
        product_id: String(product_id),
        user_id: String(user_id),
        user_name: String(user_name || ''),
        rating: Number(rating) || 0,
        comment: String(comment || '')
    };
    const { data, error } = await db.from('reviews')
        .upsert(row, { onConflict: 'product_id,user_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function deleteReview(id) {
    const { error } = await db.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return true;
}

/* ============================================================
   Products CRUD
   ============================================================ */
async function saveProductDoc(id, payload) {
    const data = { ...payload, images: payload.images || [] };
    if (id) {
        const { error } = await db.from('products').update(data).eq('id', id);
        if (error) throw error;
        return id;
    }
    const { data: inserted, error } = await db.from('products').insert(data).select().single();
    if (error) throw error;
    return inserted.id;
}

async function deleteProductDoc(id) {
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
}

/* ============================================================
   Bulk CRUD (dashboard uses array replace)
   ============================================================ */
async function saveCategoriesDoc(list) {
    const { error: delErr } = await db.from('categories').delete().neq('key', '__never__');
    if (delErr) throw delErr;
    if (!list.length) return true;
    const { error } = await db.from('categories').insert(list);
    if (error) throw error;
    return true;
}

async function saveDeliveryDoc(list) {
    const { error: delErr } = await db.from('delivery_rates').delete().neq('key', '__never__');
    if (delErr) throw delErr;
    if (!list.length) return true;
    const { error } = await db.from('delivery_rates').insert(list);
    if (error) throw error;
    return true;
}

async function savePaymentMethods(list) {
    const { error: delErr } = await db.from('payment_methods').delete().neq('key', '__never__');
    if (delErr) throw delErr;
    if (!list.length) return true;
    const { error } = await db.from('payment_methods').insert(list);
    if (error) throw error;
    return true;
}

/* ============================================================
   Orders
   ============================================================ */
async function createOrder(payload) {
    const { data, error } = await db.from('orders').insert(payload).select().single();
    if (error) throw error;
    return data;
}

async function updateOrderDetails(orderId, patch) {
    const { data, error } = await db.from('orders').update(patch).eq('id', orderId).select().single();
    if (error) throw error;
    return data;
}

async function fetchUserOrders(userId) {
    const { data, error } = await db.from('orders')
        .select('*')
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

/* ============================================================
   Users
   ============================================================ */
async function registerUser(name, email, phone, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const { data: existing } = await db.from('users_app').select('id').eq('email', cleanEmail).limit(1);
    if (existing && existing.length) throw new Error('An account with this email already exists.');

    const { data, error } = await db.from('users_app').insert({
        name: String(name || '').trim(),
        email: cleanEmail,
        phone: String(phone || '').trim(),
        password: String(password || '')
    }).select().single();
    if (error) throw error;
    return data;
}

async function loginUser(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const { data, error } = await db.from('users_app')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', String(password || ''))
        .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Invalid email or password.');
    return data[0];
}

async function updateUser(id, patch) {
    const allowed = {};
    if (patch.name !== undefined) allowed.name = String(patch.name).trim();
    if (patch.phone !== undefined) allowed.phone = String(patch.phone).trim();
    if (patch.password !== undefined && patch.password !== '') allowed.password = String(patch.password);
    const { data, error } = await db.from('users_app').update(allowed).eq('id', id).select().single();
    if (error) throw error;
    return data;
}