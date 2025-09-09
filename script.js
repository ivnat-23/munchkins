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
    },

    // --- PAGE-SPECIFIC RENDER LOGIC ---
    renderHomePage() {
        const homeGrid = document.getElementById('home-products-grid');
        if (!homeGrid) return;
        homeGrid.innerHTML = this.products.map(p => this.createProductCard(p)).join('');

        // Initialize testimonials carousel if present
        this.setupTestimonialsCarousel();
    },

    renderShopPage(params = {}) {
        this.renderProductGrid();

        if (params.category) document.getElementById('category-filter').value = params.category;
        if (params.search) document.getElementById('search-bar').value = params.search;

        this.applyFilters();
        this.setupShopEventListeners();
    },
    
    renderProductDetailPage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.navigateTo('shop');
            return;
        }

        const placeholder = 'https://placehold.co/600x400/F3F4F6/111827?text=Product+Image';
        document.getElementById('product-image').src = product.image || placeholder;
        document.getElementById('product-image').onerror = function(){ this.onerror=null; this.src = placeholder; };
        document.getElementById('product-image').alt = product.name;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `₹ ${product.price.toFixed(2)}`;
        document.getElementById('product-description').textContent = product.description;
        document.getElementById('product-nutrition').innerHTML = product.nutrition;
        document.getElementById('product-ingredients').innerHTML = product.ingredients;

        const addToCartBtn = document.getElementById('add-to-cart-btn');
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('product-quantity').value);
            this.addToCart(product.id, quantity);
        };
    },

    renderCartPage() {
        const container = document.getElementById('cart-container');
        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="text-center w-full py-16">
                    <h2 class="text-2xl font-semibold mb-4">Your cart is empty!</h2>
                    <p class="mb-6">Looks like you haven't added any yummy treats yet.</p>
                    <button class="bg-[var(--color-primary)] text-white px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90" onclick="app.navigateTo('shop')">Start Shopping</button>
                </div>
            `;
            return;
        }

        const itemsHtml = `<div class="lg:w-2/3 space-y-4">${this.cart.map(item => {
            const product = this.products.find(p => p.id === item.id);
            return `
                <div class="flex items-center bg-[var(--color-card-bg)] p-4 rounded-lg shadow-sm gap-4 border border-[var(--color-primary)]/10">
                    <img src="${product.image}" alt="${product.name}" class="w-24 h-24 rounded-md object-cover">
                    <div class="flex-grow">
                        <h3 class="font-bold">${product.name}</h3>
                        <p class="text-sm text-gray-500">₹${product.price.toFixed(2)}</p>
                    </div>
                    <div class="flex items-center border rounded-lg">
                        <button class="px-3 py-1" onclick="app.updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="w-12 text-center border-none bg-transparent focus:ring-0" onchange="app.updateCartQuantity(${item.id}, parseInt(this.value))">
                        <button class="px-3 py-1" onclick="app.updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <p class="font-semibold w-20 text-right">₹${(product.price * item.quantity).toFixed(2)}</p>
                    <button class="text-gray-400 hover:text-red-500" onclick="app.removeFromCart(${item.id})"><i data-lucide="trash-2"></i></button>
                </div>
            `;
        }).join('')}</div>`;

        container.innerHTML = itemsHtml + this.createCartSummaryHtml('cart-page');
        lucide.createIcons();
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
            <div class="bg-[var(--color-card-bg)] rounded-xl shadow-sm overflow-hidden group cursor-pointer border border-[var(--color-primary)]/10 hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all" onclick="app.navigateTo('product-detail', { productId: ${product.id} })">
                <div class="relative aspect-[4/3] overflow-hidden">
                    <img src="${product.image || ''}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onerror="this.onerror=null;this.src='${placeholder}';">
                    <div class="absolute left-2 top-2">
                        <span class="px-2 py-0.5 text-[10px] md:text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">Bestseller</span>
                    </div>
                    <button class="absolute bottom-2 right-2 bg-[var(--color-primary)] text-white w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all" onclick="event.stopPropagation(); app.addToCart(${product.id});" aria-label="Add ${product.name} to cart">
                        <i data-lucide="shopping-cart"></i>
                    </button>
                </div>
                <div class="p-2.5 md:p-4">
                    <h3 class="font-semibold text-sm md:text-base line-clamp-2 min-h-[2.5rem]">${product.name}</h3>
                    <div class="mt-1 md:mt-2 flex items-center justify-between">
                        <p class="text-[var(--color-primary)] font-bold text-sm md:text-base">₹${product.price.toFixed(2)}</p>
                        <button class="px-2.5 py-1 text-xs md:text-sm rounded-full border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10" onclick="event.stopPropagation(); app.addToCart(${product.id});">Add</button>
                    </div>
                </div>
            </div>
        `;
    },

    setupTestimonialsCarousel() {
        const scroller = document.getElementById('testimonials-carousel');
        const track = document.getElementById('testimonials-track');
        if (!scroller || !track) return;

        // Buttons (overlay)
        const btnPrev = document.getElementById('testimonials-prev-ovl');
        const btnNext = document.getElementById('testimonials-next-ovl');

        const cards = Array.from(track.querySelectorAll('.testimonial-card'));
        const getTargetLeft = (index) => {
            const card = cards[index];
            const left = card.offsetLeft;
            const centered = left - (scroller.clientWidth - card.clientWidth) / 2;
            return Math.max(0, Math.min(centered, scroller.scrollWidth - scroller.clientWidth));
        };
        const getNearestIndex = () => {
            let nearest = 0;
            let best = Infinity;
            for (let i = 0; i < cards.length; i++) {
                const target = getTargetLeft(i);
                const d = Math.abs(scroller.scrollLeft - target);
                if (d < best) { best = d; nearest = i; }
            }
            return nearest;
        };

        let currentIndex = 0;
        const setActiveByIndex = (index) => {
            cards.forEach((c, i) => c.classList.toggle('active', i === index));
            const dots = document.querySelectorAll('#testimonials-dots button');
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        };
        const goToIndex = (index, behavior = 'smooth') => {
            const total = cards.length;
            if (total === 0) return;
            const i = (index + total) % total;
            scroller.scrollTo({ left: getTargetLeft(i), behavior });
            setActiveByIndex(i);
            currentIndex = i;
        };

        if (btnPrev) btnPrev.addEventListener('click', () => goToIndex(currentIndex - 1));
        if (btnNext) btnNext.addEventListener('click', () => goToIndex(currentIndex + 1));

        // Auto-scroll
        let autoTimer = null;
        const startAuto = () => {
            stopAuto();
            autoTimer = setInterval(() => {
                const atEnd = Math.ceil(scroller.scrollLeft + scroller.clientWidth) >= scroller.scrollWidth;
                if (atEnd) scroller.scrollTo({ left: 0, behavior: 'smooth' });
                else scrollByCard(1);
            }, 3500);
        };
        const stopAuto = () => autoTimer && (clearInterval(autoTimer), autoTimer = null);

        scroller.addEventListener('mouseenter', stopAuto);
        scroller.addEventListener('mouseleave', startAuto);

        // Drag to scroll (mouse + touch)
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        const onDown = (pageX) => {
            isDown = true; startX = pageX; scrollStart = scroller.scrollLeft; scroller.classList.add('dragging'); stopAuto();
        };
        const onMove = (pageX) => {
            if (!isDown) return; const dx = pageX - startX; scroller.scrollLeft = scrollStart - dx;
        };
        const onUp = () => {
            if (!isDown) return;
            isDown = false; scroller.classList.remove('dragging');
            const nearest = getNearestIndex();
            goToIndex(nearest);
            startAuto();
        };

        scroller.addEventListener('mousedown', (e) => onDown(e.pageX));
        scroller.addEventListener('mousemove', (e) => onMove(e.pageX));
        window.addEventListener('mouseup', onUp);

        scroller.addEventListener('touchstart', (e) => onDown(e.touches[0].pageX), { passive: true });
        scroller.addEventListener('touchmove', (e) => onMove(e.touches[0].pageX), { passive: true });
        scroller.addEventListener('touchend', onUp);

        // Active center detection and dots
        const dotsContainer = document.getElementById('testimonials-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = cards.map((_, i) => `<button aria-label="Go to testimonial ${i+1}"></button>`).join('');
        }
        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button')) : [];

        const snapToNearest = () => {
            const nearestIdx = getNearestIndex();
            setActiveByIndex(nearestIdx);
            currentIndex = nearestIdx;
        };

        // Update active on scroll and on load/resize
        const onScrollThrottled = (() => {
            let ticking = false;
            return () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        snapToNearest();
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        })();
        scroller.addEventListener('scroll', onScrollThrottled);
        window.addEventListener('resize', onScrollThrottled);

        // Dots click
        dots.forEach((dot, i) => dot.addEventListener('click', () => goToIndex(i)));

        // Helper to move relative to current index (missing earlier)
        const scrollByCard = (delta) => {
            if (!Number.isFinite(delta) || cards.length === 0) return;
            goToIndex(currentIndex + delta);
        };

        // Keyboard navigation for accessibility
        scroller.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key === 'ArrowLeft') { e.preventDefault(); scrollByCard(-1); }
            if (key === 'ArrowRight') { e.preventDefault(); scrollByCard(1); }
            if (key === 'Home') { e.preventDefault(); goToIndex(0); }
            if (key === 'End') { e.preventDefault(); goToIndex(cards.length - 1); }
        });

        // Kick off
        // Slight delay to ensure DOM sizes are stable then set initial active and start auto
        setTimeout(() => {
            const initial = getNearestIndex();
            goToIndex(initial, 'auto');
            // Respect reduced motion preference
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!prefersReduced) startAuto();
        }, 50);
    },
    
    createCartSummaryHtml(context) {
        const subtotal = this.cart.reduce((sum, item) => {
            const product = this.products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        const shipping = subtotal > 0 ? 5.00 : 0;
        const total = subtotal + shipping;

        const wrapperClass = context === 'cart-page' ? 'lg:w-1/3' : '';
        
        return `
            <div class="${wrapperClass}">
                <div class="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-sm sticky top-24 border border-[var(--color-primary)]/10">
                    <h2 class="text-2xl font-bold mb-4">Order Summary</h2>
                    <div class="space-y-2">
                        <div class="flex justify-between"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                        <div class="flex justify-between"><span>Shipping</span><span>₹${shipping.toFixed(2)}</span></div>
                        <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
                    </div>
                    ${context === 'cart-page' ? `
                        <button class=\"w-full mt-6 bg-[var(--color-primary)] text-white py-3 rounded-lg font-bold text-lg hover:opacity-90\" onclick=\"app.navigateTo('checkout')\">Proceed to Checkout</button>
                    ` : `
                        <button id=\"place-order-btn\" class=\"w-full mt-6 bg-[var(--color-primary)] text-white py-3 rounded-lg font-bold text-lg hover:opacity-90\">Place Order</button>
                    `}
                </div>
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
    },
    
    resetFilters() {
        document.getElementById('age-filter').value = 'all';
        document.getElementById('category-filter').value = 'all';
        document.getElementById('price-filter').value = 10;
        document.getElementById('price-value').textContent = 10;
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

    setupShopEventListeners() {
        const filters = ['age-filter', 'category-filter', 'price-filter', 'search-bar'];
        filters.forEach(id => document.getElementById(id)?.addEventListener('input', () => this.applyFilters()));
        
        const priceValue = document.getElementById('price-value');
        if(priceValue) {
            document.getElementById('price-filter').addEventListener('input', (e) => priceValue.textContent = e.target.value);
        }

        document.getElementById('reset-filters-btn')?.addEventListener('click', () => this.resetFilters());
    },
    
    checkTheme(){
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});