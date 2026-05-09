const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../Models/Product');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { uploadProductImage, cloudinary } = require('../Middelwares/uploadMiddleware');

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, pagination
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search, sort, page = 1, limit = 12, featured } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      rating: { ratings: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: products,
    });
  })
);

// @route   GET /api/products/:id
// @desc    Get single product by ID or slug
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id },
      ],
      isActive: true,
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, data: product });
  })
);

// @route   POST /api/products
// @desc    Create a product (Admin)
// @access  Admin
router.post(
  '/',
  protect,
  adminOnly,
  uploadProductImage.array('images', 5),
  asyncHandler(async (req, res) => {
    const {
      name, description, price, discountPrice,
      category, stock, ingredients, benefits, usage,
      weight, tags, isFeatured,
    } = req.body;

    const images = req.files
      ? req.files.map((file) => ({ public_id: file.filename, url: file.path }))
      : [];

    const product = await Product.create({
      name, description, price, discountPrice,
      category, stock, images,
      ingredients: ingredients ? JSON.parse(ingredients) : [],
      benefits: benefits ? JSON.parse(benefits) : [],
      usage, weight,
      tags: tags ? JSON.parse(tags) : [],
      isFeatured: isFeatured === 'true',
    });

    res.status(201).json({ success: true, data: product });
  })
);

// @route   PUT /api/products/:id
// @desc    Update a product (Admin)
// @access  Admin
router.put(
  '/:id',
  protect,
  adminOnly,
  uploadProductImage.array('images', 5),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const updateData = { ...req.body };

    if (req.body.ingredients) updateData.ingredients = JSON.parse(req.body.ingredients);
    if (req.body.benefits) updateData.benefits = JSON.parse(req.body.benefits);
    if (req.body.tags) updateData.tags = JSON.parse(req.body.tags);
    if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured === 'true';

    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const img of product.images) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }
      updateData.images = req.files.map((file) => ({
        public_id: file.filename,
        url: file.path,
      }));
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  })
);

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin — soft delete)
// @access  Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product removed successfully' });
  })
);

// @route   POST /api/products/:id/reviews
// @desc    Add a product review
// @access  Private
router.post(
  '/:id/reviews',
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this product');
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: 'Review added successfully' });
  })
);

module.exports = router;
