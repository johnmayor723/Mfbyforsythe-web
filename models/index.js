module.exports = function Cart(initItems) {
    // Initialize cart with items if provided, otherwise set it to an empty object
    this.items = initItems;

    // Initialize total quantity and total price of items in the cart
    this.totalQty = 0;
    this.totalPrice = 0;

    // Calculate initial total quantity and price based on items in the cart, if any
    if (this.items) {
        for (var key in this.items) {
            this.totalQty += this.items[key].qty;
            this.totalPrice += this.items[key].qty * this.items[key].item.price;
        }
    }

    // Add a new item or increase the quantity of an existing item
    this.add = function (item, id) {
        // Check if the item already exists in the cart
        var storedItem = this.items[id];
        if (!storedItem) {
            // If it doesn't exist, create a new entry for the item with default values
            storedItem = this.items[id] = {qty: 0, item: item, price: 0, imageUrl: ""};
        }
        // Increase the quantity of the item
        storedItem.qty++;
        // Update the total price for this item
        storedItem.price = storedItem.item.price * storedItem.qty;
        // Set the image URL for the item
        storedItem.imageUrl = storedItem.item.imageUrl;
        // Update the cart's total quantity and total price
        this.totalQty++;
        this.totalPrice += storedItem.item.price;
    };

    // Reduce the quantity of an item by one
    this.reduceByOne = function(id) {
        // Decrease the item's quantity
        this.items[id].qty--;
        // Subtract the item's unit price from its total price
        this.items[id].price -= this.items[id].item.price;
        // Update the cart's total quantity and total price
        this.totalQty--;
        this.totalPrice -= this.items[id].item.price;

        // If the item's quantity reaches zero, remove it from the cart
        if (this.items[id].qty <= 0) {
            delete this.items[id];
        }
    };

    // Increase the quantity of an existing item by one
    this.increaseByOne = function(id) {
        // Check if the item exists in the cart
        var storedItem = this.items[id];
        if (storedItem) {
            // Increase the item's quantity
            storedItem.qty++;
            // Update the total price for this item
            storedItem.price += storedItem.item.price;
            // Update the cart's total quantity and total price
            this.totalQty++;
            this.totalPrice += storedItem.item.price;
        }
    };

    // Remove an item from the cart completely
    this.removeItem = function(id) {
        // Subtract the item's quantity from the cart's total quantity
        this.totalQty -= this.items[id].qty;
        // Subtract the item's total price from the cart's total price
        this.totalPrice -= this.items[id].price;
        // Remove the item from the cart
        delete this.items[id];
    };

    // Generate an array of all items in the cart
    this.generateArray = function () {
        var arr = [];
        // Loop through each item in the cart and add it to the array
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
};