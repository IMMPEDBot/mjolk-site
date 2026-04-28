/* ════════════════════════════════════════════════════════════════
   MJÖLK COOKIES — Shared App Logic
   Cart persists across pages via localStorage.
   ════════════════════════════════════════════════════════════════ */

const PRICES = {
  original: 30.00,
  brownie: 30.00,
  redvelvet: 30.00,
  dubai: 30.00
};
const NAMES = {
  original: 'The Original',
  brownie: 'The Brownie',
  redvelvet: 'Red Velvet',
  dubai: 'Dubai Chocolate'
};
const STORAGE_KEY = 'mjolk_cart_v1';
const FREE_DELIVERY_THRESHOLD = 150;
const DELIVERY = 4.50;
const MIN_COOKIES = 4;

/* ───────── Cart state ───────── */
function loadCart(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Always ensure all SKU keys exist
      return Object.assign({ original:0, brownie:0, redvelvet:0, dubai:0 }, parsed);
    }
  } catch(e){ /* localStorage unavailable, fall through */ }
  return { original:0, brownie:0, redvelvet:0, dubai:0 };
}
function saveCart(cart){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch(e){}
}
let cart = loadCart();

function totalCount(){ return Object.values(cart).reduce((a,b)=>a+b,0) }
function subtotal(){ return Object.entries(cart).reduce((s,[k,q])=>s+PRICES[k]*q,0) }
function deliveryCost(){
  const sub = subtotal();
  return sub === 0 ? 0 : (sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY);
}
function grandTotal(){ return subtotal() + deliveryCost() }

/* ───────── Update / render ───────── */
function updateQty(sku, delta){
  cart[sku] = Math.max(0, (cart[sku]||0) + delta);
  saveCart(cart);
  if (delta > 0) showToast(`Added ${NAMES[sku]} to your tin`);
  renderAll();
}
function setQty(sku, n){
  cart[sku] = Math.max(0, parseInt(n,10) || 0);
  saveCart(cart);
  renderAll();
}
function removeFromCart(sku){
  cart[sku] = 0;
  saveCart(cart);
  showToast(`Removed ${NAMES[sku]} from your tin`);
  renderAll();
}
function clearCart(){
  cart = { original:0, brownie:0, redvelvet:0, dubai:0 };
  saveCart(cart);
  renderAll();
}

function renderAll(){
  const sub = subtotal();
  const count = totalCount();
  const delivery = deliveryCost();
  const total = grandTotal();

  // Cart count badge
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count);

  // Sticky CTA price
  const sticky = document.getElementById('sticky-price');
  if (sticky) sticky.textContent = '£' + total.toFixed(2);

  // Per-SKU quantity displays (shop page)
  Object.keys(cart).forEach(sku => {
    const el = document.getElementById('qty-' + sku);
    if (el) el.textContent = cart[sku];
  });

  // Tin builder summary (shop page)
  const summaryEl = document.getElementById('tin-summary');
  if (summaryEl) {
    if (count === 0) {
      summaryEl.innerHTML = '<div class="empty-line">Your tin\'s empty — pick a cookie above to start.</div>';
    } else {
      summaryEl.innerHTML = Object.entries(cart)
        .filter(([_,q]) => q > 0)
        .map(([sku, q]) => `
          <div class="line">
            <span>${NAMES[sku]} <span style="opacity:.5">× ${q}</span></span>
            <span>£${(PRICES[sku]*q).toFixed(2)}</span>
          </div>
        `).join('');
    }
  }

  // Tin builder totals
  const bSub = document.getElementById('builder-subtotal');
  const bDel = document.getElementById('builder-delivery');
  const bTot = document.getElementById('builder-total');
  if (bSub) bSub.textContent = '£' + sub.toFixed(2);
  if (bDel) bDel.textContent = sub >= FREE_DELIVERY_THRESHOLD ? 'FREE' : '£' + DELIVERY.toFixed(2);
  if (bTot) bTot.textContent = '£' + total.toFixed(2);

  // Progress bar
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('delivery-progress');
  if (progressFill && progressText) {
    const progress = Math.min(100, (sub / FREE_DELIVERY_THRESHOLD) * 100);
    progressFill.style.width = progress + '%';
    if (sub >= FREE_DELIVERY_THRESHOLD) {
      progressText.innerHTML = '<strong style="color: var(--mustard)">✓ Same-day Birmingham delivery on us.</strong><div class="progress-bar"><div class="progress-bar-fill" style="width:100%"></div></div>';
    } else if (count > 0) {
      progressText.innerHTML = `Add <strong style="color: var(--mustard)">£${(FREE_DELIVERY_THRESHOLD-sub).toFixed(2)}</strong> more for free same-day Birmingham delivery.<div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>`;
    } else {
      progressText.innerHTML = `Free same-day Birmingham delivery on tins over £${FREE_DELIVERY_THRESHOLD}.<div class="progress-bar"><div class="progress-bar-fill" style="width:0%"></div></div>`;
    }
  }

  // Builder CTA state
  const ctaBtn = document.getElementById('builder-cta');
  if (ctaBtn) {
    if (count === 0) {
      ctaBtn.disabled = true;
      ctaBtn.textContent = `Pick at least ${MIN_COOKIES} cookies →`;
    } else if (count < MIN_COOKIES) {
      ctaBtn.disabled = true;
      const need = MIN_COOKIES - count;
      ctaBtn.textContent = `Add ${need} more cookie${need===1?'':'s'} →`;
    } else {
      ctaBtn.disabled = false;
      ctaBtn.textContent = `Send my tin · £${total.toFixed(2)} →`;
    }
  }

  // Cart drawer body
  const cartBody = document.getElementById('cart-body');
  if (cartBody) {
    if (count === 0) {
      cartBody.innerHTML = '<div class="cart-empty">Nothing in here yet.<br><a href="index.html#shop">Pick a cookie, any cookie →</a></div>';
    } else {
      cartBody.innerHTML = Object.entries(cart)
        .filter(([_,q]) => q > 0)
        .map(([sku, q]) => `
          <div class="cart-line">
            <div class="cart-line-info">
              <div class="cart-line-name">${NAMES[sku]}</div>
              <div class="cart-line-qty">£${PRICES[sku].toFixed(2)} each</div>
            </div>
            <div class="cart-line-controls">
              <button class="cart-line-btn" onclick="updateQty('${sku}', -1)" aria-label="Remove one">−</button>
              <span style="font-family:'Fraunces',serif; font-weight:600; min-width:18px; text-align:center">${q}</span>
              <button class="cart-line-btn" onclick="updateQty('${sku}', 1)" aria-label="Add one">+</button>
            </div>
            <div class="cart-line-price">£${(PRICES[sku]*q).toFixed(2)}</div>
          </div>
        `).join('');
    }
  }

  const cSub = document.getElementById('cart-subtotal');
  const cDel = document.getElementById('cart-delivery');
  const cTot = document.getElementById('cart-total');
  const cBtn = document.getElementById('cart-checkout-btn');
  if (cSub) cSub.textContent = '£' + sub.toFixed(2);
  if (cDel) cDel.textContent = sub >= FREE_DELIVERY_THRESHOLD ? 'FREE' : '£' + DELIVERY.toFixed(2);
  if (cTot) cTot.textContent = '£' + total.toFixed(2);
  if (cBtn) {
    if (count === 0) {
      cBtn.disabled = true; cBtn.textContent = 'Your tin is empty';
    } else if (count < MIN_COOKIES) {
      cBtn.disabled = true; cBtn.textContent = `Need ${MIN_COOKIES - count} more cookie(s)`;
    } else {
      cBtn.disabled = false; cBtn.textContent = `Checkout · £${total.toFixed(2)} →`;
    }
  }
}

/* ───────── Cart drawer open/close ───────── */
function openCart(){
  const ov = document.getElementById('cart-overlay');
  const dr = document.getElementById('cart-drawer');
  if (ov) ov.classList.add('open');
  if (dr) dr.classList.add('open');
  renderAll();
}
function closeCart(){
  const ov = document.getElementById('cart-overlay');
  const dr = document.getElementById('cart-drawer');
  if (ov) ov.classList.remove('open');
  if (dr) dr.classList.remove('open');
}

/* ───────── Postcode checker ───────── */
function checkPostcode(e){
  e.preventDefault();
  const input = document.getElementById('postcode-input');
  const result = document.getElementById('postcode-result');
  if (!input || !result) return;

  const val = input.value.trim().toUpperCase();
  if (!val.match(/^[A-Z]{1,2}\d/)) {
    result.className = 'postcode-result info';
    result.innerHTML = `<span class="check">⚠</span> Hmm, that doesn't look like a UK postcode. Try again?`;
    return;
  }
  // Birmingham + West Midlands prefixes
  const wm = /^(B|CV|DY|WS|WV)\d/;
  if (wm.test(val)) {
    result.className = 'postcode-result success';
    result.innerHTML = `<span class="check">✓</span> Brilliant — same-day delivery available across the West Midlands. Order before 2pm.`;
  } else {
    result.className = 'postcode-result info';
    result.innerHTML = `<span class="check">→</span> Outside the West Midlands — but next-day UK delivery is available at checkout.`;
  }
}

/* ───────── FAQ accordion ───────── */
function toggleFAQ(item){ item.classList.toggle('open') }

/* ───────── Mobile nav ───────── */
function toggleMobileMenu(){
  const ul = document.querySelector('nav.site-nav ul');
  if (ul) ul.classList.toggle('mobile-open');
}

/* ───────── Generic form handler (newsletter, contact, corporate, wholesale) ───────── */
function handleForm(e, message){
  e.preventDefault();
  showToast(message || 'Sent — we\'ll be in touch.');
  e.target.reset();
}
function subscribeNewsletter(e){ handleForm(e, 'Code on its way to your inbox.') }
function submitContact(e){ handleForm(e, 'Message sent — we\'ll reply within 24 hours.') }
function submitCorporate(e){ handleForm(e, 'Thanks — we\'ll send a corporate fika proposal within 24 hours.') }
function submitWholesale(e){ handleForm(e, 'Got it — our wholesale team will be in touch within 2 working days.') }
function submitSubscription(e, plan){
  e.preventDefault();
  showToast(`${plan} subscription started — first tin ships ${nextTuesday()}.`);
}

function nextTuesday(){
  const d = new Date();
  const dayOfWeek = d.getDay(); // 0=Sun, 2=Tue
  const daysUntilTue = (2 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilTue);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ───────── Checkout (demo) ───────── */
function checkout(){
  const count = totalCount();
  if (count < MIN_COOKIES) {
    showToast(`Add ${MIN_COOKIES - count} more cookie(s) first.`);
    return;
  }
  showToast(`Heading to checkout · £${grandTotal().toFixed(2)}…`);
  // In production: window.location.href = 'checkout.html';
}

/* ───────── Toast ───────── */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ───────── Active nav highlight ───────── */
function highlightActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.site-nav ul a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html')) {
      // Don't highlight the homepage anchor links
      if (!href.includes('#')) a.classList.add('is-active');
    }
  });
}

/* ───────── Init ───────── */
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  renderAll();

  // Listen for storage events to sync cart across tabs
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      cart = loadCart();
      renderAll();
    }
  });

  // Close cart on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });
});
