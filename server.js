const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initial products data
const initialProducts = [
    {
        id: '1',
        name: 'Pearl Drop Necklace',
        price: 89.99,
        category: 'necklaces',
        image: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd7e?w=500&h=500&fit=crop',
        description: 'Elegant freshwater pearl necklace with gold chain',
        inStock: true
    },
    {
        id: '2',
        name: 'Crystal Pendant',
        price: 75.00,
        category: 'necklaces',
        image: 'https://images.unsplash.com/photo-1602751584552-8ba43d5c38f4?w=500&h=500&fit=crop',
        description: 'Handcrafted crystal pendant on silver chain',
        inStock: true
    },
    {
        id: '3',
        name: 'Gold Hoop Earrings',
        price: 65.00,
        category: 'earrings',
        image: 'https://images.unsplash.com/photo-1630019852942-f89202989a51?w=500&h=500&fit=crop',
        description: 'Classic gold-plated hoop earrings',
        inStock: true
    },
    {
        id: '4',
        name: 'Turquoise Studs',
        price: 45.00,
        category: 'earrings',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop',
        description: 'Natural turquoise stone stud earrings',
        inStock: true
    },
    {
        id: '5',
        name: 'Beaded Bracelet',
        price: 55.00,
        category: 'bracelets',
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop',
        description: 'Multi-colored beaded bracelet with charm',
        inStock: true
    },
    {
        id: '6',
        name: 'Silver Cuff',
        price: 95.00,
        category: 'bracelets',
        image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&h=500&fit=crop',
        description: 'Minimalist silver cuff bracelet',
        inStock: true
    },
    {
        id: '7',
        name: 'Rose Gold Ring',
        price: 120.00,
        category: 'rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=500&fit=crop',
        description: 'Delicate rose gold band with small gem',
        inStock: true
    },
    {
        id: '8',
        name: 'Amethyst Ring',
        price: 135.00,
        category: 'rings',
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500&h=500&fit=crop',
        description: 'Sterling silver ring with amethyst stone',
        inStock: true
    },
    {
        id: '9',
        name: 'Layered Chain Necklace',
        price: 98.00,
        category: 'necklaces',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop',
        description: 'Trendy layered gold chain necklace',
        inStock: true
    },
    {
        id: '10',
        name: 'Feather Earrings',
        price: 52.00,
        category: 'earrings',
        image: 'https://images.unsplash.com/photo-1617038224558-28ad3fb558a7?w=500&h=500&fit=crop',
        description: 'Bohemian style feather drop earrings',
        inStock: true
    },
    {
        id: '11',
        name: 'Leather Wrap Bracelet',
        price: 68.00,
        category: 'bracelets',
        image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&h=500&fit=crop',
        description: 'Genuine leather wrap bracelet with beads',
        inStock: true
    },
    {
        id: '12',
        name: 'Vintage Signet Ring',
        price: 145.00,
        category: 'rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=500&fit=crop',
        description: 'Classic vintage-style signet ring',
        inStock: true
    }
];

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialProducts, null, 2));
}

// Orders storage
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

// Contact messages storage
const CONTACTS_FILE = path.join(__dirname, 'data', 'contacts.json');
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
}

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const { category, search } = req.query;
        
        let filtered = products;
        
        if (category && category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower)
            );
        }
        
        res.json({ success: true, data: filtered });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    try {
        const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
});

// Create order
app.post('/api/orders', (req, res) => {
    try {
        const { items, customer, total } = req.body;
        
        if (!items || !customer || !total) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        const newOrder = {
            id: uuidv4(),
            items,
            customer,
            total,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        
        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating order' });
    }
});

// Get all orders (admin)
app.get('/api/orders', (req, res) => {
    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Submit contact form
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
        const newContact = {
            id: uuidv4(),
            name,
            email,
            message,
            createdAt: new Date().toISOString()
        };
        
        contacts.push(newContact);
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
        
        res.status(201).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

// Serve index.html for all other routes (SPA support)
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints available:');
    console.log('  GET  /api/products - Get all products');
    console.log('  GET  /api/products/:id - Get single product');
    console.log('  POST /api/orders - Create new order');
    console.log('  GET  /api/orders - Get all orders');
    console.log('  POST /api/contact - Submit contact form');
});
