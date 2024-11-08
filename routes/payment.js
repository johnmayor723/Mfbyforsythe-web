const express = require("express");
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const {generateOrderEmailHTML} = require('../helpers')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fooddeck3@gmail.com',
        pass: 'xyca sbvx hifi amzs'  // Replace with actual password
    }
});




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
     const cart = req.session.cart;
    // Paystack keys
    const PAYSTACK_SECRET_KEY = 'sk_test_d754fb2a648e8d822b09aa425d13fc62059ca08e';

    const { name, address, mobile, email, ordernotes, amount, paymentmethod } = req.body;
    
        // Email options for user and admin
    
    // Function to generate email HTML content
  /*  const generateOrderEmailHTML = (cartItems, orderDetails, isAdmin = false) => {
        const itemsRows = cartItems.map(item => `
            <tr style="border: 1px solid gray;">
                <td style="padding: 10px; text-align: center;"><img src="${item.imageUrl}" alt="${item.name}" width="50"></td>
                <td style="padding: 10px; text-align: center;">${item.name}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: center;">₦${item.price}</td>
            </tr>
        `).join('');

        return `
            <div style="text-align: center; padding: 20px;">
                <h1><img src="https://firebasestorage.googleapis.com/v0/b/fooddeck-fc840.appspot.com/o/Logo-removebg-preview%20(3).png?alt=media&token=e3635a63-8ba2-40c8-a3fc-1d068979c172" alt="Company Logo" width="100"></h1>
            </div>
            <div style="padding: 20px;>
                <h3>${isAdmin ? 'New Order Notification' : 'Order Confirmation'}</h3>
                <p>Order Details:</p>
                
                <div style="margin:20px 0;color:#FE9801;font-size:15px; font-style:italic">
                 <p>
            ${isAdmin 
                ? 'A new order was made. Please review the order details below:' 
                : `Hello ${name},<br>
                
                   Thank you for placing an order! Your order has been successfully placed. You can review your order details below. Our sales agent will contact you soon for confirmation.`
            }
        </p>
        </div>
                 
                
                <table style="width: 100%; border-collapse: collapse;">
                
                    <thead>
                        <tr style="border: 1px solid gray;">
                            <th style="padding: 10px; text-align: center;">Image</th>
                            <th style="padding: 10px; text-align: center;">Name</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: center;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
                <p><strong>Total Quantity:</strong> ${cart.totalQty}</p>
                <p><strong>Total Amount:</strong> ₦${cart.totalAmount}</p>
                <p><strong>Order Notes:</strong> ${orderDetails.ordernotes}</p>
            </div>
            <div style="text-align: center; padding: 20px; border-top: 1px solid gray;">
                <p>Contact us: info@fooddeck.com.ng | Website: www.fooddeck.com.ng</p>
            </div>
        `;
    };*/
    
    // nnnnnnnnnnn###££££££££££//////
    
    
const orderPayload = {
        name,
        address,
        mobile,
        email,
        ordernotes,
        amount,
        paymentmethod,
        status: 'processing'//Default order status
    
    
};
    
const userEmailOptions = {
    from: '"FoodDeck" <fooddeck3@gmail.com>', // Display name with email in brackets
    to: email,
    subject: 'Order Confirmation - FoodDeck',
    html: generateOrderEmailHTML(cart, orderPayload)
};

const adminEmailOptions = {
    from: '"FoodDeck" <fooddeck3@gmail.com>',
    to: 'fooddeck3@gmail.com',
    subject: 'New Order Notification - FoodDeck',
    html: generateOrderEmailHTML(cart, orderPayload, true)
};

    // Prepare the order payload
    

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
          // Send emails
                await transporter.sendMail(userEmailOptions);
                await transporter.sendMail(adminEmailOptions);

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
        callback_url: 'https://fooddeck-web.onrender.com/callback'
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
                 req.session.cart = null;  
     // Send emails
                await transporter.sendMail(userEmailOptions);
                await transporter.sendMail(adminEmailOptions);

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
