const express = require("express");
const router = express.Router();
const Cart = require('../models');

// Payment page route
router.get('/', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shopping-cart', { products: null, title: "Shopping Cart" });
  }
  const cart = new Cart(req.session.cart.items);
  res.render('checkout', { 
    products: cart.generateArray(), 
    totalPrice: cart.totalPrice, 
    title: "Payment Page" 
  });
});

// Additional payment processing route (if needed)
// This route could handle actual payment processing, such as integrating with a payment gateway.
// Example of a payment processing endpoint (assuming POST for handling payment data)
router.post('/process', async (req, res) => {
  try {
    // Add your payment processing logic here
    // e.g., use a payment gateway API to process the payment

    // If payment is successful
    req.session.cart = null;  // Clear the cart after successful payment
    req.flash('success_msg', 'Payment processed successfully!');
    res.redirect('/');  // Redirect to the home page or a success page
  } catch (error) {
    req.flash('error_msg', 'Payment processing failed. Please try again.');
    res.redirect('/cart');  // Redirect back to the cart page on failure
  }
});

module.exports = router;
