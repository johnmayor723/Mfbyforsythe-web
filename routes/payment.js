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


router.post('/process', async (req, res) => {
    console.log(req.body); // Logging the incoming request body for debugging

    // Paystack keys
    const PAYSTACK_SECRET_KEY = 'sk_test_d754fb2a648e8d822b09aa425d13fc62059ca08e';

    const { name, address, mobile, email, ordernotes, amount, paymentmethod } = req.body;

    // Prepare the order payload
    const orderPayload = {
        name,
        address,
        mobile,
        email,
        ordernotes,
        amount,
        paymentmethod,
        status: 'processing'  // Default order status
    };

    // Check if the payment method is 'cashondelivery'
    if (paymentmethod === 'cashondelivery') {
        console.log('Order Successful: Payment method is "Cash on Delivery".');
        
        try {
            // Post order to external server
            const orderResponse = await axios.post(
                'https://pantry-hub-server.onrender.com/api/orders',
                orderPayload
            );
            console.log(orderResponse.data);  // Logging the response data

            // Clear the cart and redirect to success page
            req.session.cart = null;  
            req.flash('success_msg', 'Order placed successfully with cash on delivery!');
            return res.redirect('/');
        } catch (error) {
            console.error('Error posting order to external server:', error);
            req.flash('error_msg', 'Order processing failed. Please try again.');
            return res.redirect('/cart');
        }
    }

    // Proceed with Paystack payment if the method is not 'cashondelivery'
    const paystackData = {
        email,  
        amount: amount * 100,  // Amount in kobo
        callback_url: 'https://fooddeck-web.onrender.com/payments/callback'
    };

    try {
        // Initialize payment with Paystack
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            paystackData,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,  
                },
            }
        );

        console.log(response.data);

        // Check if Paystack response was successful
        if (response.data.status) {  // Truthy check for status
            const authorizationUrl = response.data.data.authorization_url;

            try {
                // Post order to external server
                const orderResponse = await axios.post(
                    'https://pantry-hub-server.onrender.com/api/orders',
                    orderPayload
                );
                console.log(orderResponse.data);  // Logging the response data

                // Redirect user to Paystack payment page
                return res.redirect(authorizationUrl);
            } catch (error) {
                console.error('Error posting order to external server:', error);
                req.flash('error_msg', 'Order processing failed. Please try again.');
                return res.redirect('/cart');
            }
        } else {
            req.flash('error_msg', 'Payment initialization failed. Please try again.');
            return res.redirect('/cart'); 
        }
    } catch (error) {
        console.error('Error initializing payment with Paystack:', error);  
        req.flash('error_msg', 'Payment processing failed. Please try again.');
        return res.redirect('/cart');
    }
});



module.exports = router;
