/**
 * Wishllist karo.com - Amazon Clone Logic
 * Professional-grade search, cart, and view management
 */
import products from './data.js';

// --- Application State ---
const state = {
    allProducts: [...products],
    cart: JSON.parse(localStorage.getItem('wishlist_cart')) || [],
    searchResults: [],
    isMenuOpen: false,
    isCartOpen: false,
    currentSearch: '',
    currentCategory: 'all',
    currentSlide: 0,
    activeFilters: {
        rating: 0,
        brands: [],
        price: { min: 0, max: Infinity }
    }
};

// --- DOM Elements ---
const els = {
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('searchInput'),
    searchCat: document.getElementById('search-cat-dropdown'),
    cartCount: document.querySelector('.cart-count'),
    cartBtn: document.getElementById('cart-nav'),
    menuToggle: document.getElementById('side-menu-toggle'),
    pageContent: document.querySelector('.page-content'),
    hero: document.getElementById('hero-slider'),
    dealsShelf: document.getElementById('deals-shelf'),
    electronicsShelf: document.getElementById('electronics-shelf'),
    searchResultsSection: document.getElementById('search-results'),
    searchTitle: document.getElementById('search-title'),
    backToHome: document.getElementById('back-to-home'),
    searchGrid: document.getElementById('search-grid'),
    sortSelect: document.getElementById('sort-results'),
    productDetailSection: document.getElementById('product-detail'),
    backToResults: document.querySelector('.back-to-results'),
    menuOverlay: document.getElementById('menu-overlay'),
    sideMenu: document.getElementById('side-menu'),
    closeMenu: document.getElementById('close-menu'),
    cartOverlay: document.getElementById('cart-overlay'),
    cartDrawer: document.getElementById('cart-drawer'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal')
};

// --- Utility ---
const formatINR = (num) => '₹' + new Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const getStars = (r) => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));

// --- View Transitions ---
function hideAllSections() {
    [els.hero, els.searchResultsSection, els.productDetailSection].forEach(s => { if(s) s.style.display = 'none'; });
    document.querySelectorAll('.shelf-container').forEach(s => s.style.display = 'none');
}

function showHome() {
    hideAllSections();
    if (els.hero) els.hero.style.display = 'block';
    document.querySelectorAll('.shelf-container').forEach(s => s.style.display = 'block');
    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderSearchResults() {
    hideAllSections();
    els.searchResultsSection.style.display = 'block';
    
    const count = state.searchResults.length;
    const term = state.currentSearch || state.currentCategory || 'items';
    const resultText = count > 0 ? `1-${count} of over ${count * 30 + 120}` : '0';
    document.getElementById('results-count-text').innerText = `${resultText} results for`;
    els.searchTitle.innerText = `"${term}"`;

    els.searchGrid.innerHTML = '';
    if (count > 0) {
        state.searchResults.forEach(p => els.searchGrid.appendChild(createProductCard(p)));
    } else {
        els.searchGrid.innerHTML = `
            <div class="empty-results">
                <h3>No results found.</h3>
                <p>Try checking your spelling or use more general terms.</p>
                <button class="btn-amazon-primary" onclick="showHome()">Return Home</button>
            </div>
        `;
    }
    if (window.lucide) lucide.createIcons();
    window.scrollTo(0, 0);
}

function showProductDetail(id) {
    const product = state.allProducts.find(p => p.id === parseInt(id));
    if (!product) return;
    hideAllSections();
    if (els.productDetailSection) els.productDetailSection.style.display = 'block';
    
    // Robust Populate
    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setSrc = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };

    setSrc('detail-main-img', product.image);
    setInner('detail-title', product.name);
    
    const displayPrice = formatINR(product.price);
    setInner('detail-price', displayPrice);
    setInner('detail-buy-price', displayPrice);
    
    // MRP Calculation
    const mrp = Math.floor(product.price * 1.25);
    setInner('detail-mrp', formatINR(mrp));
    
    // Stars & Reviews
    setInner('detail-stars', getStars(product.rating));
    setInner('detail-reviews', `${product.reviews.toLocaleString()} ratings`);

    // Features
    const featureList = document.getElementById('detail-features');
    if (featureList) {
        featureList.innerHTML = `
            <li>Brand: ${product.name.split(' ')[0]}</li>
            <li>Category: ${product.category}</li>
            <li>Description: ${product.description}</li>
            <li>Premium quality materials with professional finish</li>
            <li>Engineered for high-performance and durability</li>
        `;
    }

    // Add to Cart Logic
    const detailAddBtn = document.querySelector('.detail-add-cart');
    if (detailAddBtn) {
        detailAddBtn.onclick = (e) => {
            e.preventDefault();
            addToCart(product.id);
        };
    }
    
    window.scrollTo(0, 0);
}

// --- Cart Functions ---
function addToCart(productId) {
    const product = state.allProducts.find(p => p.id === parseInt(productId));
    if (!product) return;
    
    state.cart.push(product);
    localStorage.setItem('wishlist_cart', JSON.stringify(state.cart));
    updateCartUI();
    openCart();
}

function updateCartUI() {
    // Header Count
    if (els.cartCount) els.cartCount.innerText = state.cart.length;
    
    // Drawer Content
    if (!els.cartItems) return;
    els.cartItems.innerHTML = '';
    let subtotal = 0;
    
    state.cart.forEach((item, index) => {
        subtotal += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${formatINR(item.price)}</div>
                <button class="remove-item" onclick="removeFromCart(${index})">Delete</button>
            </div>
        `;
        els.cartItems.appendChild(div);
    });
    
    if (els.cartSubtotal) els.cartSubtotal.innerText = formatINR(subtotal);
}

window.removeFromCart = (index) => {
    state.cart.splice(index, 1);
    localStorage.setItem('wishlist_cart', JSON.stringify(state.cart));
    updateCartUI();
};

function openCart() {
    if (els.cartDrawer) {
        els.cartDrawer.classList.add('active');
        els.cartOverlay.classList.add('active');
    }
}

function closeCart() {
    if (els.cartDrawer) {
        els.cartDrawer.classList.remove('active');
        els.cartOverlay.classList.remove('active');
    }
}

// --- Component Builders ---
function createShelfItem(product) {
    const div = document.createElement('div');
    div.className = 'shelf-item';
    div.dataset.id = product.id;
    div.innerHTML = `
        <div class="item-img-container"><img src="${product.image}" alt="${product.name}"></div>
        <div class="item-info">
            <h4 class="item-title">${product.name}</h4>
            <div class="item-price">${formatINR(product.price)}</div>
        </div>
    `;
    div.onclick = () => showProductDetail(product.id);
    return div;
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    const delivery = new Date(); delivery.setDate(delivery.getDate() + 2);
    const dateStr = delivery.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    
    div.innerHTML = `
        <div class="card-img-wrap"><img src="${product.image}" loading="lazy"></div>
        <div class="card-info">
            ${product.badge ? `<div class="card-badge">${product.badge}</div>` : ''}
            <h4 class="card-title">${product.name}</h4>
            <div class="card-rating">${getStars(product.rating)} <span>${product.reviews.toLocaleString()}</span></div>
            <div class="card-price-row"><span class="card-price"><span class="card-price-symbol">₹</span>${product.price.toLocaleString('en-IN')}</span></div>
            <div class="card-delivery">FREE delivery <b>${dateStr}</b></div>
            <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    div.onclick = (e) => {
        if (!e.target.classList.contains('add-to-cart-btn')) showProductDetail(product.id);
    };
    return div;
}

// --- Events ---
function handleSearch(e) {
    if (e) e.preventDefault();
    state.currentSearch = els.searchInput.value.trim();
    state.activeFilters = { rating: 0, brands: [], price: { min: 0, max: Infinity } }; // Reset sidebar on new search
    applyFilters();
}

function showCategory(cat) {
    els.searchCat.value = cat;
    els.searchInput.value = '';
    state.currentCategory = cat;
    state.currentSearch = '';
    state.activeFilters = { rating: 0, brands: [], price: { min: 0, max: Infinity } }; // Reset sidebar on change
    
    applyFilters();
}

/**
 * The Central Filtering Hub
 */
function applyFilters() {
    const term = state.currentSearch.toLowerCase();
    const cat = els.searchCat.value;
    const sortVal = document.getElementById('sort-results')?.value || 'relevance';
    
    let results = state.allProducts.filter(p => {
        const matchesTerm = !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
        const matchesCat = cat === 'all' || p.category === cat;
        return matchesTerm && matchesCat;
    });

    // Apply Sidebar Refinements
    if (state.activeFilters.rating > 0) {
        results = results.filter(p => p.rating >= state.activeFilters.rating);
    }
    
    if (state.activeFilters.brands.length > 0) {
        results = results.filter(p => state.activeFilters.brands.includes(p.name.toLowerCase().split(' ')[0]));
    }
    
    if (state.activeFilters.price.max !== Infinity || state.activeFilters.price.min > 0) {
        results = results.filter(p => p.price >= state.activeFilters.price.min && p.price <= state.activeFilters.price.max);
    }

    // Sort Logic
    if (sortVal === 'price-low') {
        results.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        results.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
        results.sort((a, b) => b.rating - a.rating);
    }

    state.searchResults = results;
    renderSearchResults();
}

function bindEvents() {
    els.searchForm.addEventListener('submit', handleSearch);
    els.backToHome.onclick = () => showHome();
    els.backToResults.onclick = () => renderSearchResults();
    
    // Side Menu & Cart Close
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-cart' || e.target.closest('#close-cart') || e.target.id === 'cart-overlay') {
            closeCart();
        }
        
        const catLink = e.target.closest('[data-category]');
        if (catLink) { e.preventDefault(); showCategory(catLink.dataset.category); }
        
        if (e.target.id === 'side-menu-toggle' || e.target.closest('#side-menu-toggle')) {
            els.sideMenu.classList.toggle('active');
            els.menuOverlay.classList.toggle('active');
        }
        if (e.target.id === 'close-menu' || e.target.closest('#close-menu') || e.target.id === 'menu-overlay') {
            els.sideMenu.classList.remove('active');
            els.menuOverlay.classList.remove('active');
        }

        // Sidebar Category Links
        const sideCatLink = e.target.closest('.menu-section a');
        if (sideCatLink) {
            e.preventDefault();
            const catName = sideCatLink.innerText.toLowerCase();
            if (catName.includes('mobile')) showCategory('mobiles');
            else if (catName.includes('electronics')) showCategory('electronics');
            else if (catName.includes('fashion')) showCategory('fashion');
            else showCategory('all');
            
            els.sideMenu.classList.remove('active');
            els.menuOverlay.classList.remove('active');
        }

        // Header Dropdowns (Mobile/Touch Support)
        const langTrigger = e.target.closest('#lang-trigger');
        const accountTrigger = e.target.closest('#account-trigger');
        const dropdownItem = e.target.closest('.dropdown-item');
        const accountLink = e.target.closest('.account-dropdown a');
        
        if (langTrigger && !dropdownItem) {
            langTrigger.querySelector('.header-dropdown').classList.toggle('active-mobile');
        } else if (dropdownItem) {
            // Update Language
            const code = dropdownItem.innerText.split(' - ')[1];
            if (code) {
                const langSpan = document.querySelector('.lang-code');
                if (langSpan) langSpan.innerText = code;
            }
            document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('active-mobile'));
        } else {
            document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('active-mobile'));
        }

        if (accountTrigger && !accountLink) {
            accountTrigger.querySelector('.header-dropdown').classList.toggle('active-mobile');
        } else if (accountLink) {
            // Close on link click
            document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('active-mobile'));
            if (accountLink.innerText.includes('Orders')) {
                els.searchInput.value = '';
                state.searchResults = []; // Simulation
                renderSearchResults();
                els.searchTitle.innerText = '"Your Orders (Simulation)"';
            }
        } else {
            document.querySelectorAll('.account-dropdown').forEach(d => d.classList.remove('active-mobile'));
        }

        // Add to Cart
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            addToCart(addBtn.dataset.id);
        }
    });

    // Home Grid Cards
    document.querySelectorAll('.grid-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const item = e.target.closest('.item');
            if (item) {
                els.searchInput.value = item.querySelector('span').innerText;
                handleSearch();
            }
        });
    });

    // Sidebar Refinement Listeners
    document.querySelectorAll('[data-rating]').forEach(li => {
        li.addEventListener('click', () => {
            state.activeFilters.rating = parseFloat(li.dataset.rating);
            applyFilters();
        });
    });

    document.querySelectorAll('.brand-filter').forEach(chk => {
        chk.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('.brand-filter:checked')).map(c => c.value);
            state.activeFilters.brands = checked;
            applyFilters();
        });
    });

    document.querySelectorAll('[data-price-min], [data-price-max]').forEach(li => {
        li.addEventListener('click', () => {
            state.activeFilters.price.min = parseFloat(li.dataset.priceMin || 0);
            state.activeFilters.price.max = parseFloat(li.dataset.priceMax || Infinity);
            applyFilters();
        });
    });

    // Floating Controls
    const st = document.getElementById('scroll-top');
    const sb = document.getElementById('scroll-bottom');
    const rv = document.getElementById('refresh-view');

    if (st) st.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    if (sb) sb.onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    if (rv) rv.onclick = () => {
        els.searchInput.value = '';
        els.searchCat.value = 'all';
        showHome();
    };

    // Sorting event
    const sortSel = document.getElementById('sort-results');
    if (sortSel) sortSel.addEventListener('change', () => applyFilters());
}

function init() {
    bindEvents();
    updateCartUI(); // Load persisted cart
    // Populate shelves
    els.dealsShelf.innerHTML = '';
    state.allProducts.slice(0, 8).forEach(p => els.dealsShelf.appendChild(createShelfItem(p)));
    els.electronicsShelf.innerHTML = '';
    state.allProducts.filter(p => p.category === 'electronics').slice(0, 8).forEach(p => els.electronicsShelf.appendChild(createShelfItem(p)));
    if (window.lucide) lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', init);
