const express = require("express");
const router = express.Router();
const axios = require('axios');
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


router.get('/callback', async (req, res) => {
    try {
        // Log the request body, this will contain the transaction data sent by Paystack
        console.log(req.body); // This will log the order details received

        // Send the order object (the request body) to the screen
        res.json({
            message: 'Order details received.',
            order: req.body,  // Sending the order object to the screen
        });
    } catch (error) {
        console.error('Error handling the callback:', error);
        res.status(500).json({
            message: 'An error occurred while processing your order.',
            error: error.message,
        });
    }
});


// Express route to handle the payment processing
router.post('/process', async (req, res) => {
    try {
        console.log(req.body); // Logging the incoming request body for debugging
        // Paystack keys
        const PAYSTACK_SECRET_KEY = 'sk_test_d754fb2a648e8d822b09aa425d13fc62059ca08e';
        const PAYSTACK_PUBLIC_KEY = 'pk_test_aaa2a37e07f4dffbc9dfdb2f8418d34243ecb816';


        const { name, address, mobile, email, ordernotes, amount, paymentmethod } = req.body;

        // Check if the payment method is 'banktransfer' (Cash on Delivery)
        if (paymentmethod === 'cashondelivery') {
            console.log('Order Successful: Payment method is "Cash on Delivery".');
            
            // Proceed to clear the cart after successful order
            req.session.cart = null;  // Clear the cart after successful payment
            req.flash('success_msg', 'Payment processed successfully!');  // Flash success message
            return res.redirect('/');  // Redirect to the home page or a success page
        }

        // If payment method is Paystack (card payment), we need to initiate a Paystack payment
        const paystackData = {
            email: email,  // Customer's email
            amount: amount * 100,  // Amount in kobo (Paystack uses kobo, so we multiply by 100)
            callback_url: 'http://localhost:5000/payments/callback'
        };

        // Making an API request to Paystack to initialize the payment
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            paystackData,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,  // Using the secret key directly
                },
            }
        );
          console.log(response.data)
          console.log(response.data.status)
        // Checking if the response was successful from Paystack
        if (response.data.status = true) {
            const authorizationUrl = response.data.data.authorization_url;  // URL to redirect user to Paystack payment page

            // Redirect user to Paystack payment page
            res.redirect(authorizationUrl);
        } else {
            req.flash('error_msg', 'Payment initialization failed. Please try again.');
            console.log("failure")
            res.redirect('/cart'); 
        }
    } catch (error) {
        console.error(error);  
        req.flash('error_msg', 'Payment processing failed. Please try again.');
        res.redirect('/cart')
    }
});



module.exports = router;
