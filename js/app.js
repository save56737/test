// Product Data
const products = [
    {
        id: 1,
        name: "Pearl Drop Necklace",
        price: 45.00,
        category: "necklaces",
        image: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=400&h=400&fit=crop"
    },
    {
        id: 2,
        name: "Gold Hoop Earrings",
        price: 32.00,
        category: "earrings",
        image: "https://images.unsplash.com/photo-1630019852942-f89202989a51?w=400&h=400&fit=crop"
    },
    {
        id: 3,
        name: "Beaded Charm Bracelet",
        price: 28.00,
        category: "bracelets",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop"
    },
    {
        id: 4,
        name: "Silver Ring with Gemstone",
        price: 38.00,
        category: "rings",
        image: "https://images.unsplash.com/photo-1605100804763-eb2fc6f0e5b4?w=400&h=400&fit=crop"
    },
    {
        id: 5,
        name: "Leather Cord Necklace",
        price: 42.00,
        category: "necklaces",
        image: "https://images.unsplash.com/photo-1602751584552-8ba420552259?w=400&h=400&fit=crop"
    },
    {
        id: 6,
        name: "Crystal Stud Earrings",
        price: 25.00,
        category: "earrings",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop"
    },
    {
        id: 7,
        name: "Woven Friendship Bracelet",
        price: 18.00,
        category: "bracelets",
        image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop"
    },
    {
        id: 8,
        name: "Vintage Style Ring",
        price: 55.00,
        category: "rings",
        image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400&h=400&fit=crop"
    },
    {
        id: 9,
        name: "Layered Chain Necklace",
        price: 48.00,
        category: "necklaces",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop"
    },
    {
        id: 10,
        name: "Feather Dangle Earrings",
        price: 30.00,
        category: "earrings",
        image: "https://images.unsplash.com/photo-1635767798638-3e2523c0a2c0?w=400&h=400&fit=crop"
    },
    {
        id: 11,
        name: "Copper Cuff Bracelet",
        price: 35.00,
        category: "bracelets",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop"
    },
    {
        id: 12,
        name: "Minimalist Band Ring",
        price: 22.00,
        category: "rings",
        image: "https://images.unsplash.com/photo-1605100804763-eb2fc6f0e5b4?w=400&h=400&fit=crop"
    }
];

// Shopping Cart
let cart = [];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contactForm');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadProducts('all');
    setupEventListeners();
});

// Load Products
function loadProducts(category) {
    productGrid.innerHTML = '';
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    
    return card;
}

// Setup Event Listeners
function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadProducts(btn.dataset.filter);
        });
    });
    
    // Add to cart buttons (event delegation)
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
        }
    });
    
    // Cart modal
    cartIcon.addEventListener('click', openCart);
    closeCart.addEventListener('click', closeCartModal);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
    
    // Contact form
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        alert('Thank you for your order! This is a demo website.');
        cart = [];
        updateCartDisplay();
        closeCartModal();
    });
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showNotification(`${product.name} added to cart!`);
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// Update Cart Display
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2);
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
    } else {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">Remove</button>
            `;
            cartItems.appendChild(cartItem);
        });
        
        // Add remove event listeners
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                removeFromCart(productId);
            });
        });
    }
}

// Open Cart
function openCart() {
    cartModal.classList.add('active');
}

// Close Cart
function closeCartModal() {
    cartModal.classList.remove('active');
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #2c3e50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
