/**
 * MB MOTORS — app.js
 * Client-side application logic
 *
 * Modules:
 *   Router    — page navigation / SPA routing
 *   State     — global application state
 *   Auth      — login / registration
 *   KYC       — identity verification flow
 *   Fleet     — car card filter
 *   Checkout  — booking form + sidebar + extras
 *   GPS       — live fleet tracking simulation
 *   Calculator — earnings estimator
 *   ListCar   — vehicle listing form
 *   FadeIn    — intersection-observer scroll animations
 *   Utils     — shared helpers
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
const Utils = {
  fmtISO(date) {
    return date.toISOString().split('T')[0];
  },
  addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  },
  prettyDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[+m - 1]} ${y}`;
  },
  daysBetween(a, b) {
    return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
  },
  randRef(prefix) {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  },
  el(id) { return document.getElementById(id); },
};

/* ─────────────────────────────────────────────────────────────
   STATE  — single source of truth
───────────────────────────────────────────────────────────── */
const State = {
  user: null,   // { name, email, phone, kycDone }
  booking: {},     // active booking payload
  extras: [],     // selected add-ons array

  setUser(u) {
    this.user = u;
    Router._updateNav();
  },
  clearUser() {
    this.user = null;
    Router._updateNav();
  },
  isLoggedIn() { return !!this.user; },
  isVerified() { return this.user && this.user.kycDone; },
};

/* ─────────────────────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────────────────────── */
const Router = {
  current: 'home',

  go(pageId, anchor) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = Utils.el(`page-${pageId}`);
    if (!page) { console.warn(`Page not found: page-${pageId}`); return; }
    page.classList.add('active');
    this.current = pageId;
    window.scrollTo(0, 0);

    // per-page init
    if (pageId === 'gps') GPS.start();
    if (pageId === 'list') { Calculator.init(); }

    if (anchor) {
      setTimeout(() => {
        const el = Utils.el(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }

    FadeIn.observe();
  },

  _updateNav() {
    const loginBtn = Utils.el('nav-auth-btn');
    const drawerBtn = Utils.el('drawer-auth-btn');
    if (!loginBtn) return;
    if (State.isLoggedIn()) {
      const name = State.user.name.split(' ')[0];
      loginBtn.textContent = name;
      drawerBtn.textContent = name;
      loginBtn.onclick = () => { State.clearUser(); };
      drawerBtn.onclick = () => { closeDrawer(); State.clearUser(); };
    } else {
      loginBtn.textContent = 'Login';
      drawerBtn.textContent = 'Login';
      loginBtn.onclick = () => { Router.go('login'); return false; };
      drawerBtn.onclick = () => { closeDrawer(); Router.go('login'); };
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   HAMBURGER / DRAWER
───────────────────────────────────────────────────────────── */
function toggleDrawer() {
  const h = Utils.el('hamburger');
  const d = Utils.el('drawer');
  h.classList.toggle('open');
  d.classList.toggle('open');
  document.body.style.overflow = d.classList.contains('open') ? 'hidden' : '';
}
function closeDrawer() {
  Utils.el('hamburger').classList.remove('open');
  Utils.el('drawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   SCROLL ANIMATION
───────────────────────────────────────────────────────────── */
const FadeIn = {
  _io: new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('vis');
    });
  }, { threshold: 0.07 }),

  observe() {
    document.querySelectorAll('.fi:not(.vis)').forEach(el => this._io.observe(el));
  },
};

/* ─────────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────────── */
function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  Utils.el(`tab-${mode}`).classList.add('active');
  Utils.el('form-login').style.display = mode === 'login' ? '' : 'none';
  Utils.el('form-register').style.display = mode === 'register' ? '' : 'none';
  Utils.el('auth-title').textContent = mode === 'login' ? 'Sign in' : 'Create account';
  Utils.el('auth-sub').textContent = mode === 'login'
    ? 'Enter your credentials to continue'
    : 'Fill in the details below to get started';
  Utils.el('auth-footer').innerHTML = mode === 'login'
    ? `Don't have an account? <a href="#" onclick="switchAuthTab('register');return false;">Create one</a>`
    : `Already have an account? <a href="#" onclick="switchAuthTab('login');return false;">Sign in</a>`;
}

function togglePw(inputId, btn) {
  const inp = Utils.el(inputId);
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? 'Hide' : 'Show';
}

function doLogin() {
  const email = Utils.el('login-email').value.trim();
  const pass = Utils.el('login-pass').value;
  if (!email || !pass) { alert('Please fill in all fields.'); return; }

  // Simulate successful authentication
  State.setUser({ name: email.split('@')[0], email, kycDone: false });

  // If there's a pending booking, resume KYC flow
  if (State.booking._pendingCard) {
    alert('Login successful. Please complete identity verification to proceed with your booking.');
    Router.go('kyc');
  } else {
    Router.go('home');
  }
}

function doRegister() {
  const fn = Utils.el('reg-fn').value.trim();
  const ln = Utils.el('reg-ln').value.trim();
  const email = Utils.el('reg-email').value.trim();
  const phone = Utils.el('reg-phone').value.trim();
  const pass = Utils.el('reg-pass').value;

  if (!fn || !email || !phone || !pass) { alert('Please fill in all required fields.'); return; }
  if (pass.length < 8) { alert('Password must be at least 8 characters.'); return; }

  State.setUser({ name: `${fn} ${ln}`.trim(), email, phone, kycDone: false });

  alert(`Account created successfully.\n\nYou'll need to complete a one-time identity verification before making your first booking.`);
  Router.go('kyc');
}

function doOAuth() {
  // Simulate OAuth sign-in
  State.setUser({ name: 'User', email: 'user@gmail.com', kycDone: false });
  Router.go('kyc');
}

/* handle "Book Now" in nav — gate behind login */
function handleBookNav() {
  if (!State.isLoggedIn()) {
    Router.go('login');
  } else {
    scrollTo('fleet');
  }
}

/* ─────────────────────────────────────────────────────────────
   KYC
───────────────────────────────────────────────────────────── */
const KYC = {
  step: 0,

  setStep(n) {
    // panels
    document.querySelectorAll('.kpanel').forEach(p => p.classList.remove('active'));
    const panel = Utils.el(`kpanel-${n}`);
    if (panel) panel.classList.add('active');

    // stepper circles
    for (let i = 0; i <= 4; i++) {
      const s = Utils.el(`kstep-${i}`);
      if (!s) continue;
      s.classList.remove('active', 'done');
      if (i < n) s.classList.add('done');
      if (i === n) s.classList.add('active');
    }

    this.step = n;
    if (n === 4) this._buildSummary();
  },

  _validate(step) {
    if (step === 0) {
      if (!Utils.el('kyc-name').value.trim()) { alert('Please enter your full name.'); return false; }
      if (!Utils.el('kyc-dob').value) { alert('Please enter your date of birth.'); return false; }
    }
    if (step === 1) {
      const aadhaar = Utils.el('kyc-aadhaar').value.replace(/\s/g, '');
      const pan = Utils.el('kyc-pan').value.trim();
      if (aadhaar.length !== 12) { alert('Please enter a valid 12-digit Aadhaar number.'); return false; }
      if (pan.length !== 10) { alert('Please enter a valid 10-character PAN number.'); return false; }
    }
    if (step === 2) {
      if (!Utils.el('kyc-dl').value.trim()) { alert('Please enter your driving licence number.'); return false; }
      if (!Utils.el('kyc-dl-issue').value) { alert('Please enter the date of issue.'); return false; }
      if (!Utils.el('kyc-dl-expiry').value) { alert('Please enter the expiry date.'); return false; }
    }
    return true;
  },

  next(fromStep) {
    if (!this._validate(fromStep)) return;
    if (fromStep < 4) this.setStep(fromStep + 1);
  },

  prev(fromStep) {
    if (fromStep > 0) this.setStep(fromStep - 1);
  },

  _buildSummary() {
    const rows = [
      ['Full Name', Utils.el('kyc-name').value || '—'],
      ['Date of Birth', Utils.prettyDate(Utils.el('kyc-dob').value) || '—'],
      ['Phone Number', Utils.el('kyc-phone').value || '—'],
      ['Email Address', Utils.el('kyc-email').value || '—'],
      ['Aadhaar Number', Utils.el('kyc-aadhaar').value || '—'],
      ['PAN Number', Utils.el('kyc-pan').value || '—'],
      ['Driving Licence', Utils.el('kyc-dl').value || '—'],
      ['Licence Expiry', Utils.prettyDate(Utils.el('kyc-dl-expiry').value) || '—'],
    ];
    Utils.el('kyc-summary').innerHTML = rows.map(([l, v]) =>
      `<div class="summary-row"><span class="sl">${l}</span><span class="sv">${v}</span></div>`
    ).join('');
  },

  submit() {
    const consent = Utils.el('kyc-consent');
    if (!consent.checked) {
      alert('Please read and accept the declaration before submitting.');
      return;
    }
    if (State.user) State.user.kycDone = true;

    alert(
      'Verification submitted.\n\n' +
      'Your documents are under review. This typically takes 10–15 minutes during business hours. ' +
      'You will receive an email confirmation once approved.\n\n' +
      'For demo purposes, your account is now marked as verified.'
    );

    // If there was a pending booking, resume it
    if (State.booking._pendingCard) {
      const card = State.booking._pendingCard;
      delete State.booking._pendingCard;
      initCheckout(card);
    } else {
      Router.go('home');
    }
  },
};

// standalone wrapper functions called from HTML
function kycNext(step) { KYC.next(step); }
function kycPrev(step) { KYC.prev(step); }
function kycSubmit() { KYC.submit(); }

/* File upload helpers */
function trigUpload(fileInputId) {
  const el = Utils.el(fileInputId);
  if (el) el.click();
}

function onFileUpload(input, boxId, dotId, txtId) {
  if (!input.files || !input.files[0]) return;
  const fileName = input.files[0].name;
  const box = Utils.el(boxId);
  const dot = Utils.el(dotId);
  const txt = Utils.el(txtId);
  if (box) { box.classList.add('done'); const t = box.querySelector('.upload-title'); if (t) t.textContent = fileName; }
  if (dot) dot.classList.add('ok');
  if (txt) txt.textContent = 'Uploaded';
}

function fmtAadhaar(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 12);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

/* ─────────────────────────────────────────────────────────────
   FLEET FILTER
───────────────────────────────────────────────────────────── */
function filterFleet(btn, cat) {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.car-card').forEach(card => {
    const cats = card.dataset.cat || '';
    card.style.display = (cat === 'all' || cats.includes(cat)) ? '' : 'none';
  });
}

/* ─────────────────────────────────────────────────────────────
   CHECKOUT
───────────────────────────────────────────────────────────── */
function initCheckout(card) {
  // Gate 1 — must be logged in
  if (!State.isLoggedIn()) {
    State.booking._pendingCard = card;
    alert('Please log in or create an account before booking.');
    Router.go('login');
    return;
  }

  // Gate 2 — must have completed KYC
  if (!State.isVerified()) {
    State.booking._pendingCard = card;
    alert(
      'Identity verification required.\n\n' +
      'As per the Motor Vehicles Act, we must verify your identity before processing a vehicle rental. ' +
      'This is a one-time process. You will be redirected to the verification page now.'
    );
    Router.go('kyc');
    return;
  }

  _loadCheckout(card);
}

function _loadCheckout(card) {
  const pu = Utils.el('bb-pu').value || Utils.fmtISO(Utils.addDays(new Date(), 1));
  const rt = Utils.el('bb-rt').value || Utils.fmtISO(Utils.addDays(new Date(), 7));
  const days = Utils.daysBetween(pu, rt);

  State.booking = {
    name: card.dataset.name,
    model: card.dataset.model,
    price: parseInt(card.dataset.price, 10),
    hp: card.dataset.hp,
    trans: card.dataset.trans,
    img: card.dataset.img,
    pickup: pu,
    ret: rt,
    days,
    location: Utils.el('bb-loc').value,
  };
  State.extras = [];

  // reset extras UI
  document.querySelectorAll('.extra').forEach(e => e.classList.remove('on'));

  // pre-fill checkout form fields
  Utils.el('co-pu').value = pu;
  Utils.el('co-rt').value = rt;
  Utils.el('co-loc').value = State.booking.location;

  // populate sidebar static fields
  Utils.el('sb-img').src = State.booking.img;
  Utils.el('sb-name').textContent = State.booking.name;
  Utils.el('sb-model').textContent = State.booking.model;
  Utils.el('sb-pu').textContent = Utils.prettyDate(pu);
  Utils.el('sb-rt').textContent = Utils.prettyDate(rt);
  Utils.el('sb-dur').textContent = `${days} day${days > 1 ? 's' : ''}`;
  Utils.el('sb-loc').textContent = State.booking.location;

  _updateSidebar();
  Router.go('checkout');
}

function _updateSidebar() {
  const b = State.booking;
  const baseTotal = b.price * b.days;
  const extTotal = State.extras.reduce((s, e) => s + e.price * b.days, 0);

  Utils.el('sb-rate-lbl').textContent = `₹${b.price.toLocaleString('en-IN')} × ${b.days} day${b.days > 1 ? 's' : ''}`;
  Utils.el('sb-base').textContent = `₹${baseTotal.toLocaleString('en-IN')}`;
  Utils.el('sb-extras-list').innerHTML = State.extras.map(e =>
    `<div class="sb-extra-item"><span>${e.label}</span><span>+₹${(e.price * b.days).toLocaleString('en-IN')}</span></div>`
  ).join('');
  Utils.el('sb-total').textContent = (baseTotal + extTotal).toLocaleString('en-IN');
}

function toggleExtra(el) {
  el.classList.toggle('on');
  const label = el.dataset.label;
  const price = parseInt(el.dataset.price, 10);

  if (el.classList.contains('on')) {
    State.extras.push({ label, price });
  } else {
    State.extras = State.extras.filter(e => e.label !== label);
  }
  _updateSidebar();
}

function switchPay(btn, type) {
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  Utils.el('pay-card').style.display = type === 'card' ? '' : 'none';
  Utils.el('pay-upi').style.display = type === 'upi' ? '' : 'none';
}

function selectUpi(el, app) {
  document.querySelectorAll('.upi-app').forEach(u => u.classList.remove('active'));
  el.classList.add('active');
  const placeholders = { gpay: 'yourname@okicici', phonepe: 'yourname@ybl', paytm: 'yourname@paytm', other: '' };
  const upiInput = Utils.el('upi-id');
  if (upiInput) upiInput.placeholder = placeholders[app] || 'yourname@upi';
}

function fmtCard(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 16);
  el.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function confirmBooking() {
  const fn = Utils.el('fn').value.trim() || 'Guest';
  const ln = Utils.el('ln').value.trim() || '';
  const em = Utils.el('em').value.trim() || '—';
  const ph = Utils.el('ph').value.trim() || '—';
  const lic = Utils.el('lic').value.trim() || '—';
  const drop = Utils.el('co-drop').value;

  const b = State.booking;
  const extTotal = State.extras.reduce((s, e) => s + e.price * b.days, 0);
  const total = b.price * b.days + extTotal;

  // Populate confirmation page
  Utils.el('o-id').textContent = Utils.randRef('MB');
  Utils.el('o-img').src = b.img || '';
  Utils.el('o-name').textContent = b.name || '—';
  Utils.el('o-model').textContent = b.model || '—';
  Utils.el('o-hp').textContent = b.hp || '—';
  Utils.el('o-trans').textContent = b.trans || '—';
  Utils.el('o-total').textContent = total.toLocaleString('en-IN');
  Utils.el('o-pu').textContent = Utils.prettyDate(b.pickup);
  Utils.el('o-rt').textContent = Utils.prettyDate(b.ret);
  Utils.el('o-dur').textContent = `${b.days} day${b.days > 1 ? 's' : ''}`;
  Utils.el('o-loc').textContent = b.location || '—';
  Utils.el('o-drop').textContent = drop === 'Same as Pick-up' ? b.location : drop;
  Utils.el('o-dname').textContent = `${fn} ${ln}`.trim();
  Utils.el('o-email').textContent = em;
  Utils.el('o-phone').textContent = ph;
  Utils.el('o-lic').textContent = lic;

  const extrasCard = Utils.el('o-extras-card');
  const extrasRows = Utils.el('o-extras-rows');
  if (State.extras.length) {
    extrasCard.style.display = '';
    extrasRows.innerHTML = State.extras.map(e =>
      `<div class="orow"><span>${e.label}</span><span>₹${(e.price * b.days).toLocaleString('en-IN')}</span></div>`
    ).join('');
  } else {
    extrasCard.style.display = 'none';
  }

  Router.go('order');
}

/* ─────────────────────────────────────────────────────────────
   GPS TRACKING (simulation)
───────────────────────────────────────────────────────────── */
const GPS = {
  vehicles: [
    { name: 'Porsche 718', x: 50, y: 48, status: 'moving', speed: 48, dist: 18.4, time: 34, fuel: 72 },
    { name: 'Mercedes AMG', x: 43, y: 55, status: 'parked', speed: 0, dist: 6.2, time: 12, fuel: 85 },
    { name: 'BMW M3', x: 68, y: 30, status: 'idle', speed: 0, dist: 11.0, time: 28, fuel: 61 },
    { name: 'Lamborghini', x: 25, y: 65, status: 'moving', speed: 62, dist: 22.1, time: 38, fuel: 55 },
    { name: 'Tesla Model Y', x: 14, y: 70, status: 'parked', speed: 0, dist: 0, time: 0, fuel: 90 },
    { name: 'Audi A8 L', x: 80, y: 72, status: 'idle', speed: 0, dist: 14.5, time: 45, fuel: 78 },
  ],
  activeIdx: 0,
  _interval: null,

  focus(el, idx) {
    document.querySelectorAll('.veh-item').forEach(v => v.classList.remove('active'));
    el.classList.add('active');
    this.activeIdx = idx;
    const v = this.vehicles[idx];
    Utils.el('mapTitle').textContent = `${v.name} — ${v.status.charAt(0).toUpperCase()}${v.status.slice(1)}`;
    Utils.el('carLabel').textContent = v.name;
    const marker = Utils.el('carMarker');
    marker.style.left = `${v.x}%`;
    marker.style.top = `${v.y}%`;
    Utils.el('ms-speed').textContent = v.speed;
    Utils.el('ms-dist').textContent = v.dist.toFixed(1);
    Utils.el('ms-time').textContent = v.time;
    Utils.el('ms-fuel').textContent = Math.round(v.fuel);
  },

  start() {
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => {
      const v = this.vehicles[this.activeIdx];
      if (v.status !== 'moving') return;

      v.x = Math.min(90, Math.max(10, v.x + (Math.random() - 0.42) * 2.4));
      v.y = Math.min(88, Math.max(8, v.y + (Math.random() - 0.5) * 2.0));
      v.speed = Math.round(35 + Math.random() * 45);
      v.dist = parseFloat((v.dist + Math.random() * 0.4).toFixed(1));
      v.time += 1;
      v.fuel = Math.max(5, v.fuel - 0.05);

      const marker = Utils.el('carMarker');
      if (marker) {
        marker.style.left = `${v.x}%`;
        marker.style.top = `${v.y}%`;
      }
      Utils.el('ms-speed').textContent = v.speed;
      Utils.el('ms-dist').textContent = v.dist.toFixed(1);
      Utils.el('ms-time').textContent = v.time;
      Utils.el('ms-fuel').textContent = Math.round(v.fuel);
    }, 2000);
  },
};

// HTML-callable wrappers
function focusVehicle(el, idx) { GPS.focus(el, idx); }

/* ─────────────────────────────────────────────────────────────
   EARNINGS CALCULATOR
───────────────────────────────────────────────────────────── */
const Calculator = {
  init() {
    const lf = Utils.el('list-from');
    if (lf && !lf.value) lf.value = Utils.fmtISO(Utils.addDays(new Date(), 1));
    this.run();
  },
  run() {
    const days = parseInt(Utils.el('calc-days').value, 10);
    const rate = parseInt(Utils.el('calc-cat').value, 10);
    const mult = parseFloat(Utils.el('calc-city').value);
    Utils.el('calc-days-val').textContent = days;
    const net = Math.round(days * rate * 0.75 * mult * 0.8);
    Utils.el('calc-result').textContent = net.toLocaleString('en-IN');
    Utils.el('calc-note').textContent =
      `${days} days × ₹${rate.toLocaleString('en-IN')}/day · 75% occupancy · 80% net after platform fee`;
  },
};

function runCalc() { Calculator.run(); }

/* ─────────────────────────────────────────────────────────────
   LIST CAR — FORM SUBMIT
───────────────────────────────────────────────────────────── */
function submitListing() {
  alert(
    `Submission received.\n\nReference: ${Utils.randRef('MB-LIST')}\n\n` +
    `Our team will contact you within 24 hours to schedule a vehicle inspection at your location.`
  );
}

/* ─────────────────────────────────────────────────────────────
   SCROLL TO (in-page anchors)
───────────────────────────────────────────────────────────── */
function scrollTo(id) {
  const el = Utils.el(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ─────────────────────────────────────────────────────────────
   INIT — runs on page load
───────────────────────────────────────────────────────────── */
(function init() {
  // Set default booking bar dates
  const t1 = Utils.addDays(new Date(), 1);
  const t7 = Utils.addDays(new Date(), 7);
  Utils.el('bb-pu').value = Utils.fmtISO(t1);
  Utils.el('bb-rt').value = Utils.fmtISO(t7);

  // Kick off scroll animations
  FadeIn.observe();

  // Expose Utils.prettyDate globally for KYC summary builder
  Utils.prettyDate = Utils.prettyDate.bind(Utils);
})();
