const express = require("express");
const router = express.Router();
const axios = require("axios");

const API_URL = "https://pantry-hub-server.onrender.com/api/products";

// Homepage route
router.get("/", async (req, res) => {
  try {
    const { data: products } = await axios.get(API_URL);
    res.render("Homepage", { products, title: "Home" });
  } catch (err) {
    res.status(500).send("Error loading products");
  }
});

// Product detail route
router.get("/products/:id", async (req, res) => {
  try {
    const { data: product } = await axios.get(`${API_URL}/${req.params.id}`);
    const { data: allProducts } = await axios.get(API_URL);
    const suggestedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);
    res.render("shop-detail", { product, products: suggestedProducts, title: "Product Detail" });
  } catch (err) {
    res.status(500).send("Error loading product details");
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

module.exports = router;
