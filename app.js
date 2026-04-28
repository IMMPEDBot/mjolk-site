/* ════════════════════════════════════════════════════════════════
   MJÖLK COOKIES — Shared App Logic
   Cart persists across pages via localStorage.
   ════════════════════════════════════════════════════════════════ */

const PRICES = {
  // Year-round staples
  original: 30.00,
  brownie: 30.00,
  redvelvet: 30.00,
  dubai: 30.00,
  // Seasonal SKUs — only buyable while their theme is active.
  // Kept in PRICES year-round so a cart that already holds one
  // (added during the theme) still renders correctly afterwards.
  eidMamoul: 35.00,
  ramadanDate: 35.00,
  valentineLove: 55.00,
  easterBunny: 35.00,
  julTree: 35.00
};
const NAMES = {
  original: 'The Original',
  brownie: 'The Brownie',
  redvelvet: 'Red Velvet',
  dubai: 'Dubai Chocolate',
  eidMamoul: "Eid Ma'amoul",
  ramadanDate: 'Date Caramel',
  valentineLove: 'The Love Tin',
  easterBunny: 'Easter Bunny',
  julTree: 'Christmas Tree'
};
const STORAGE_KEY = 'mjolk_cart_v1';
const FREE_DELIVERY_THRESHOLD = 80;
const DELIVERY = 6.95;

/* ───────── Cart state ───────── */
function emptyCart(){
  const c = {};
  for (const sku in PRICES) c[sku] = 0;
  return c;
}
function loadCart(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Object.assign(emptyCart(), parsed);
    }
  } catch(e){ /* localStorage unavailable, fall through */ }
  return emptyCart();
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
  cart = emptyCart();
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
      ctaBtn.textContent = 'Pick a cookie →';
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
  // Same-day: Birmingham only (B-postcodes within ~10mi of Digbeth)
  const birmingham = /^B\d/;
  // Next-day West Midlands tier
  const westMids = /^(CV|DY|WS|WV)\d/;
  if (birmingham.test(val)) {
    result.className = 'postcode-result success';
    result.innerHTML = `<span class="check">✓</span> Same-day Birmingham — order by 11am Mon–Fri and your tin arrives between 4 and 7pm.`;
  } else if (westMids.test(val)) {
    result.className = 'postcode-result success';
    result.innerHTML = `<span class="check">✓</span> Next working day across the West Midlands — order by 2pm Mon–Thu.`;
  } else {
    result.className = 'postcode-result info';
    result.innerHTML = `<span class="check">→</span> Outside the West Midlands — Royal Mail Tracked 24 next-working-day at checkout (£5.95).`;
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
  if (count === 0) {
    showToast('Your tin is empty — pick a cookie first.');
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

/* ───────── Date-aware theming (content) ─────────
   theme-init.js sets data-theme + window.MJOLK_THEME synchronously
   in <head>. Here we swap copy on the topbar + homepage hero eyebrow
   to match the active occasion. CSS overrides handle the palette. */
const THEME_CONTENT = {
  ramadan: {
    topbar: 'Ramadan Mubarak — Birmingham iftar tins by 6pm · Order by 11am',
    eyebrow: 'Sweet endings to your iftar — Birmingham same-day, UK next-day.'
  },
  eid: {
    topbar: 'Eid Mubarak — order by 11am Mon–Fri for same-day Birmingham',
    eyebrow: 'Eid Mubarak — fresh-baked tins for warm gatherings.'
  },
  valentine: {
    topbar: "Order by Feb 13, 11am for Valentine's same-day Birmingham · UK next-day",
    eyebrow: 'Cookies for the people you love — Birmingham same-day, UK next-working-day.'
  },
  easter: {
    topbar: 'Glad Påsk — order by Easter Saturday 11am for Sunday Birmingham delivery',
    eyebrow: 'Glad Påsk — Birmingham same-day, UK next-working-day.'
  },
  blackfriday: {
    topbar: 'BLACK FRIDAY weekend — bake slots fill fast · Order by 11am for same-day',
    eyebrow: 'The biggest tin order weekend of the year — slots fill quickly.'
  },
  jul: {
    topbar: 'God Jul — order by Dec 23, 11am for Christmas Eve Birmingham delivery',
    eyebrow: 'God Jul — fresh from the oven, on your Birmingham doorstep.'
  }
};

function applyThemeContent(){
  const theme = window.MJOLK_THEME;
  if (!theme || !THEME_CONTENT[theme]) return;
  const c = THEME_CONTENT[theme];

  // Topbar — preserve the leading pulse dot, replace the message
  const topbar = document.querySelector('.topbar');
  if (topbar && c.topbar) {
    topbar.innerHTML = '<span class="pulse"></span> ' + c.topbar;
  }

  // Hero eyebrow on homepage — preserve the leading SVG icon, replace text
  const eyebrow = document.querySelector('.hero .eyebrow');
  if (eyebrow && c.eyebrow) {
    const icon = eyebrow.querySelector('svg');
    eyebrow.innerHTML = '';
    if (icon) eyebrow.appendChild(icon);
    eyebrow.appendChild(document.createTextNode(' ' + c.eyebrow));
  }
}

/* ───────── Seasonal limited-edition products ─────────
   Each themed period unlocks one extra SKU in the shop, shown as a
   spotlight card injected above the staple grid on the homepage.
   The SKU stays in PRICES/NAMES year-round so a cart added during
   the theme still renders correctly afterwards. */
const SEASONAL_PRODUCTS = {
  eid: {
    sku: 'eidMamoul',
    stamp: 'Eid 2026',
    name: "Eid Ma'amoul",
    tagline: 'date-filled shortbread · powdered sugar',
    desc: "Buttery semolina shortbread filled with sweet medjool date paste and dusted in powdered sugar. The traditional Eid pastry, baked the night before so it's still soft for the morning.",
    allergens: 'wheat · milk · egg',
    bannerLabel: 'Limited release · Eid 2026',
    headline: "A date-filled ma'amoul, baked just for Eid.",
    detail: 'Available Mar 20–22 only. Same-day Birmingham (B-postcodes), next-working-day across the UK.',
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ms-mamoul" cx=".4" cy=".35"><stop offset="0%" stop-color="#F4E5C2"/><stop offset="60%" stop-color="#D9B97A"/><stop offset="100%" stop-color="#9C7838"/></radialGradient></defs><ellipse cx="100" cy="105" rx="80" ry="68" fill="url(#ms-mamoul)"/><g stroke="#5C3A1F" stroke-width="1.2" opacity=".5" fill="none"><line x1="40" y1="80" x2="160" y2="80"/><line x1="35" y1="100" x2="165" y2="100"/><line x1="40" y1="120" x2="160" y2="120"/><line x1="80" y1="50" x2="80" y2="150"/><line x1="100" y1="45" x2="100" y2="155"/><line x1="120" y1="50" x2="120" y2="150"/></g><path d="M 60 100 Q 80 90, 100 95 Q 120 100, 140 95" stroke="#3F2417" stroke-width="2" fill="none" opacity=".7"/><g fill="#FBF4E1" opacity=".75"><circle cx="65" cy="70" r="2"/><circle cx="80" cy="65" r="1.5"/><circle cx="105" cy="60" r="2"/><circle cx="130" cy="68" r="1.8"/><circle cx="145" cy="75" r="1.5"/><circle cx="60" cy="115" r="1.5"/><circle cx="135" cy="125" r="1.8"/><circle cx="92" cy="135" r="1.6"/></g></svg>'
  },
  ramadan: {
    sku: 'ramadanDate',
    stamp: 'Ramadan 2026',
    name: 'Date Caramel',
    tagline: 'medjool dates · salted caramel',
    desc: 'Brown butter cookie with chunks of medjool date and a salted caramel swirl. Baked late afternoon and delivered before maghrib so it lands warm on the iftar table.',
    allergens: 'wheat · milk · egg · soy',
    bannerLabel: 'Limited release · Ramadan 2026',
    headline: 'A date caramel cookie, for breaking the fast.',
    detail: 'Available Feb 17 – Mar 19. Birmingham same-day (B-postcodes) — order by 11am for delivery before sunset.',
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ms-date" cx=".4" cy=".4"><stop offset="0%" stop-color="#A6692D"/><stop offset="60%" stop-color="#6B3E15"/><stop offset="100%" stop-color="#3A1F0A"/></radialGradient></defs><circle cx="100" cy="100" r="82" fill="url(#ms-date)"/><circle cx="100" cy="100" r="82" fill="none" stroke="#3A1F0A" stroke-width="1.2" stroke-dasharray="2,3" opacity=".4"/><ellipse cx="75" cy="80" rx="14" ry="10" fill="#4A2818" transform="rotate(-15 75 80)"/><ellipse cx="115" cy="75" rx="12" ry="9" fill="#5C3018" transform="rotate(20 115 75)"/><ellipse cx="130" cy="115" rx="13" ry="9" fill="#3F1E0C"/><ellipse cx="80" cy="125" rx="11" ry="8" fill="#5C3018" transform="rotate(35 80 125)"/><path d="M 50 70 Q 100 90, 150 65 Q 130 100, 80 110 Q 110 130, 160 115" stroke="#D4A648" stroke-width="3" fill="none" stroke-linecap="round" opacity=".88"/><circle cx="62" cy="120" r="2.5" fill="#FBF4E1" opacity=".5"/><circle cx="142" cy="85" r="2" fill="#FBF4E1" opacity=".5"/></svg>'
  },
  valentine: {
    sku: 'valentineLove',
    stamp: 'Valentine 2026',
    name: 'The Love Tin',
    tagline: 'heart-shaped tin · two cookies',
    desc: 'A keepsake heart-shaped tin holding two cookies of your choice, finished with a wax-sealed handwritten love note. Built for the doorstep ambush, not the dinner-reservation panic.',
    allergens: 'wheat · milk · egg · soy',
    bannerLabel: "Limited release · Valentine's 2026",
    headline: 'The Love Tin — for the people you love.',
    detail: "Available Feb 1 – 14. Order by Feb 13, 11am for same-day Birmingham. UK next-working-day at checkout.",
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ms-heart" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D67D8D"/><stop offset="100%" stop-color="#A02C4D"/></linearGradient></defs><path d="M 100 175 C 60 175, 30 145, 30 100 C 30 70, 50 55, 70 55 C 85 55, 95 65, 100 75 C 105 65, 115 55, 130 55 C 150 55, 170 70, 170 100 C 170 145, 140 175, 100 175 Z" fill="rgba(15,36,56,.25)" transform="translate(0, 8)"/><path d="M 100 170 C 60 170, 30 140, 30 95 C 30 65, 50 50, 70 50 C 85 50, 95 60, 100 70 C 105 60, 115 50, 130 50 C 150 50, 170 65, 170 95 C 170 140, 140 170, 100 170 Z" fill="url(#ms-heart)"/><path d="M 100 60 C 65 60, 38 80, 38 95 C 50 95, 60 95, 100 95 C 140 95, 150 95, 162 95 C 162 80, 135 60, 100 60 Z" fill="#B83A5B"/><circle cx="100" cy="125" r="22" fill="#E2A93B"/><text x="100" y="124" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="11" font-weight="700" fill="#5A1A2D">MJÖLK</text><text x="100" y="137" text-anchor="middle" font-family="Caveat, cursive" font-size="11" fill="#5A1A2D">älskar dig</text><rect x="92" y="150" width="16" height="18" fill="#FBF4E1"/><path d="M 92 150 L 80 168 L 92 162 Z M 108 150 L 120 168 L 108 162 Z" fill="#FBF4E1"/></svg>'
  },
  easter: {
    sku: 'easterBunny',
    stamp: 'Påsk 2026',
    name: 'Easter Bunny',
    tagline: 'butter shortbread · white chocolate tail',
    desc: 'Golden brown-butter shortbread shaped like a bunny, with a white-chocolate cottontail and pastel sprinkles. Made the morning of Easter Saturday so the icing\'s still soft.',
    allergens: 'wheat · milk · egg',
    bannerLabel: 'Limited release · Påsk 2026',
    headline: 'An Easter bunny in golden butter shortbread.',
    detail: 'Available Mar 29 – Apr 5. Order by Easter Saturday 11am for same-day Birmingham; UK next-working-day.',
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ms-bunny" cx=".4" cy=".4"><stop offset="0%" stop-color="#E5B97A"/><stop offset="60%" stop-color="#B5803A"/><stop offset="100%" stop-color="#7A5022"/></radialGradient></defs><ellipse cx="100" cy="138" rx="50" ry="38" fill="url(#ms-bunny)"/><circle cx="100" cy="80" r="30" fill="url(#ms-bunny)"/><ellipse cx="86" cy="42" rx="9" ry="22" fill="url(#ms-bunny)"/><ellipse cx="114" cy="42" rx="9" ry="22" fill="url(#ms-bunny)"/><ellipse cx="86" cy="46" rx="4" ry="16" fill="#E89DAB" opacity=".75"/><ellipse cx="114" cy="46" rx="4" ry="16" fill="#E89DAB" opacity=".75"/><circle cx="89" cy="76" r="3" fill="#2A1810"/><circle cx="111" cy="76" r="3" fill="#2A1810"/><ellipse cx="100" cy="88" rx="4" ry="2.8" fill="#E89DAB"/><path d="M 100 92 Q 96 96, 92 95" stroke="#2A1810" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 100 92 Q 104 96, 108 95" stroke="#2A1810" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="142" cy="135" r="9" fill="#FBF4E1"/><circle cx="142" cy="135" r="9" fill="none" stroke="#E5C04A" stroke-width="1" stroke-dasharray="2,2" opacity=".55"/><rect x="70" y="125" width="6" height="2.5" fill="#E89DAB" rx="1" transform="rotate(20 73 126)"/><rect x="115" y="118" width="6" height="2.5" fill="#9DC4E8" rx="1" transform="rotate(-30 118 119)"/><rect x="85" y="158" width="6" height="2.5" fill="#E5C04A" rx="1" transform="rotate(15 88 159)"/><rect x="105" y="150" width="6" height="2.5" fill="#B8E89D" rx="1" transform="rotate(-15 108 151)"/></svg>'
  },
  jul: {
    sku: 'julTree',
    stamp: 'Jul 2026',
    name: 'Christmas Tree',
    tagline: 'spiced gingerbread · cardamom · gold star',
    desc: "Pepparkakor's bigger sibling. Cardamom, ginger and dark muscovado, cut into a tree, iced with white-icing snow and finished with a gold-leaf star. Eaten by the fire, ideally.",
    allergens: 'wheat · milk · egg',
    bannerLabel: 'Limited release · Jul 2026',
    headline: 'A spiced gingerbread tree, for Jul.',
    detail: 'Available Dec 1 – 25. Order by Dec 23, 11am for Christmas Eve same-day Birmingham; UK next-working-day.',
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ms-tree" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2C7A48"/><stop offset="100%" stop-color="#0F4A28"/></linearGradient></defs><polygon points="100,30 70,75 130,75" fill="url(#ms-tree)"/><polygon points="100,55 60,110 140,110" fill="url(#ms-tree)"/><polygon points="100,90 50,150 150,150" fill="url(#ms-tree)"/><rect x="92" y="148" width="16" height="22" fill="#5C3818"/><polygon points="100,16 104,28 116,28 106,35 110,46 100,40 90,46 94,35 84,28 96,28" fill="#E2A93B"/><circle cx="85" cy="100" r="3" fill="#A82920"/><circle cx="115" cy="105" r="3" fill="#E2A93B"/><circle cx="100" cy="130" r="3" fill="#A82920"/><circle cx="75" cy="135" r="3" fill="#E2A93B"/><circle cx="125" cy="135" r="3" fill="#E2A93B"/><circle cx="90" cy="65" r="2.5" fill="#A82920"/><circle cx="110" cy="65" r="2.5" fill="#FBF4E1"/><path d="M 70 80 Q 100 85, 130 80" stroke="#FBF4E1" stroke-width="1.5" fill="none" opacity=".7"/><path d="M 60 115 Q 100 120, 140 115" stroke="#FBF4E1" stroke-width="1.5" fill="none" opacity=".7"/><path d="M 52 145 Q 100 150, 148 145" stroke="#FBF4E1" stroke-width="1.5" fill="none" opacity=".7"/></svg>'
  }
};

function injectSeasonalSpotlight(){
  const theme = window.MJOLK_THEME;
  const product = theme && SEASONAL_PRODUCTS[theme];
  if (!product) return;

  // Only on the homepage (the shop section). On other pages we skip.
  const shopSection = document.getElementById('shop');
  if (!shopSection) return;

  // Avoid double injection (e.g. if applied twice)
  if (document.getElementById('seasonal-spotlight')) return;

  const section = document.createElement('section');
  section.id = 'seasonal-spotlight';
  section.className = 'seasonal-spotlight';
  section.innerHTML = `
    <div class="seasonal-marker"><span class="dot"></span>${product.bannerLabel}</div>
    <div class="seasonal-grid">
      <div class="seasonal-blurb">
        <h2 class="seasonal-headline">${product.headline}</h2>
        <p class="seasonal-detail">${product.detail}</p>
      </div>
      <div class="cookie-card seasonal-card">
        <span class="stamp">${product.stamp}</span>
        <div class="cookie-art">${product.svg}</div>
        <div class="cookie-name">${product.name}</div>
        <div class="cookie-tagline">${product.tagline}</div>
        <p class="cookie-desc">${product.desc}</p>
        <div class="cookie-allergens"><strong>Allergens:</strong> ${product.allergens}</div>
        <div class="qty-row">
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQty('${product.sku}', -1)">−</button>
            <span class="qty-num" id="qty-${product.sku}">0</span>
            <button class="qty-btn" onclick="updateQty('${product.sku}', 1)">+</button>
          </div>
          <div class="cookie-price">£${product.price ? product.price.toFixed(2) : PRICES[product.sku].toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
  shopSection.parentNode.insertBefore(section, shopSection);
}

/* ───────── Init ───────── */
document.addEventListener('DOMContentLoaded', () => {
  applyThemeContent();
  injectSeasonalSpotlight();
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
