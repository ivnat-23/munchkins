const app = {
    // --- DATA ---
    products: [
        { id: 1, name: 'Ragi Cookies', price: 68, image: 'ragi-cookies.jpg', category: 'Snacks', age: '8m+', description: 'Crunchy millet (ragi) cookies for a wholesome, iron-rich snack.', nutrition: '<ul><li>Calories: 70 (per 2 cookies)</li><li>Iron: 10% DV</li><li>Fiber: 2g</li><li>Added Sugar: 0g</li></ul>', ingredients: '<ul><li>Whole Ragi (Finger Millet) Flour</li><li>Banana Puree</li><li>Cold-Pressed Coconut Oil</li><li>Baking Powder</li></ul>'},
        { id: 2, name: 'Puffed Rice', price: 63, image: 'puffed-rice.jpg', category: 'Snacks', age: '6m+', description: 'Light, melt-in-mouth puffed rice—perfect for little fingers.', nutrition: '<ul><li>Calories: 35 (per handful)</li><li>Sodium: 0mg</li><li>Fat: 0g</li></ul>', ingredients: '<ul><li>Puffed Rice</li><li>Vitamin B Fortification</li></ul>'},
        { id: 3, name: 'Porridge Ragi with Banana & Strawberry', price: 315, image: 'porridge-ragi.jpg', category: 'Cereals', age: '6m+', description: 'Creamy ragi porridge blended with real banana and strawberry for natural sweetness.', nutrition: '<ul><li>Calories: 90 (per serving)</li><li>Protein: 3g</li><li>Iron: 15% DV</li><li>Fiber: 3g</li></ul>', ingredients: '<ul><li>Ragi (Finger Millet) Flour</li><li>Banana</li><li>Strawberry</li><li>Oats</li><li>Water</li></ul>'}
    ],
    cart: [],
    currentPage: 'home',

    // --- INITIALIZATION ---
    init() {
        this.renderPage('home');
        this.setupEventListeners();
        this.loadCartFromStorage();
        this.updateCartCounter();
        lucide.createIcons();
        this.checkTheme();
        this.setupScrollAnimations();
        this.setupHeaderScrollEffect();
        this.showOfferModalOncePerSession();
    },

    // --- PAGE RENDERING & NAVIGATION ---
    navigateTo(page, params = {}) {
        window.scrollTo(0, 0);
        this.currentPage = page;
        this.renderPage(page, params);
        this.updateActiveNavLink(page);
        
        document.getElementById('mobile-menu').classList.add('hidden');
    },

    renderPage(page, params = {}) {
        const pageContainer = document.getElementById('page-container');
        pageContainer.innerHTML = '';
        const template = document.getElementById(`${page}-template`);
        if (!template) return;
        
        const pageContent = template.content.cloneNode(true);
        pageContainer.appendChild(pageContent);
        
        if (page === 'home') this.renderHomePage();
        if (page === 'shop') this.renderShopPage(params);
        if (page === 'product-detail') this.renderProductDetailPage(params.productId);
        if (page === 'cart') this.renderCartPage();
        if (page === 'checkout') this.renderCheckoutPage();
        if (page === 'profile') this.renderProfilePage();

        lucide.createIcons();

        // Re-run animations after new content
        this.setupScrollAnimations();
    },

    // --- PAGE-SPECIFIC RENDER LOGIC ---
    renderHomePage() {
        const homeGrid = document.getElementById('home-products-grid');
        if (!homeGrid) return;
        homeGrid.innerHTML = this.products.map(p => this.createProductCard(p)).join('');

        // Initialize testimonials carousel if present
        this.setupTestimonialsCarousel();

        // Initialize premium feature-card hover light effect
        this.setupFeatureCardPointerLight();

        // Initialize stats count up when in view
        this.setupCountUpStats();
    },

    renderShopPage(params = {}) {
        this.renderProductGrid();

        if (params.category) document.getElementById('category-filter').value = params.category;
        if (params.search) document.getElementById('search-bar').value = params.search;

        // initialize dynamic price slider max based on products
        const slider = document.getElementById('price-filter');
        const max = Math.max(...this.products.map(p => p.price));
        if (slider) {
            slider.max = Math.ceil(max);
            if (!params.maxPrice) slider.value = slider.max;
            const priceValue = document.getElementById('price-value');
            if (priceValue) priceValue.textContent = slider.value;
        }

        this.applyFilters();
        this.setupShopEventListeners();
        this.updateProductsCount();
    },
    
    renderProductDetailPage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.navigateTo('shop');
            return;
        }
    
        const placeholder = 'https://placehold.co/600x400/F3F4F6/111827?text=Product+Image';
    
        // Image & Badges
        document.getElementById('product-image').src = product.image || placeholder;
        document.getElementById('product-image').onerror = function(){ this.onerror=null; this.src = placeholder; };
        document.getElementById('product-image').alt = product.name;
    
        document.getElementById('product-age-badge').textContent = product.age;
        document.getElementById('product-tag-badge').textContent = product.tag;
    
        // Main Details
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-short-description').textContent = product.description;
        document.getElementById('product-price').textContent = `₹${product.price.toFixed(2)}`;
    
        // Rating
        const ratingContainer = document.getElementById('product-rating-stars');
        if (ratingContainer) {
            ratingContainer.innerHTML = Array(product.rating || 0).fill('<i data-lucide="star"></i>').join('');
        }
    
        // Accordion Content
        document.getElementById('product-description').textContent = product.description;
        document.getElementById('product-nutrition').innerHTML = product.nutrition;
        document.getElementById('product-ingredients').innerHTML = product.ingredients;
    
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('product-quantity').value);
            this.addToCart(product.id, quantity);
        };
    
        lucide.createIcons();
        this.setupScrollAnimations();
    },

    renderCartPage() {
        const itemsContainer = document.getElementById('cart-items-container');
        const summaryContainer = document.getElementById('cart-summary-container');
        
        if (this.cart.length === 0) {
            document.getElementById('cart-container').innerHTML = `
                <div class="text-center w-full py-16 col-span-full">
                    <h2 class="text-2xl font-semibold mb-4">Your cart is empty!</h2>
                    <p class="mb-6">Looks like you haven't added any yummy treats yet.</p>
                    <button class="bg-[var(--color-primary)] text-white px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 transition-all" onclick="app.navigateTo('shop')">Start Shopping</button>
                </div>
            `;
            return;
        }
    
        const itemsHtml = this.cart.map(item => {
            const product = this.products.find(p => p.id === item.id);
            const itemSubtotal = (product.price * item.quantity).toFixed(2);
            
            return `
                <div class="cart-item-card reveal">
                    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${product.name}</h3>
                        <p class="cart-item-price">₹${product.price.toFixed(2)} per item</p>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn-small" onclick="app.updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <input type="number" value="${item.quantity}" min="1" class="quantity-input-small" onchange="app.updateCartQuantity(${item.id}, parseInt(this.value))">
                                <button class="quantity-btn-small" onclick="app.updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="remove-btn" onclick="app.removeFromCart(${item.id})">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                    <p class="cart-item-subtotal">₹${itemSubtotal}</p>
                </div>
            `;
        }).join('');
    
        itemsContainer.innerHTML = itemsHtml;
        summaryContainer.innerHTML = this.createCartSummaryHtml('cart-page');
        lucide.createIcons();
        this.setupScrollAnimations();
    },

    renderCheckoutPage() {
        const summaryContainer = document.getElementById('checkout-summary');
        if (this.cart.length === 0) {
             this.navigateTo('shop');
             return;
        }
        summaryContainer.innerHTML = this.createCartSummaryHtml('checkout-page');
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.handlePlaceOrder());
        }
    },

    renderProfilePage() {
        // Seed demo orders
        const orders = [
            { id: 'YT-10234', date: '2025-06-02', total: 563, status: 'Delivered' },
            { id: 'YT-10201', date: '2025-05-12', total: 436, status: 'Shipped' },
            { id: 'YT-10155', date: '2025-04-20', total: 225, status: 'Cancelled' }
        ];
        const addresses = [
            { label: 'Home', line1: '123 Yum Street', city: 'Foodie Town', state: 'CA', zip: '90210' },
            { label: 'Grandma', line1: '456 Treat Ave', city: 'Snackville', state: 'NY', zip: '10001' }
        ];

        // Populate orders
        const ordersList = document.getElementById('orders-list');
        if (ordersList) {
            ordersList.innerHTML = orders.map(o => `
                <div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-primary)]/10 bg-[var(--color-card-bg)]">
                    <div>
                        <p class="font-semibold">Order ${o.id}</p>
                        <p class="text-sm text-gray-500">${o.date}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold">₹${o.total.toFixed(2)}</p>
                        <span class="text-xs px-2 py-1 rounded-full ${o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : o.status === 'Shipped' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}">${o.status}</span>
                    </div>
                </div>
            `).join('');
        }

        // Populate addresses
        const addressesList = document.getElementById('addresses-list');
        if (addressesList) {
            addressesList.innerHTML = addresses.map(a => `
                <div class="p-4 rounded-xl border border-[var(--color-primary)]/10 bg-[var(--color-card-bg)]">
                    <p class="font-semibold mb-1">${a.label}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">${a.line1}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">${a.city}, ${a.state} ${a.zip}</p>
                    <div class="mt-3 flex gap-2">
                        <button class="px-3 py-1 rounded-lg border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10">Edit</button>
                        <button class="px-3 py-1 rounded-lg border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10">Remove</button>
                    </div>
                </div>
            `).join('');
        }

        // Tabs
        document.querySelectorAll('[data-profile-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-profile-tab');
                ['account','orders','addresses','preferences'].forEach(t => {
                    document.getElementById(`profile-tab-${t}`).classList.toggle('hidden', t !== target);
                });
            });
        });

        // Form handlers
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const firstName = document.getElementById('pf-fname').value;
                const lastName = document.getElementById('pf-lname').value;
                const email = document.getElementById('pf-email').value;
                document.getElementById('profile-name').textContent = `${firstName} ${lastName}`;
                document.getElementById('profile-email').textContent = email;
                alert('Profile updated (demo).');
            });
            document.getElementById('pf-reset').addEventListener('click', () => {
                document.getElementById('pf-fname').value = 'Akash';
                document.getElementById('pf-lname').value = 'Patil';
                document.getElementById('pf-email').value = 'akashvipatil@gmail.com';
                document.getElementById('pf-phone').value = '(555) 123-4567';
            });
        }

        // Avatar change (dummy)
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                const avatar = document.getElementById('profile-avatar');
                const seed = Math.floor(Math.random() * 1000);
                avatar.src = `https://placehold.co/96x96/${seed % 2 ? '98FB98' : 'FFC0CB'}/3D3B40?text=YOU`;
            });
        }

        // Preferences demo persistence in session
        const prefNewsletter = document.getElementById('pref-newsletter');
        const prefSms = document.getElementById('pref-sms');
        if (prefNewsletter && prefSms) {
            const savedPrefs = JSON.parse(sessionStorage.getItem('Munchkins DelightsPrefs') || '{}');
            prefNewsletter.checked = !!savedPrefs.newsletter;
            prefSms.checked = !!savedPrefs.sms;
            const savePrefs = () => sessionStorage.setItem('Munchkins DelightsPrefs', JSON.stringify({ newsletter: prefNewsletter.checked, sms: prefSms.checked }));
            prefNewsletter.addEventListener('change', savePrefs);
            prefSms.addEventListener('change', savePrefs);
        }

        lucide.createIcons();
    },

    // --- UI COMPONENTS & HELPERS ---
    createProductCard(product) {
    const placeholder = 'https://placehold.co/400x400/F3F4F6/111827?text=Product+Image';
    return `
        <div class="product-card bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all cursor-pointer" onclick="app.navigateTo('product-detail', { productId: ${product.id} })">
            <div class="product-image-wrapper aspect-[4/3]">
                <img src="${product.image || ''}" alt="${product.name}" loading="lazy" class="product-image w-full h-full object-cover" onerror="this.onerror=null;this.src='${placeholder}';">
                <span class="bestseller-badge">Bestseller</span>
                <button class="add-to-cart-btn-overlay" onclick="event.stopPropagation(); app.addToCart(${product.id});" aria-label="Add ${product.name} to cart">
                    <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
            </div>
        </div>
    `;
},

    setupTestimonialsCarousel() {
        const carousel = document.getElementById('testimonials-carousel');
        const track = document.getElementById('testimonials-track');
        const navPrev = document.getElementById('testimonials-prev-ovl');
        const navNext = document.getElementById('testimonials-next-ovl');
        const dotsContainer = document.getElementById('testimonials-dots');
        
        if (!carousel || !track) return;
    
        const cards = Array.from(track.querySelectorAll('.testimonial-card'));
        let activeCardIndex = 0;
        
        // Create dots dynamically
        if (dotsContainer && cards.length > 0) {
            dotsContainer.innerHTML = '';
            cards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
                dot.addEventListener('click', () => this.goToCard(i));
                dotsContainer.appendChild(dot);
            });
        }
    
        // Update the active card and dot
        const updateActiveState = (index) => {
            cards.forEach((card, i) => {
                card.classList.toggle('active', i === index);
            });
            const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button')) : [];
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            activeCardIndex = index;
        };
        
        // Scroll the carousel to a specific card
        this.goToCard = (index) => {
            if (cards.length === 0) return;
            const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
            const card = cards[safeIndex];
            
            // Calculate the scroll position to center the card
            const scrollPosition = card.offsetLeft - (carousel.offsetWidth / 2) + (card.offsetWidth / 2);
            carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            
            updateActiveState(safeIndex);
        };
    
        // Auto-advance the carousel
        let autoPlayTimer = null;
        const startAutoPlay = () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            stopAutoPlay();
            autoPlayTimer = setInterval(() => {
                const nextIndex = (activeCardIndex + 1) % cards.length;
                this.goToCard(nextIndex);
            }, 4000);
        };
    
        const stopAutoPlay = () => {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        };
        
        // Handle manual interaction to stop auto-play
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
        carousel.addEventListener('touchstart', stopAutoPlay, { passive: true });
    
        // Click handlers for navigation buttons
        if (navPrev) {
            navPrev.addEventListener('click', () => this.goToCard(activeCardIndex - 1));
        }
        if (navNext) {
            navNext.addEventListener('click', () => this.goToCard(activeCardIndex + 1));
        }
        
        // Add drag functionality
        let isDragging = false;
        let startX;
        let scrollLeft;
    
        carousel.addEventListener('mousedown', (e) => {
            isDragging = true;
            carousel.classList.add('dragging');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
            stopAutoPlay();
        });
    
        carousel.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                carousel.classList.remove('dragging');
                
                // Snap to the nearest card after drag
                const nearestIndex = Math.round(carousel.scrollLeft / cards[0].offsetWidth);
                this.goToCard(nearestIndex);
                startAutoPlay();
            }
        });
    
        carousel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 1.5; // Controls drag speed
            carousel.scrollLeft = scrollLeft - walk;
        });
    
        // Handle initial state and resize
        const setInitialState = () => {
            updateActiveState(0);
            this.goToCard(0);
            startAutoPlay();
        };
        
        window.addEventListener('load', setInitialState);
        window.addEventListener('resize', setInitialState);
        
        // Initial setup
        setInitialState();
    },
    
    createCartSummaryHtml(context) {
        const subtotal = this.cart.reduce((sum, item) => {
            const product = this.products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        const shipping = subtotal > 0 ? 5.00 : 0;
        const total = subtotal + shipping;
        
        return `
            <div class="order-summary-card">
                <h2 class="summary-heading">Order Summary</h2>
                <div class="space-y-4">
                    <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                    <div class="summary-row"><span>Shipping</span><span>₹${shipping.toFixed(2)}</span></div>
                </div>
                <div class="summary-total summary-row">
                    <span>Total</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
                ${context === 'cart-page' ? `
                    <button class="checkout-btn" onclick="app.navigateTo('checkout')">
                        Proceed to Checkout
                    </button>
                ` : `
                    <button id="place-order-btn" class="checkout-btn">
                        Place Order
                    </button>
                `}
            </div>
        `;
    },

    handlePlaceOrder() {
        const requiredIds = ['fname','lname','address','city','state','zip'];
        const missing = requiredIds.filter(id => !document.getElementById(id)?.value.trim());
        if (missing.length) {
            alert('Please fill in all shipping details.');
            return;
        }
        const paymentSelected = (document.querySelector('input[name="payment"]:checked') || {}).value;
        if (paymentSelected !== 'cod') {
            alert('Only Cash on Delivery is available at the moment.');
            return;
        }

        const orderId = `YT-${Math.floor(10000 + Math.random()*90000)}`;
        const subtotal = this.cart.reduce((sum, item) => {
            const product = this.products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        const shipping = subtotal > 0 ? 5.00 : 0;
        const total = subtotal + shipping;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class=\"bg-[var(--color-card-bg)] rounded-2xl p-8 text-center w-full max-w-md border border-[var(--color-primary)]/10 shadow-xl\">
                <div class=\"mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse\">
                    <svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-10 w-10 text-emerald-600\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6 9 17l-5-5\"/></svg>
                </div>
                <h3 class=\"text-2xl font-bold mt-4\">Order Placed!</h3>
                <p class=\"text-gray-600 dark:text-gray-300\">Thank you for your purchase.</p>
                <div class=\"mt-4 text-left bg-[var(--color-background)]/60 p-4 rounded-xl\">
                    <p><span class=\"font-semibold\">Order ID:</span> ${orderId}</p>
                    <p><span class=\"font-semibold\">Items:</span> ${this.cart.reduce((s,i)=>s+i.quantity,0)}</p>
                    <p><span class=\"font-semibold\">Total:</span> ₹${total.toFixed(2)} (incl. shipping)</p>
                    <p class=\"text-sm text-gray-500 mt-2\">Payment: Cash on Delivery</p>
                </div>
                <div class=\"mt-6 flex gap-3 justify-center\">
                    <button id=\"order-view-btn\" class=\"px-4 py-2 rounded-lg border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10\">View Orders</button>
                    <button id=\"order-continue-btn\" class=\"px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white\">Continue Shopping</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        lucide.createIcons();

        document.getElementById('order-view-btn').addEventListener('click', () => {
            overlay.remove();
            this.cart = [];
            this.saveCartToStorage();
            this.updateCartCounter();
            this.navigateTo('profile', { tab: 'orders' });
        });
        document.getElementById('order-continue-btn').addEventListener('click', () => {
            overlay.remove();
            this.cart = [];
            this.saveCartToStorage();
            this.updateCartCounter();
            this.navigateTo('shop');
        });
    },

    updateActiveNavLink(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('text-[var(--color-primary)]', link.dataset.page === page);
            link.classList.toggle('font-bold', link.dataset.page === page);
        });
    },

    // --- SHOP PAGE LOGIC ---
    renderProductGrid() {
        document.getElementById('products-grid').innerHTML = this.products.map(p => this.createProductCard(p)).join('');
        lucide.createIcons();
    },
    
    applyFilters() {
        const ageFilter = document.getElementById('age-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const priceFilter = parseFloat(document.getElementById('price-filter').value);
        const searchQuery = document.getElementById('search-bar').value.toLowerCase();
        
        let filteredProducts = this.products.filter(p => 
            p.price <= priceFilter &&
            (ageFilter === 'all' || p.age === ageFilter) &&
            (categoryFilter === 'all' || p.category === categoryFilter) &&
            (p.name.toLowerCase().includes(searchQuery) || p.description.toLowerCase().includes(searchQuery))
        );

        const grid = document.getElementById('products-grid');
        const noProductsMessage = document.getElementById('no-products-message');
        
        grid.innerHTML = filteredProducts.length ? filteredProducts.map(p => this.createProductCard(p)).join('') : '';
        grid.classList.toggle('hidden', filteredProducts.length === 0);
        noProductsMessage.classList.toggle('hidden', filteredProducts.length > 0);

        lucide.createIcons();

        // update count
        this.updateProductsCount(filteredProducts.length);
    },
    
    resetFilters() {
        document.getElementById('age-filter').value = 'all';
        document.getElementById('category-filter').value = 'all';
        // set dynamic max from product prices
        const max = Math.max(...this.products.map(p => p.price));
        const slider = document.getElementById('price-filter');
        slider.max = Math.ceil(max);
        slider.value = slider.max;
        document.getElementById('price-value').textContent = slider.value;
        document.getElementById('search-bar').value = '';
        this.applyFilters();
    },
    
    // --- CART LOGIC ---
    addToCart(productId, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ id: productId, quantity: quantity });
        }
        this.updateCartCounter();
        this.saveCartToStorage();
        
        const cartIconBtn = document.querySelector('[data-lucide="shopping-cart"]').closest('button');
        if (cartIconBtn) {
            cartIconBtn.classList.add('add-to-cart-animation');
            setTimeout(() => cartIconBtn.classList.remove('add-to-cart-animation'), 500);
        }
        
        // --- NEW: Show a confirmation pop-up
        this.showAddToCartPopup();
    },
    showAddToCartPopup() {
        // Check if a pop-up already exists to prevent duplicates
        const existingPopup = document.getElementById('add-to-cart-popup');
        if (existingPopup) {
            existingPopup.remove();
            clearTimeout(window.popupTimeout);
        }
        
        const popup = document.createElement('div');
        popup.id = 'add-to-cart-popup';
        popup.className = 'add-to-cart-popup';
        popup.innerHTML = `
            <div class="content">
                <i data-lucide="check-circle" class="icon-success"></i>
                <span>Added to cart!</span>
            </div>
            <button onclick="app.navigateTo('cart');" class="view-cart-btn">View Cart</button>
        `;
    
        document.body.appendChild(popup);
        lucide.createIcons(); // Re-render icons for the new element
    
        // Show the pop-up with a slight delay for a smooth animation
        setTimeout(() => popup.classList.add('visible'), 50);
    
        // Automatically remove the pop-up after a few seconds
        window.popupTimeout = setTimeout(() => {
            popup.classList.remove('visible');
            setTimeout(() => popup.remove(), 300); // Remove element after transition ends
        }, 4000);
    },
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartCounter();
        this.saveCartToStorage();
        if (this.currentPage === 'cart') this.renderCartPage();
    },

    updateCartQuantity(productId, quantity) {
        if (quantity < 1) {
            this.removeFromCart(productId);
            return;
        }
        const item = this.cart.find(item => item.id === productId);
        if (item) item.quantity = quantity;
        
        this.updateCartCounter();
        this.saveCartToStorage();
        if (this.currentPage === 'cart') this.renderCartPage();
    },

    updateCartCounter() {
        const counter = document.getElementById('cart-counter');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = totalItems;
        counter.classList.toggle('hidden', totalItems === 0);
    },

    saveCartToStorage() {
        localStorage.setItem('Munchkins DelightsCart', JSON.stringify(this.cart));
    },
    
    loadCartFromStorage() {
        const savedCart = localStorage.getItem('Munchkins DelightsCart');
        if (savedCart) this.cart = JSON.parse(savedCart);
    },

    // --- EVENT LISTENERS ---
    setupEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });

        // Mobile theme toggle mirrors desktop
        const themeToggleMobile = document.getElementById('theme-toggle-mobile');
        if (themeToggleMobile) {
            themeToggleMobile.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                // Keep menu open but update switch position via class toggles (handled by :has(.dark) via Tailwind classes already in markup)
            });
        }

        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            const menu = document.getElementById('mobile-menu');
            const nowHidden = menu.classList.toggle('hidden');
            document.body.classList.toggle('no-scroll', !nowHidden);
        });
        
        document.getElementById('desktop-search-toggle').addEventListener('click', () => {
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) {
                document.getElementById('nav-links').classList.toggle('hidden');
                const searchContainer = document.getElementById('search-bar-container');
                searchContainer.classList.toggle('hidden');
                if (!searchContainer.classList.contains('hidden')) {
                    document.getElementById('nav-search-input').focus();
                }
            } else {
                const mobileSearch = document.getElementById('mobile-search-container');
                mobileSearch.classList.toggle('hidden');
                if (!mobileSearch.classList.contains('hidden')) {
                    document.getElementById('mobile-nav-search-input').focus();
                }
                // ensure mobile menu is hidden when search is open
                const menu = document.getElementById('mobile-menu');
                menu.classList.add('hidden');
                document.body.classList.remove('no-scroll');
            }
            lucide.createIcons();
        });

        document.getElementById('nav-search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('nav-search-input').value;
            this.navigateTo('shop', { search: query });
            // Hide search bar after search
            document.getElementById('nav-links').classList.remove('hidden');
            document.getElementById('search-bar-container').classList.add('hidden');
        });

        // Mobile search form submit
        const mobileSearchForm = document.getElementById('mobile-nav-search-form');
        if (mobileSearchForm) {
            mobileSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = document.getElementById('mobile-nav-search-input').value;
                this.navigateTo('shop', { search: query });
                document.getElementById('mobile-search-container').classList.add('hidden');
                document.getElementById('mobile-menu').classList.add('hidden');
                document.body.classList.remove('no-scroll');
            });
        }

        // Close mobile menu when resizing to desktop
        window.addEventListener('resize', () => {
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) {
                document.getElementById('mobile-menu').classList.add('hidden');
                document.body.classList.remove('no-scroll');
            }
        });

        // Sync cart counter into mobile menu if present
        const mobileCartCounter = document.getElementById('cart-counter-mobile');
        const desktopCartCounter = document.getElementById('cart-counter');
        if (mobileCartCounter && desktopCartCounter) {
            // initial sync
            mobileCartCounter.textContent = desktopCartCounter.textContent;
            // observe mutations to keep in sync
            const obs = new MutationObserver(() => mobileCartCounter.textContent = desktopCartCounter.textContent);
            obs.observe(desktopCartCounter, { childList: true, characterData: true, subtree: true });
        }
    },

    // --- ANIMATIONS ---
    setupScrollAnimations() {
        const elements = Array.from(document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .stagger'));
        if (!elements.length) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            elements.forEach(el => el.classList.add('in-view'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    if (target.classList.contains('stagger')) {
                        const children = Array.from(target.children);
                        children.forEach((child, i) => child.style.setProperty('--stagger', `${Math.min(i * 60, 480)}ms`));
                        target.classList.add('in-view');
                    } else {
                        target.classList.add('in-view');
                    }
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.18 });

        elements.forEach(el => observer.observe(el));
    },

    // Subtle pointer-follow glow for premium feature cards
    setupFeatureCardPointerLight() {
        const cards = Array.from(document.querySelectorAll('.feature-card'));
        if (!cards.length) return;
        const updateVars = (el, x, y) => {
            const rect = el.getBoundingClientRect();
            const relX = ((x - rect.left) / rect.width) * 100;
            const relY = ((y - rect.top) / rect.height) * 100;
            el.style.setProperty('--mx', `${relX}%`);
            el.style.setProperty('--my', `${relY}%`);
        };
        const onMove = (e) => {
            const target = e.currentTarget;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            updateVars(target, x, y);
        };
        cards.forEach(card => {
            card.addEventListener('mousemove', onMove);
            card.addEventListener('touchmove', onMove, { passive: true });
        });
    },

    setupHeaderScrollEffect() {
        const header = document.getElementById('header');
        if (!header) return;
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    },

    setupCountUpStats() {
        const numbers = Array.from(document.querySelectorAll('.stat-number'));
        if (!numbers.length) return;
        const animate = (el) => {
            const targetRaw = el.getAttribute('data-count');
            const target = parseFloat(targetRaw);
            const isFloat = targetRaw.includes('.')
            const duration = 1400;
            const start = performance.now();
            const format = (v) => isFloat ? v.toFixed(1) : Math.round(v).toLocaleString();
            const step = (t) => {
                const p = Math.min(1, (t - start) / duration);
                const eased = p < .5 ? 2*p*p : -1 + (4 - 2*p) * p; // easeInOutQuad
                const val = target * eased;
                el.textContent = format(val);
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = format(target);
            };
            requestAnimationFrame(step);
        };
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    animate(el);
                    obs.unobserve(el);
                }
            });
        }, { threshold: .4 });
        numbers.forEach(n => observer.observe(n));
    },

    setupShopEventListeners() {
        const filters = ['age-filter', 'category-filter', 'price-filter', 'search-bar'];
        // debounce for search and sliders
        const debounce = (fn, delay = 200) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; };
        filters.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const handler = id === 'search-bar' || id === 'price-filter' ? debounce(() => this.applyFilters()) : () => this.applyFilters();
            el.addEventListener('input', handler);
        });
        
        const priceValue = document.getElementById('price-value');
        if(priceValue) {
            document.getElementById('price-filter').addEventListener('input', (e) => priceValue.textContent = e.target.value);
        }

        document.getElementById('reset-filters-btn')?.addEventListener('click', () => this.resetFilters());
    },

    updateProductsCount(count) {
        const el = document.getElementById('products-count');
        if (!el) return;
        if (typeof count === 'number') el.textContent = count;
        else el.textContent = document.querySelectorAll('#products-grid > *').length;
    },
    
    checkTheme(){
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    // --- OFFER MODAL ---
    showOfferModalOncePerSession() {
        try {
            if (sessionStorage.getItem('MunchkinsDelightsOfferShown') === '1') return;
        } catch (e) { /* ignore storage errors */ }

        const backdrop = document.createElement('div');
        backdrop.className = 'offer-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-label', 'Limited time offer');

        backdrop.innerHTML = `
            <div class="offer-modal offer-confetti">
                <button class="offer-close" aria-label="Close offer" data-offer-close>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                <div class="offer-hero">
                    <div class="offer-ribbon">LIMITED TIME</div>
                    <div class="offer-content">
                        <div>
                            <h3 class="offer-title">Welcome! Enjoy 50% OFF your first order</h3>
                            <p class="offer-subtitle">Use code <strong>WELCOME50</strong> at checkout. Because little tummies deserve big love.</p>
                            <div class="offer-bullets">
                                <span class="offer-chip"><i data-lucide="sparkles"></i> Premium Quality</span>
                                <span class="offer-chip"><i data-lucide="shield-check"></i> Pediatrician Approved</span>
                                <span class="offer-chip"><i data-lucide="leaf"></i> 100% Organic</span>
                            </div>
                            <div class="offer-cta-row">
                                <button class="offer-cta" data-offer-cta>
                                    <i data-lucide="shopping-bag"></i>
                                    Shop Now
                                </button>
                                <button class="offer-ghost" data-offer-close>Maybe later</button>
                            </div>
                        </div>
                        <div class="offer-illustration">
                            <img src="offer.png" alt="Offer Illustration">
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        lucide.createIcons();

        requestAnimationFrame(() => backdrop.classList.add('visible'));

        const setShown = () => {
            try { sessionStorage.setItem('MunchkinsDelightsOfferShown', '1'); } catch (e) {}
        };

        const close = () => {
            backdrop.classList.remove('visible');
            setTimeout(() => backdrop.remove(), 350);
        };

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) { setShown(); close(); }
        });
        backdrop.querySelectorAll('[data-offer-close]').forEach(btn => btn.addEventListener('click', () => { setShown(); close(); }));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setShown(); close(); } }, { once: true });
        backdrop.querySelector('[data-offer-cta]').addEventListener('click', () => {
            setShown();
            close();
            this.navigateTo('shop');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
}); 
