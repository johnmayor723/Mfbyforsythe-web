const express = require("express");
const router = express.Router();
const Cart = require('../models');

// Route to add an item to the cart
router.post('/:id', (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart.items : {});
  
  const { name, imageUrl, price } = req.body;
  const product = { name, imageUrl, price };

  cart.add(product, productId);
  req.session.cart = cart;
  req.flash('success_msg', 'Item added to cart!'); // Flash message for success
  res.redirect('/');
});

// Cart view route
router.get('/', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shopping-cart', { products: null, title: "Shopping Cart" });
  }
  const cart = new Cart(req.session.cart.items);
  res.render('cart', { products: cart.generateArray(), totalPrice: cart.totalPrice, title: "Cart" });
});

// Reduce product quantity by one
router.get('/reduce/:id', (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

// Increase product quantity by one
router.get('/increase/:id', (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.increaseByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

// Remove product from cart
router.get('/remove/:id', (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});


// Function to format cart contents
function formatCart(cart) {
  let formattedCart = 'Your cart contains:\n\n';
  let totalAmount = 0;

  cart.forEach(item => {
    formattedCart += `Name: ${item.name}\n`;
    formattedCart += `Price: $${item.price}\n`;
    formattedCart += `Quantity: ${item.qty}\n`;
    formattedCart += `-----------------\n`;
    totalAmount += item.price * item.qty;
  });

  formattedCart += `Total Price: $${totalAmount.toFixed(2)}\n`;
  return formattedCart;
}

module.exports = router;
