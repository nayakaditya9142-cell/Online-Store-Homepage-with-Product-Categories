import products from './data.js';

// app state
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

// grab elements once at start
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
    filterToggle: document.querySelector('.btn-filter-toggle'),
    sidebarFilters: document.querySelector('.sidebar-filters'),
    closeFilters: document.getElementById('close-filters'),
    menuOverlay: document.getElementById('menu-overlay'),
    sideMenu: document.getElementById('side-menu'),
    closeMenu: document.getElementById('close-menu'),
    cartOverlay: document.getElementById('cart-overlay'),
    cartDrawer: document.getElementById('cart-drawer'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal')
};

const formatINR = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const getStars = r => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));

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
                <button class="btn-primary" id="empty-return-btn">Return Home</button>
            </div>
        `;
        document.getElementById('empty-return-btn').addEventListener('click', showHome);
    }
    if (window.lucide) lucide.createIcons();
    window.scrollTo(0, 0);
}

function showProductDetail(id) {
    const product = state.allProducts.find(p => p.id === parseInt(id));
    if (!product) return;
    hideAllSections();
    if (els.productDetailSection) els.productDetailSection.style.display = 'block';

    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setSrc = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };

    setSrc('detail-main-img', product.image);
    setInner('detail-title', product.name);
    
    const displayPrice = formatINR(product.price);
    setInner('detail-price', displayPrice);
    setInner('detail-buy-price', displayPrice);

    const mrp = Math.floor(product.price * 1.25);
    setInner('detail-mrp', formatINR(mrp));

    setInner('detail-stars', getStars(product.rating));
    setInner('detail-reviews', `${product.reviews.toLocaleString()} ratings`);

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

    const detailAddBtn = document.querySelector('.detail-add-cart');
    if (detailAddBtn) {
        detailAddBtn.onclick = (e) => {
            e.preventDefault();
            addToCart(product.id);
        };
    }
    
    window.scrollTo(0, 0);
}

function updateBrandFilters(products) {
    const list = document.getElementById('brand-filter-list');
    if (!list || !products) return;

    const brands = [...new Set(products.map(p => p.name.split(' ')[0]))].sort();

    if (brands.length === 0) {
        list.innerHTML = '<li class="empty-filter">No brands found</li>';
        return;
    }

    list.innerHTML = brands.map(brand => {
        const val = brand.toLowerCase();
        const isChecked = state.activeFilters.brands.includes(val);
        return `
            <li>
                <input type="checkbox" class="brand-filter" value="${val}" ${isChecked ? 'checked' : ''}>
                <span>${brand}</span>
            </li>
        `;
    }).join('');

    list.querySelectorAll('.brand-filter').forEach(chk => {
        chk.addEventListener('change', () => {
            const checked = Array.from(list.querySelectorAll('.brand-filter:checked')).map(c => c.value);
            state.activeFilters.brands = checked;
            applyFilters();
        });
    });
}

function addToCart(productId) {
    const product = state.allProducts.find(p => p.id === parseInt(productId));
    if (!product) return;
    
    state.cart.push(product);
    localStorage.setItem('wishlist_cart', JSON.stringify(state.cart));
    updateCartUI();
    openCart();
}

function updateCartUI() {
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
    state.activeFilters = { rating: 0, brands: [], price: { min: 0, max: Infinity } };
    applyFilters();
}

function showCategory(cat) {
    els.searchCat.value = cat;
    els.searchInput.value = '';
    state.currentCategory = cat;
    state.currentSearch = '';
    state.activeFilters = { rating: 0, brands: [], price: { min: 0, max: Infinity } };
    applyFilters();
}

function applyFilters() {
    const term = state.currentSearch.toLowerCase();
    const cat = els.searchCat.value;
    const sortVal = document.getElementById('sort-results')?.value || 'relevance';
    
    let results = state.allProducts.filter(p => {
        const matchesTerm = !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || (p.subCategory && p.subCategory.toLowerCase().includes(term));
        const matchesCat = cat === 'all' || p.category === cat;
        return matchesTerm && matchesCat;
    });

    updateBrandFilters(results);

    if (state.activeFilters.rating > 0) {
        results = results.filter(p => p.rating >= state.activeFilters.rating);
    }
    
    if (state.activeFilters.brands.length > 0) {
        results = results.filter(p => state.activeFilters.brands.includes(p.name.toLowerCase().split(' ')[0]));
    }
    
    if (state.activeFilters.price.max !== Infinity || state.activeFilters.price.min > 0) {
        results = results.filter(p => p.price >= state.activeFilters.price.min && p.price <= state.activeFilters.price.max);
    }

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
    if (els.searchForm) els.searchForm.addEventListener('submit', handleSearch);
    if (els.backToHome) els.backToHome.onclick = () => showHome();
    if (els.backToResults) els.backToResults.onclick = () => renderSearchResults();

    // Deal Links & Promo Cards
    const seeAllBtn = document.getElementById('see-all-deals');
    if (seeAllBtn) seeAllBtn.addEventListener('click', (e) => { e.preventDefault(); showCategory('all'); });
    
    document.querySelectorAll('.card-link').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); showCategory('all'); });
    });
    
    // Delivery Location Picker
    const locPicker = document.getElementById('location-picker');
    const locLabel = document.querySelector('.loc-label');
    const savedLocation = localStorage.getItem('user_location');
    
    if (savedLocation && locLabel) {
        locLabel.innerText = `Delivering to ${savedLocation}`;
    }

    if (locPicker) {
        locPicker.addEventListener('click', () => {
            const currentLoc = savedLocation || "Mumbai 400001";
            const newLocation = prompt("Please enter your delivery Pincode or City:", currentLoc);
            if (newLocation && newLocation.trim() !== "") {
                const formattedLocation = newLocation.trim();
                localStorage.setItem('user_location', formattedLocation);
                if (locLabel) locLabel.innerText = `Delivering to ${formattedLocation}`;
            }
        });
    }

    // Side Menu & Cart Close
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-cart' || e.target.closest('#close-cart') || e.target.id === 'cart-overlay') {
            closeCart();
        }
        
        const catLink = e.target.closest('[data-category]');
        if (catLink) { e.preventDefault(); showCategory(catLink.dataset.category); }
        
        if (e.target.id === 'side-menu-toggle' || e.target.closest('#side-menu-toggle') || 
            e.target.id === 'side-menu-toggle-text' || e.target.closest('#side-menu-toggle-text')) {
            els.sideMenu.classList.toggle('active');
            els.menuOverlay.classList.toggle('active');
        }
        if (e.target.id === 'close-menu' || e.target.closest('#close-menu') || e.target.id === 'menu-overlay') {
            els.sideMenu.classList.remove('active');
            els.menuOverlay.classList.remove('active');
        }

        const sideCatLink = e.target.closest('.menu-section a');
        if (sideCatLink) {
            e.preventDefault();
            const catName = sideCatLink.innerText.toLowerCase();
            if (catName.includes('mobile')) showCategory('mobiles');
            else if (catName.includes('electronics')) showCategory('electronics');
            else if (catName.includes('fashion')) showCategory('fashion');
            else if (catName.includes('fresh')) showCategory('fresh');
            else showCategory('all');
            
            els.sideMenu.classList.remove('active');
            els.menuOverlay.classList.remove('active');
        }

        const langTrigger = e.target.closest('#lang-trigger');
        const accountTrigger = e.target.closest('#account-trigger');
        const dropdownItem = e.target.closest('.dropdown-item');
        const accountLink = e.target.closest('.account-dropdown a');
        
        if (langTrigger && !dropdownItem) {
            langTrigger.querySelector('.header-dropdown').classList.toggle('active-mobile');
        } else if (dropdownItem) {
            const code = dropdownItem.innerText.split(' - ')[1];
            if (code) {
                const langSpan = document.querySelector('.lang-code');
                if (langSpan) langSpan.innerText = code;
            }
            document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('active-mobile'));
        } else {
            document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('active-mobile'));
        }

        const closeAccountBtn = e.target.closest('#close-account-btn');
        if (closeAccountBtn) {
            e.stopPropagation();
            const trigger = closeAccountBtn.closest('.dropdown-trigger');
            if (trigger) {
                const dropdown = trigger.querySelector('.header-dropdown');
                if (dropdown) dropdown.classList.remove('active-mobile');
                
                // For PC, hack to hide the pure css hover state
                trigger.classList.add('force-hide');
                trigger.addEventListener('mouseleave', () => trigger.classList.remove('force-hide'), {once: true});
            }
            return;
        }

        if (accountTrigger && !accountLink && !closeAccountBtn) {
            accountTrigger.querySelector('.header-dropdown').classList.toggle('active-mobile');
        } else if (accountLink) {
            document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('active-mobile'));
            if (accountLink.innerText.includes('Orders')) {
                els.searchInput.value = '';
                state.searchResults = [];
                renderSearchResults();
                els.searchTitle.innerText = '"Your Orders (Simulation)"';
            }
        } else {
            document.querySelectorAll('.account-dropdown').forEach(d => d.classList.remove('active-mobile'));
        }

        if (e.target.closest('.btn-filter-toggle')) {
            els.sidebarFilters.classList.add('active');
            els.menuOverlay.classList.add('active');
        }
        
        if (e.target.id === 'close-filters' || e.target.closest('#close-filters') || (e.target.id === 'menu-overlay' && els.sidebarFilters.classList.contains('active'))) {
            els.sidebarFilters.classList.remove('active');
            els.menuOverlay.classList.remove('active');
        }

        if (e.target.id === 'cart-nav' || e.target.closest('#cart-nav')) {
            e.preventDefault();
            openCart();
        }

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
                const text = item.querySelector('span').innerText.trim().toLowerCase();
                
                // Map specific grid labels directly to categories
                const categoryMap = {
                    'mobiles': 'mobiles',
                    'phones': 'mobiles',
                    'electronics': 'electronics',
                    'fashion': 'fashion',
                    'fresh': 'fresh',
                    'home': 'home'
                };

                if (categoryMap[text]) {
                    showCategory(categoryMap[text]);
                } else {
                    els.searchInput.value = item.querySelector('span').innerText.trim();
                    if (els.searchCat) els.searchCat.value = 'all';
                    handleSearch();
                }
            }
        });
    });

    // Sidebar Refinement Listeners (Using robust delegation)
    const sidebar = document.querySelector('.sidebar-filters');
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            const ratingLi = e.target.closest('[data-rating]');
            if (ratingLi) {
                state.activeFilters.rating = parseFloat(ratingLi.dataset.rating);
                sidebar.querySelectorAll('[data-rating]').forEach(el => el.classList.remove('active-filter'));
                ratingLi.classList.add('active-filter');
                applyFilters();
            }

            const priceLi = e.target.closest('[data-price-min], [data-price-max]');
            if (priceLi) {
                state.activeFilters.price.min = parseFloat(priceLi.dataset.priceMin || 0);
                state.activeFilters.price.max = parseFloat(priceLi.dataset.priceMax || Infinity);
                sidebar.querySelectorAll('[data-price-min]').forEach(el => el.classList.remove('active-filter'));
                priceLi.classList.add('active-filter');
                applyFilters();
            }
        });
    }


    // Floating Controls
    const rv = document.getElementById('refresh-view');
    if (rv) {
        rv.addEventListener('click', () => {
            if (els.searchInput) els.searchInput.value = '';
            if (els.searchCat) els.searchCat.value = 'all';
            showHome();
        });
    }

    // Sorting event
    const sortSel = document.getElementById('sort-results');
    if (sortSel) sortSel.addEventListener('change', () => applyFilters());

    // Proceed to Buy Button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                alert('Your cart is empty! Please add some products to buy.');
                return;
            }
            const total = els.cartSubtotal ? els.cartSubtotal.innerText : '₹0.00';
            alert(`Proceeding to secure checkout...\n\nTotal Items: ${state.cart.length}\nAmount to Pay: ${total}`);
            
            // Clear cart logic after perceived checkout
            state.cart = [];
            localStorage.setItem('wishlist_cart', JSON.stringify([]));
            updateCartUI();
            closeCart();
        });
    }
    
    // Detailed view "Buy Now" button
    const detailBuyBtn = document.querySelector('.btn-buy');
    if (detailBuyBtn) {
        detailBuyBtn.addEventListener('click', () => {
            alert('Proceeding directly to secure checkout for this item!');
        });
    }
}

function init() {
    bindEvents();
    updateCartUI(); 
    // Populate shelves
    els.dealsShelf.innerHTML = '';
    state.allProducts.slice(0, 8).forEach(p => els.dealsShelf.appendChild(createShelfItem(p)));
    els.electronicsShelf.innerHTML = '';
    state.allProducts.filter(p => p.category === 'electronics').slice(0, 8).forEach(p => els.electronicsShelf.appendChild(createShelfItem(p)));
    if (window.lucide) lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', init);
