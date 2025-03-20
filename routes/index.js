const express = require("express");
const router = express.Router();
const axios = require("axios");
const nodemailer = require('nodemailer');

 const mailer = nodemailer.createTransport({
     host: "smtp.zoho.com",
     port: 465,
     secure: "true",
     auth: {
      user: "support@marketspick.com",
      pass: "#@T1onal_Mayor",
    },
});

const upload = require('../helpers/multer');

//const router = express.Router();

// API Base URL (Change this to your API service URL)
const API_URL = 'http://93.127.160.233:3060/api/products/';
const BLOG_URL = 'http://93.127.160.233:3060/api/blogs/';




router.get("/", async (req, res) => {
  try {
    // Fetch products and blogs concurrently
    const [productResponse, blogResponse] = await Promise.all([
      axios.get(API_URL),
      axios.get(BLOG_URL),
    ]);

    const products = productResponse.data;
    const blogs = blogResponse.data.blogs;

    console.log("Fetched products:", products);
    console.log("Found blogs:", blogs);

    // Pick a random product for the deal of the day
    const dealOfTheDay = products.length ? products[Math.floor(Math.random() * products.length)] : null;

    // Shuffle and select 8 random products for suggestions
    const suggestedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 8);

    res.render("index", {
      title: "Home",
      products,
      blogs,
      suggestedProducts,
      dealOfTheDay, // Pass deal to render
    });
  } catch (err) {
    console.error("Error fetching data:", err.message);
    res.status(500).send("Error loading homepage");
  }
});

module.exports = router;



// Fetch single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/${req.params.id}`);
    res.render('product-details', { product: response.data });
  } catch (error) {
    res.status(404).send('Product not found');
  }
});



// Product categories route
router.get("/products/categories/:categoryName", async (req, res) => {
    const category = req.params.categoryName;
    console.log(category)

    try {
        // Make a GET request to the external API to fetch products
        const response = await axios.get(`https://pantry-hub-server.onrender.com/api/categories/${category}`);
        

        // Log the response data (for debugging purposes)
        console.log("data is:", response.data);

        // Retrieve the products data from response
        const products = response.data;
        const { data: allProducts } = await axios.get(API_URL);
        const suggestedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);

        // Check if no products are found for the category
        if (!products || products.length === 0) {
            // Set flash message
            req.flash('error_msg', `No products found for the category: ${category}`);
            // Redirect to homepage
            return res.redirect('/');
        }

        // Send the category data and products to the EJS template
        res.render('category', {
            title: category.toUpperCase(),
        bestSellerProducts:suggestedProducts,
            products: products 
        });
    } catch (error) {
        // Handle any errors that might occur during the request
        //console.error(error);
        req.flash('error', 'An error occurred while fetching the products.');
        console.log(error)
        res.redirect("/")
    }
});
// Get all blogs
router.get("/blogs", async (req, res) => {
  try {
    const response = await axios.get(BLOG_URL);
    const blogs = response.data.blogs; // Assuming the API returns an array of blogs
    res.render("blog", { title: "Blog", blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    res.render("blog", { title: "Blog", blogs: [] }); // Render with empty blogs on error
  }
});


router.get("/blogs/:id", async (req, res) => {
  const blogId = req.params.id;

  try {
    const blogResponse = await axios.get(BLOG_URL);
    const blogs = blogResponse.data.blogs; // Assuming API returns an array of blogs

    // Find the requested blog
    const index = blogs.findIndex((b) => b._id === blogId);

    if (index === -1) {
      return res.status(404).render("404", { title: "Blog Not Found" });
    }

    const blog = blogs[index];

    let before, after;
    
    if (blogs.length === 1) {
      // If there's only one blog, before and after should be the same blog
      before = after = blog;
    } else {
      // Determine before and after blogs
      before = index === 0 ? blogs[blogs.length - 1] : blogs[index - 1];
      after = index === blogs.length - 1 ? blogs[0] : blogs[index + 1];
    }

    res.render("blog-details", { title: blog.title, blog, before, after });
  } catch (error) {
    console.error(`Error fetching blog with ID ${blogId}:`, error.message);
    res.status(500).render("500", { title: "Server Error" });
  }
});

// About page route
router.get("/about", (req, res) => {
  res.render("about");
});
// Contavt page route
router.get("/contact", (req, res) => {
  res.render("contact");
});
// Contavt page route
router.get("/help-center", (req, res) => {
  res.render("helpcenter");
});
// Return policy page route
router.get("/return-policy", (req, res) => {
  res.render("return-policy", {title: "Return Policy"});
});
// privacy policy page route
router.get("/privacy-policy", (req, res) => {
  res.redirect("https://www.termsfeed.com/live/0530beea-5482-4fe2-805a-0f05f3a33326");
});
// privacy policy page route
router.get("/faqs", (req, res) => {
  res.render("faqs", {title: "FAQ"});
});
// paystack callback route
router.get("/callback", (req, res) => {
  res.render("success", {title: "FAQ"});
});

// privacy policy page route

router.post('/newsletter', async (req, res) => {
  const {  email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
  }

  try {
    // Send email to admin
    const adminMailOptions = {
      from: '"mfbyforesythebrand" <support@marketspick.com>',
      to: 'mayowaandrews723@gmail.com',
      subject: 'New Contact Form Submission',
      html: `
        <h3>New newsletter subscriber</h3>
        <p><strong>Name:</strong> </p>
        <p><strong>Email:</strong> ${email}</p>

      `,
    };

    // Acknowledge sender with a styled HTML email
    const userMailOptions = {
      from: '"mfbyforesythebrand Support" <support@marketspick.com>',
      to: email,
      subject: 'Thanks for Subscribing to our newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img height="50px" src="https://firebasestorage.googleapis.com/v0/b/fooddeck-fc840.appspot.com/o/mfico.jpg?alt=media&token=eefddae4-e98f-46cf-a375-515d8688eb55">
          </div>
          <div>
            <h2 style="color: #2D7B30;">Hello, !</h2>
            <p style="font-size: 16px; color: #333;">Thank you for Subscribing to our newsletter.</p>
            
          </div>
          <footer style="text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
            <p>mfbyforesythebrand</p>
            <p></p>
            <p>Email: info@mfbyforesythebrand.com</p>
            <p>Website: <a href="https://www.mfbyforesythebrand.com" style="color: #2D7B30;">www.mfbyforesythebrand.com</a></p>
          </footer>
        </div>
      `,
    };

    // Assuming `mailer` is your configured mailing service
    await mailer.sendMail(adminMailOptions);
    await mailer.sendMail(userMailOptions);
    req.flash("sucess_msg", "successfully subscribed to newsletter")
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while sending the message.' });
  }
});
router.get("/helpcenter", (req, res) => {
  res.render("helpcenter", {title: "FAQ"});
});





module.exports = router;
