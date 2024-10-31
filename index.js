const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); // Import express-ejs-layouts

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout'); // Define the default layout file

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
