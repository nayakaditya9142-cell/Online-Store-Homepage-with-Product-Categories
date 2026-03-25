// -- Online Store Logic --
// Using ES Modules to bring in the product data
import products from './data.js';

// App state - keeping it simple
const state = {
    products: [...products],
    filtered: [...products],
    cartCount: 0,
    filters: {
        category: 'all',
        maxPrice: 150000, // Adjusted for INR
        search: '',
        sortBy: 'featured'
    }
};

// UI Elements
const els = {
    grid: document.getElementById('productGrid'),
    count: document.getElementById('productCount'),
    title: document.getElementById('currentCategoryTitle'),
    priceInput: document.getElementById('priceRange'),
    priceLabel: document.getElementById('priceValue'),
    sort: document.getElementById('sortSelect'),
    search: document.getElementById('searchInput'),
    cartBadge: document.querySelector('.cart-count'),
    tabs: document.querySelectorAll('.cat-tab')
};

// Helper: Format price to Indian style
const formatINR = (num) => {
    return '₹' + new Number(num).toLocaleString('en-IN');
};

// Main render function
function render() {
    els.grid.innerHTML = '';
    
    if (state.filtered.length === 0) {
        els.grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h3>No luck! No products found.</h3>
                <p>Try changing your filters or search term.</p>
            </div>
        `;
        els.count.innerText = '0 Items';
        return;
    }

    state.filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Rating stars logic
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const fill = i <= Math.floor(p.rating) ? 'fill: #f1c40f; color: #f1c40f' : 'color: #ddd';
            stars += `<i data-lucide="star" style="${fill}"></i>`;
        }

        card.innerHTML = `
            ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h4>${p.name}</h4>
                <div class="rating">
                    ${stars} <span>(${p.rating})</span>
                </div>
                <div class="card-actions">
                    <span class="price">${formatINR(p.price)}</span>
                    <button class="add-btn" data-id="${p.id}">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        `;
        els.grid.appendChild(card);
    });

    els.count.innerText = `${state.filtered.length} Items Found`;
    
    // Refresh icons
    if (window.lucide) lucide.createIcons();
}

// Logic to filter and sort
function updateList() {
    let list = [...products];

    // Category filter
    if (state.filters.category !== 'all') {
        list = list.filter(p => p.category === state.filters.category);
    }

    // Price filter
    list = list.filter(p => p.price <= state.filters.maxPrice);

    // Search filter
    if (state.filters.search) {
        const term = state.filters.search.toLowerCase();
        list = list.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.description.toLowerCase().includes(term)
        );
    }

    // Sorting
    const sort = state.filters.sortBy;
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating-high') list.sort((a, b) => b.rating - a.rating);

    state.filtered = list;
    render();
}

// Event Listeners
function bindEvents() {
    // Tabs
    els.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            els.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filters.category = tab.dataset.category;
            els.title.innerText = tab.innerText;
            updateList();
        });
    });

    // Price Slider
    els.priceInput.addEventListener('input', (e) => {
        state.filters.maxPrice = parseInt(e.target.value);
        els.priceLabel.innerText = formatINR(state.filters.maxPrice);
        updateList();
    });

    // Sorting & Search
    els.sort.addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        updateList();
    });

    els.search.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        updateList();
    });

    // Cart clicks
    els.grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-btn');
        if (!btn) return;

        state.cartCount++;
        els.cartBadge.innerText = state.cartCount;
        
        // Simple feedback
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = 'scale(1)', 150);
    });

    // Mobile menu helper
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const links = document.querySelector('.nav-links');
    if (menuBtn) {
        menuBtn.onclick = () => links.classList.toggle('show');
    }
}

// Start the app
function start() {
    // Update slider max for INR
    els.priceInput.max = 150000;
    els.priceInput.value = 150000;
    els.priceLabel.innerText = formatINR(150000);
    
    bindEvents();
    render();
}

start();
