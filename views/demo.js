router.put(
  '/preview/:id',
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'buyingOptionImages', maxCount: 50 }
  ]),
  async (req, res) => {
    try {
      console.log('====================');
      console.log('🔄 Starting update process...');
      console.log('📦 Raw Files:', req.files);
      console.log('📝 Raw Body:', req.body);

      // === Step 1: Handle Product Images ===
      const uploadedImages = req.files['images'] || [];
      const newImageUrls = uploadedImages.map(file => `/uploads/${file.filename}`);
      console.log('🖼️ Uploaded product images:', newImageUrls);

      const keptImages = Array.isArray(req.body.keepImages)
        ? req.body.keepImages
        : req.body.keepImages
        ? [req.body.keepImages]
        : [];
      console.log('📌 Kept product images:', keptImages);

      const combinedImages = [...keptImages, ...newImageUrls];
      console.log('📷 Combined product images:', combinedImages);

      // === Step 2: Handle Buying Options ===
      const rawNames = req.body['buyingOptions[][name]'] || [];
      const rawPrices = req.body['buyingOptions[][price]'] || [];
      const rawColors = req.body['buyingOptions[][colors]'] || [];
      const rawSizes = req.body['buyingOptions[][sizes]'] || [];

      console.log('📦 Buying option raw names:', rawNames);
      console.log('💰 Buying option raw prices:', rawPrices);
      console.log('🎨 Buying option raw colors:', rawColors);
      console.log('📏 Buying option raw sizes:', rawSizes);

      const uploadedOptionImages = req.files['buyingOptionImages'] || [];
      console.log('🖼️ Uploaded buying option images:', uploadedOptionImages.map(f => f.filename));

      const keptOptionImages = Array.isArray(req.body.keepBuyingOptionImages)
        ? req.body.keepBuyingOptionImages
        : req.body.keepBuyingOptionImages
        ? [req.body.keepBuyingOptionImages]
        : [];
      console.log('📌 Kept buying option images:', keptOptionImages);

      const totalOptions = Array.isArray(rawNames) ? rawNames.length : 1;
      const buyingOptions = [];

      for (let i = 0; i < totalOptions; i++) {
        const name = Array.isArray(rawNames) ? rawNames[i] : rawNames;
        const price = Array.isArray(rawPrices) ? rawPrices[i] : rawPrices;
        const colorsRaw = Array.isArray(rawColors) ? rawColors[i] : rawColors;
        const sizesRaw = Array.isArray(rawSizes) ? rawSizes[i] : rawSizes;

        const colors = Array.isArray(colorsRaw) ? colorsRaw : [colorsRaw].filter(Boolean);
        const sizes = Array.isArray(sizesRaw) ? sizesRaw : [sizesRaw].filter(Boolean);

        const image =
          uploadedOptionImages[i]
            ? `/uploads/${uploadedOptionImages[i].filename}`
            : keptOptionImages[i]
            ? keptOptionImages[i]
            : null;

        const option = {
          name,
          price: parseFloat(price) || 0,
          colors,
          sizes,
          image
        };

        console.log(`🧩 Option #${i + 1}:`, option);
        buyingOptions.push(option);
      }

      // === Step 3: Combine Final Payload ===
      const updatedProduct = {
        name: req.body.name,
        description: req.body.description,
        images: combinedImages,
        buyingOptions,
        category: req.body.category,
        subcategory: req.body.subcategory
      };

      console.log('🚚 Final Payload to API:', updatedProduct);

      const response = await axios.put(`${API_BASE_URL}/preview/${req.params.id}`, updatedProduct);
      console.log('✅ Update successful:', response.status);

      res.redirect('/management/products/new');
    } catch (error) {
      console.error('❌ Update error:', error.message);
      if (error.response) {
        console.error('⚠️ Backend response error data:', error.response.data);
      }
      res.status(500).send('Error updating preview product');
    }
  }
);
