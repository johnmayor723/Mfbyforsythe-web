const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// 1. Create a new order
router.post("/create", async (req, res) => {
  try {
    const { cart, email, address, name, paymentId } = req.body;

    const order = new Order({
      cart,
      email,
      address,
      name,
      paymentId,
    });

    await order.save();
    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error });
  }
});

// 2. Update an order (e.g., updating order status)
router.put("/update/:id", async (req, res) => {
  try {
    const { status } = req.body; // Accepting status update
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

// 3. Get an order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving order", error });
  }
});

module.exports = router;
