const express = require("express");
const router = express.Router();
const axios = require("axios");

const upload = require('../helpers/multer');

const API_BASE_URL = 'http://93.127.160.233:3060/api/products';

// dashboard page
router.get("/", (req, res)=>{
   res.render('management/dashboard')
})
// Render all products with data from API
router.get('/products', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`); // Fetch products from API
    const products = response.data; // Extract products from response

    res.render('management/products', { products }); // Pass products to template
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.render('management/products', { products: [] }); // Render empty products list on error
  }
});
// Render product creation form
router.get('/products/new', (req, res) => {
  res.render('create-products');
});

// Create new product
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const newProduct = {
      name: req.body.name,
      description: req.body.description,
      size: req.body.size,
      price: req.body.price,
      colors: Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors], // Ensure it's always an array
      images: imageUrls
    };
    
    console.log("new product:", newProduct)

    await axios.post(API_BASE_URL, newProduct);
    res.redirect('management/products');
  } catch (error) {
    res.status(500).send('Error creating product');
  }
});

// Update product
router.post('/products/:id/update', upload.array('images', 5), async (req, res) => {
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const updatedProduct = {
      name: req.body.name,
      description: req.body.description,
      size: req.body.size,
      price: req.body.price,
      colors: req.body.colors,
      images: imageUrls.length > 0 ? imageUrls : req.body.existingImages.split(',')
    };

    await axios.put(`${API_BASE_URL}/${req.params.id}`, updatedProduct);
    res.redirect('management/products');
  } catch (error) {
    res.status(500).send('Error updating product');
  }
});

// Delete product
router.post('/products/:id/delete', async (req, res) => {
  try {
    await axios.delete(`${API_BASE_URL}/${req.params.id}`);
    res.redirect('management/products');
  } catch (error) {
    res.status(500).send('Error deleting product');
  }
});

module.exports = router;
