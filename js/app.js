// API Base URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.host}/api` 
    : '/api';

// State
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const contactForm = document.getElementById('contactForm');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.querySelector('.nav-links');
const header = document.querySelector('.header');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const successModal = document.getElementById('successModal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    setupEventListeners();
});

// Load Products from API
async function loadProducts() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/products?category=${currentFilter}&search=${searchQuery}`);
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            displayProducts(products);
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError();
    }
}

// Display Products
function displayProducts(productsToDisplay) {
    hideLoading();
    
    if (productsToDisplay.length === 0) {
        productGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    productGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    productGrid.innerHTML = productsToDisplay.map(product => `
        <div class="product-card" data-category="${product.category}">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&h=500&fit=crop'">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Show/Hide States
function showLoading() {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    productGrid.style.display = 'none';
}

function hideLoading() {
    loadingState.style.display = 'none';
}

function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    productGrid.style.display = 'none';
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showToast('Item added to cart!');
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast('Item removed from cart');
}

// Save Cart to LocalStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2);
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="#products" class="btn-primary" onclick="closeCartModal()">Start Shopping</a>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&h=100&fit=crop'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    cartIcon.addEventListener('click', openCartModal);
    closeCart.addEventListener('click', closeCartModal);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) closeCartModal();
    });
    
    checkoutBtn.addEventListener('click', openCheckout);
    closeCheckout.addEventListener('click', closeCheckoutModal);
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) closeCheckoutModal();
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadProducts();
        });
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        loadProducts();
    });
    
    contactForm.addEventListener('submit', handleContactSubmit);
    checkoutForm.addEventListener('submit', handleCheckout);
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    window.addEventListener('scroll', handleScroll);
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

function openCartModal() {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

function openCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }
    
    closeCartModal();
    updateOrderSummary();
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
}

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shipping;
    
    document.getElementById('orderSummaryItems').innerHTML = cart.map(item => `
        <div class="order-total-row">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    document.getElementById('orderSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('orderShipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = total.toFixed(2);
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    try {
        const response = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Message sent successfully!');
            contactForm.reset();
        } else {
            showToast(result.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to send message. Please try again.');
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const customer = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('checkoutEmail').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        zipCode: document.getElementById('zipCode').value
    };
    
    const total = parseFloat(document.getElementById('orderTotal').textContent);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart, customer, total })
        });
        
        const result = await response.json();
        
        if (result.success) {
            cart = [];
            saveCart();
            updateCartUI();
            
            closeCheckoutModal();
            document.getElementById('orderNumber').textContent = result.data.id.substring(0, 8).toUpperCase();
            successModal.classList.add('active');
        } else {
            showToast(result.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to place order. Please try again.');
    }
}

function closeSuccessModal() {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleMobileMenu() {
    navLinks.classList.toggle('active');
}

function handleScroll() {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thank you for subscribing!');
        newsletterForm.reset();
    });
}

window.loadProducts = loadProducts;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.closeCartModal = closeCartModal;
window.closeSuccessModal = closeSuccessModal;
