const express = require("express");
const router = express.Router();
const Cart = require('../models');

// Payment page route
router.post('/', (req, res, next) => {
    const amount = req.body.amount
    console.log('amount to be paid:', amount)
  if (!req.session.cart) {
    return res.render('cart', {cart, title: "Shopping Cart" });
  }
  
  res.render('checkout', { 
    amount,
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
