const express = require("express");
const router = express.Router();
const axios = require("axios");

const API_URL = "https://pantry-hub-server.onrender.com/api/products";

// Homepage route
router.get("/", async (req, res) => {
  try {
    const { data: products } = await axios.get(API_URL);
    const suggestedProducts = products.sort(() => 0.5 - Math.random()).slice(0, 8);
    res.render("Homepage", { products, title: "Home" ,
        suggestedProducts
    });
  } catch (err) {
    res.status(500).send("Error loading products");
  }
});

// Product detail route
router.get("/products/:id", async (req, res) => {
  try {
    const { data: product } = await axios.get(`${API_URL}/${req.params.id}`);
    const { data: allProducts } = await axios.get(API_URL);

   
    // Extract measurement data from the product
    // measurements
    const measurements = product.measurements || []; 

    const suggestedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);

    res.render("shop-detail", {
      product,
      products: suggestedProducts,
      measurements,  // Pass measurement object to the view
      title: "Product Detail"
    });
  } catch (err) {
    res.status(500).send("Error loading product details");
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

// Contact page route
router.get("/contact", (req, res) => {
  res.render("contact");
});

// About page route
router.get("/about", (req, res) => {
  res.render("about");
});
// Return policy page route
router.get("/return-policy", (req, res) => {
  res.render("return-policy", {title: "Return Policy"});
});
// privacy policy page route
router.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy", {title: "Privacy Policy"});
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
router.get("/helpcenter", (req, res) => {
  res.render("helpcenter", {title: "FAQ"});
});



module.exports = router;
