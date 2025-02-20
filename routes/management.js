const express = require("express");
const router = express.Router();
const axios = require("axios");

const upload = require('../helpers/multer');

const API_BASE_URL = 'http://mfbyforsythe.foodliie.com/api/products';


// Render product creation form
router.get('/products/new', (req, res) => {
  res.render('products/new');
});

// Create new product
router.post('/products', upload.array('images', 10), async (req, res) => {
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const newProduct = {
      name: req.body.name,
      description: req.body.description,
      size: req.body.size,
      price: req.body.price,
      colors: req.body.colors.split(','), // Convert comma-separated colors to array
      images: imageUrls
    };

    await axios.post(API_BASE_URL, newProduct);
    res.redirect('/products');
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
      colors: req.body.colors.split(','),
      images: imageUrls.length > 0 ? imageUrls : req.body.existingImages.split(',')
    };

    await axios.put(`${API_BASE_URL}/${req.params.id}`, updatedProduct);
    res.redirect('/products');
  } catch (error) {
    res.status(500).send('Error updating product');
  }
});

// Delete product
router.post('/products/:id/delete', async (req, res) => {
  try {
    await axios.delete(`${API_BASE_URL}/${req.params.id}`);
    res.redirect('/products');
  } catch (error) {
    res.status(500).send('Error deleting product');
  }
});

module.exports = router;
