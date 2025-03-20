const express = require("express");
const router = express.Router();
const axios = require("axios");

const upload = require('../helpers/multer');

const API_BASE_URL = 'http://93.127.160.233:3060/api/products';
const BLOGS_URL = "http://93.127.160.233:3060/api/blogs";
const COMMENT_URL = "http://93.127.160.233:3060/api/comments"

// Dashboard page
router.get("/", (req, res) => {
  res.render('management/dashboard');
});

/* Admin Dashboard Route
router.get("/admin", (req, res) => {
  res.render("management/admin", { title: "Admin Dashboard" });
});*/

// Dummy user credentials
const DUMMY_USER = {
  email: "admin@mfbyforesythe.com",
  password: "password123"
};

// Login Route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
    req.session.isAuthenticated = true;
    return res.render("management/admin",{ title: "Admin Dashboard" });
  }
  res.status(401).send("Invalid credentials");
});

// Render all products
router.get('/products', async (req, res) => {
  try {
    const response = await axios.get(API_BASE_URL);
    const products = response.data;
    res.render('management/products', { products });
  } catch (error) {
    res.render('management/products', { products: [], error: 'Error fetching products' });
  }
});

// Render product creation form
router.get('/products/new', (req, res) => {
  res.render('create-products');
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
      colors: Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors],
      images: imageUrls
    };

    await axios.post(API_BASE_URL, newProduct);
    res.redirect('/management/products');
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
    res.redirect('/management/products');
  } catch (error) {
    res.status(500).send('Error updating product');
  }
});

// Delete product
router.post('/products/:id/delete', async (req, res) => {
  try {
    await axios.delete(`${API_BASE_URL}/${req.params.id}`);
    res.redirect('/management/products');
  } catch (error) {
    res.status(500).send('Error deleting product');
  }
});

// BLOGS ROUTES

// GET: Render blog management page
router.get('/blogs', async (req, res) => {
  try {
    const response = await axios.get(BLOGS_URL);
    const blogs = response.data.blogs || [];
    res.render('management/blog', { blogs });
  } catch (error) {
    res.render('management/blog', { blogs: [], error: 'Error fetching blogs' });
  }
});

// POST: Create a new blog
router.post('/blogs', upload.single('image'), async (req, res) => {
  const { 
    title, 
    intro, 
    para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
    para11, para12, para13, para14, para15, para16, para17, para18, para19, para20, 
    author 
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Image upload required' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    await axios.post(BLOGS_URL, {
      title,
      intro,
      para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
      para11, para12, para13, para14, para15, para16, para17, para18, para19, para20, 
      image: imageUrl,
      author
    });

    res.redirect('/management/blogs');
  } catch (error) {
    console.error('Error creating blog:', error.message);
    res.status(500).send('Error creating blog');
  }
});

// GET: Render edit blog page
router.get('/blogs/edit/:id', async (req, res) => {
  try {
    const response = await axios.get(`${BLOGS_URL}/${req.params.id}`);
    res.render('management/edit-blog', { blog: response.data.blog});
  } catch (error) {
    res.status(500).send('Error fetching blog for editing');
  }
});

router.put('/blogs/update/:id', upload.single('image'), async (req, res) => {
  const { 
    title, 
    intro, 
    para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
    para11, para12, para13, para14, para15, para16, para17, para18, para19, para20, 
    author 
  } = req.body;

  let updateData = { 
    title, 
    intro, 
    para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
    para11, para12, para13, para14, para15, para16, para17, para18, para19, para20, 
    author 
  };

  // If a new image is uploaded, update the image field
  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  try {
    await axios.put(`${BLOGS_URL}/update/${req.params.id}`, updateData);
    res.redirect('/management/blogs');
  } catch (error) {
    console.error('Error updating blog:', error.message);
    res.status(500).send('Error updating blog');
  }
});

// POST: Delete a blog


router.delete('/blogs/delete/:id', async (req, res) => {
  try {
    // Ensure the correct delete URL format
    const deleteUrl = `http://93.127.160.233:3060/api/blogs/delete/${req.params.id}`;

    // Make the DELETE request to the API
    const response = await axios.delete(deleteUrl);

    // Check API response before redirecting
    if (response.status === 200) {
      res.redirect('/management/blogs');
    } else {
      res.status(response.status).send('Failed to delete blog');
    }
  } catch (error) {
    console.error('Error deleting blog:', error.response?.data || error.message);
    res.status(500).send('Error deleting blog');
  }
});

// POST: Create a new comment
router.post('/comments', async (req, res) => {
  const { blogId, name, content, email} = req.body;

  if (!blogId || !name || !content) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
      await axios.post(`http://93.127.160.233:3060/api/comments/${blogId}`, { name, content, email });
    
    res.redirect(`/blogs/${blogId}`); // Redirect to the blog post after commenting
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(500).send('Error adding comment');
  }
});

// DELETE: Remove a comment
router.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await axios.delete(`${COMMENT_URL}/${id}`);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    res.status(500).send('Error deleting comment');
  }
});
const BASE_URL = 'http://93.127.160.233:3060/api/orders';

// GET all orders & render orders.ejs
router.get('/orders', async (req, res) => {
  try {
    const response = await axios.get(BASE_URL);
    res.render('management/orders.ejs', { orders: response.data });
  } catch (error) {
    res.status(500).send('Failed to fetch orders');
  }
});

// CREATE order & render orders.ejs
router.post('/orders', async (req, res) => {
  const { name, email, shippingAddress, paymentReference, totalAmount } = req.body;

  try {
    await axios.post(BASE_URL, { name, email, shippingAddress, paymentReference, totalAmount });
    const response = await axios.get(BASE_URL); // Fetch updated orders
    res.render('management/orders.ejs', { orders: response.data });
  } catch (error) {
    res.status(500).send('Failed to create order');
  }
});

// GET single order & render order.ejs
router.get('/orders/:orderId', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/${req.params.orderId}`);
    res.render('management/order.ejs', { order: response.data });
  } catch (error) {
    res.status(500).send('Failed to fetch order');
  }
});

// UPDATE order & render order.ejs
router.post('/orders/:orderId', async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/${req.params.orderId}`, req.body);
    res.render('management/order.ejs', { order: response.data });
  } catch (error) {
    res.status(500).send('Failed to update order');
  }
});


module.exports = router;