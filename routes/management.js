const express = require("express");
const router = express.Router();
const axios = require("axios");
const Subscriber = require('../models/Subscriber');


const upload = require('../helpers/multer');

const API_BASE_URL = 'http://62.113.200.64:3060/api/products';
const BLOGS_URL = "http://62.113.200.64:3060/api/blogs";
const COMMENT_URL = "http://62.113.200.64:3060/api/comments"

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
// create product page.
router.get('/products/new', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/preview`);
    const drafts = response.data;
    res.render('create-products', { drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error.message);
    res.render('create-products', { drafts: [], error: 'Could not load drafts' });
  }
});

router.post(
  '/products/preview',
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'buyingOptionImages', maxCount: 50 }
  ]),
  async (req, res) => {
    try {
      // For debugging
      console.log('Raw body:', req.body);
      const imageUrls = (req.files['images'] || []).map(file => `/uploads/${file.filename}`);
      const buyingOptionFiles = req.files['buyingOptionImages'] || [];

      console.log('Uploaded buyingOptionImages:', buyingOptionFiles.map(f => f.filename));

      // Extract option names array safely
      const names = Array.isArray(req.body.optionNames) ? req.body.optionNames : [req.body.optionNames];

      // Build buyingOptions array by indexing colors, sizes and images
      const buyingOptions = names.map((name, i) => {
        // Note: Colors and sizes are arrays with names like optionColors[i], optionSizes[i]
        const colorsRaw = req.body.optionColors ? req.body.optionColors[i] : undefined;
        const sizesRaw = req.body.optionSizes ? req.body.optionSizes[i] : undefined;

        // Normalize colors and sizes to arrays
        const colors = Array.isArray(colorsRaw) ? colorsRaw : colorsRaw ? [colorsRaw] : [];
        const sizes = Array.isArray(sizesRaw) ? sizesRaw : sizesRaw ? [sizesRaw] : [];

        // Match image file by index if exists
        const imageFile = buyingOptionFiles[i];
        const image = imageFile ? `/uploads/${imageFile.filename}` : null;

        return {
          name,
          colors,
          sizes,
          image
        };
      });

      console.log('Processed buyingOptions:', buyingOptions);

      const newProduct = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        buyingOptions,
        images: imageUrls,
        category: req.body.category,
        subcategory: req.body.subcategory
      };

      console.log('Final newProduct payload:', newProduct);

      const response = await axios.post(`${API_BASE_URL}/preview`, newProduct);

      if (response.status === 201 || response.status === 200) {
        console.log('Draft created:', response.data);
        return res.redirect('/management/products/new');
      } else {
        return res.status(response.status).send('Failed to create draft product');
      }
    } catch (error) {
      console.error('Error creating preview product:', error.message);
      res.status(500).send('Error creating preview product');
    }
  }
);

// get edit before Publish
router.get('/preview/:id/edit', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/preview/${req.params.id}`);
    const product = response.data;
    res.render('edit-preview-product', { product });
  } catch (error) {
    console.error('Error fetching preview product:', error.message);
    res.status(500).send('Error fetching preview product');
  }
});



router.post('/products/publish', async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/publish`);
    req.flash('success_msg', 'Products published successfully');
    res.redirect('/management/products');
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error publishing products';
    req.flash('error_msg', errorMsg);
    res.redirect('/management/products/new');
  }
});

router.post('/preview/:id/delete', async (req, res) => {
  try {
    await axios.delete(`${API_BASE_URL}/preview/${req.params.id}`);
    res.redirect('/management/products');  // or wherever you want to redirect
  } catch (error) {
    res.status(500).send('Error deleting preview product');
  }
});

router.get('/preview/:id/edit', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/preview/${req.params.id}`);
    const previewProduct = response.data;
    res.render('edit-preview-product', { product: previewProduct });
  } catch (error) {
    res.status(500).send('Error fetching preview product');
  }
});


router.post('/products/edit/:id', upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'buyingOptionImages', maxCount: 50 }
]), async (req, res) => {
  try {
    const productId = req.params.id;

    // Debug logs
    console.log('--- Incoming Edit Product Request ---');
    console.log('Product ID:', productId);
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('Uploaded Product Images:', (req.files['images'] || []).map(f => f.filename));
    console.log('Uploaded Buying Option Images:', (req.files['buyingOptionImages'] || []).map(f => f.filename));

    // Handle retained product images
    const keptImages = req.body.keptImages 
      ? (Array.isArray(req.body.keptImages) ? req.body.keptImages : [req.body.keptImages])
      : [];

    const newImages = (req.files['images'] || []).map(file => `/uploads/${file.filename}`);
    const imageUrls = [...keptImages, ...newImages];

    const price = req.body.price;
    const uploadedBuyingOptionFiles = req.files['buyingOptionImages'] || [];

    const names = Array.isArray(req.body.optionNames) ? req.body.optionNames : [req.body.optionNames];

    // Handle kept buying option images
    const keptBuyingOptionImagesRaw = req.body.keptBuyingOptionImages || [];
    const keptBuyingOptionImages = Array.isArray(keptBuyingOptionImagesRaw)
      ? keptBuyingOptionImagesRaw
      : [keptBuyingOptionImagesRaw];

    const buyingOptions = names.map((name, i) => {
      const colorsRaw = req.body.optionColors ? req.body.optionColors[i] : undefined;
      const sizesRaw = req.body.optionSizes ? req.body.optionSizes[i] : undefined;

      const colors = Array.isArray(colorsRaw) ? colorsRaw : colorsRaw ? [colorsRaw] : [];
      const sizes = Array.isArray(sizesRaw) ? sizesRaw : sizesRaw ? [sizesRaw] : [];

      const uploadedImageFile = uploadedBuyingOptionFiles[i];
      const uploadedImage = uploadedImageFile ? `/uploads/${uploadedImageFile.filename}` : null;

      const keptImage = keptBuyingOptionImages[i] || null;

      const imageArray = [];
      if (keptImage) imageArray.push(keptImage);
      if (uploadedImage) imageArray.push(uploadedImage);

      const option = { name, colors, sizes, image: imageArray };
      console.log(`Processed Buying Option [${i}]:`, JSON.stringify(option, null, 2));
      return option;
    });

    const updatedProduct = {
      name: req.body.name,
      description: req.body.description,
      buyingOptions,
      images: imageUrls,
      price,
      category: req.body.category,
      subcategory: req.body.subcategory
    };

    console.log('--- Final Updated Product Payload ---');
    console.log(JSON.stringify(updatedProduct, null, 2));

    const response = await axios.put(`${API_BASE_URL}/preview/${productId}`, updatedProduct);

    if (response.status === 200) {
      console.log('✅ Product updated successfully:', response.data);
      return res.redirect(`/management/products/new`);
    } else {
      console.warn('⚠️ Failed to update product. Status:', response.status);
      return res.status(response.status).send('Failed to update product');
    }

  } catch (error) {
    console.error('❌ Error updating product:', error.message);
    res.status(500).send('Error updating product');
  }
});

/*

router.post('/products/edit/:id', upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'buyingOptionImages', maxCount: 50 }
]), async (req, res) => {
  try {
    const productId = req.params.id;

    // Log incoming request data
    console.log('--- Incoming Edit Product Request ---');
    console.log('Product ID:', productId);
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('Uploaded Product Images:', (req.files['images'] || []).map(f => f.filename));
    console.log('Uploaded Buying Option Images:', (req.files['buyingOptionImages'] || []).map(f => f.filename));
    
    // Process uploaded product images
    const imageUrls = (req.files['images'] || []).map(file => `/uploads/${file.filename}`);
    const price = req.body.price;
    const buyingOptionFiles = req.files['buyingOptionImages'] || [];
    const names = Array.isArray(req.body.optionNames) ? req.body.optionNames : [req.body.optionNames];

    // Build the buyingOptions array
    const buyingOptions = names.map((name, i) => {
      const colorsRaw = req.body.optionColors ? req.body.optionColors[i] : undefined;
      const sizesRaw = req.body.optionSizes ? req.body.optionSizes[i] : undefined;

      const colors = Array.isArray(colorsRaw) ? colorsRaw : colorsRaw ? [colorsRaw] : [];
      const sizes = Array.isArray(sizesRaw) ? sizesRaw : sizesRaw ? [sizesRaw] : [];

      const imageFile = buyingOptionFiles[i];
      const image = imageFile ? `/uploads/${imageFile.filename}` : null;

      const option = { name, colors, sizes, image };
      console.log(`Processed Buying Option [${i}]:`, JSON.stringify(option, null, 2));
      return option;
    });

    // Construct the updated product object
    const updatedProduct = {
      name: req.body.name,
      description: req.body.description,
      buyingOptions,
      images: imageUrls,
      price,
      category: req.body.category,
      subcategory: req.body.subcategory
    };

    console.log('--- Final Updated Product Payload ---');
    console.log(JSON.stringify(updatedProduct, null, 2));

    // Send update request to API
    const response = await axios.put(`${API_BASE_URL}/preview/${productId}`, updatedProduct);

    // Handle API response
    if (response.status === 200) {
      console.log('✅ Product updated successfully:', response.data);
      return res.redirect(`/management/products/new`);
    } else {
      console.warn('⚠️ Failed to update product. Status:', response.status);
      return res.status(response.status).send('Failed to update product');
    }

  } catch (error) {
    console.error('❌ Error updating product:', error.message);
    res.status(500).send('Error updating product');
  }
});*/

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
router.post('/product', async (req, res) => {
  try {
    const newProduct = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      subcategory: req.body.subcategory,
    
      colors: Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors],
      images: Array.isArray(req.body.images) ? req.body.images : [req.body.images],
      buyingOptions: req.body.buyingOptions ? JSON.parse(req.body.buyingOptions) : []
    };

    await axios.post(API_BASE_URL, newProduct);
    res.redirect('/management/products');
  } catch (error) {
    console.error(error);
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

// GET: Render subscribers list in management/subscribers.ejs
router.get('/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ createdAt: -1 });
        res.render('management/subscribers', { subscribers });
    } catch (error) {
        res.render('management/subscribers', { error_msg: 'Server error. Please try again.' });
    }
});
// delete subscriber
router.delete("/subscriber/delete/:id", async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.redirect("/management/subscribers"); // Redirect back to the subscribers list
  } catch (error) {
    res.render("management/subscribers", { error_msg: "Server error. Please try again." });
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
      console.log(req.params.orderId)
    const response = await axios.get(`${BASE_URL}/${req.params.orderId}`);
    res.render('management/order.ejs', { order: response.data });
  } catch (error) {
    res.status(500).send('Failed to fetch order');
  }
});

// UPDATE order & render order.ejs
router.put('/orders/:orderId', async (req, res) => {
  try {
      
    const response = await axios.post(`${BASE_URL}/${req.params.orderId}`, req.body);
    res.render('management/order.ejs', { order: response.data });
  } catch (error) {
    res.status(500).send('Failed to update order');
  }
});


module.exports = router;