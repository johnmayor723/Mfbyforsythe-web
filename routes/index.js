const express = require("express");
const router = express.Router();
const axios = require("axios");

const API_URL = "https://pantry-hub-server.onrender.com/api/products";

// Homepage route
router.get("/", async (req, res) => {
  try {
    const { data: products } = await axios.get(API_URL);
    res.render("index", { products });
  } catch (err) {
    res.status(500).send("Error loading products");
  }
});

// Product detail route
router.get("/product/:id", async (req, res) => {
  try {
    const { data: product } = await axios.get(`${API_URL}/${req.params.id}`);
    const { data: allProducts } = await axios.get(API_URL);
    const suggestedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);
    res.render("show", { product, suggestedProducts });
  } catch (err) {
    res.status(500).send("Error loading product details");
  }
});

// Cart page route
router.get("/cart", (req, res) => {
  res.render("cart", { cart: req.session.cart || [] });
});

// Payment page route
router.get("/payment", (req, res) => {
  res.render("payment");
});

// Add to Cart
router.post("/cart/add/:id", (req, res) => {
  const product = req.session.cart.find(item => item.id === req.params.id);
  if (product) {
    product.quantity++;
  } else {
    req.session.cart.push({ id: req.params.id, quantity: 1 });
  }
  req.flash("success", "Product added to cart");
  res.redirect("/cart");
});

module.exports = router;

