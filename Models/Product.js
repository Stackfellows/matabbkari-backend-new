const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    ingredients: [String],
    benefits: [String],
    usage: String,
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Natural Stomach Support',
        'Herbal Fever Support',
        'Pregnancy Nutrition Balance',
        'Skin Repair & Nutrition',
        'Male Vitality & Performance',
        'Reproductive Health Booster',
        'Kidney Stones & Urinary Flow',
        'HbA1c Elimination',
        'Diabetic Support',
        'Heart Strength & Circulation',
        'Menstrual Balance',
        'Healthy Blood Pressure',
        'Hepatic Protection',
        'Gout Relief',
        'Allergy Support',
        'Depression & Anxiety',
        'Arthritis Relief & Joint Health',
        'Gut Health',
        'Sharabats',
        'Books',
      ],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    weight: String,
    tags: [String],
  },
  { timestamps: true }
);

// Add Indexes for optimization
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: -1 });


// Auto-generate unique slug from name
productSchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) return next();
  
  const slugify = require('slugify');
  let baseSlug = slugify(this.name, { lower: true, strict: true });
  
  if (!baseSlug) {
    baseSlug = 'product';
  }
  
  let uniqueSlug = baseSlug;
  let count = 1;
  
  while (true) {
    const existingProduct = await this.constructor.findOne({
      slug: uniqueSlug,
      _id: { $ne: this._id },
    });
    
    if (!existingProduct) {
      break;
    }
    
    uniqueSlug = `${baseSlug}-${count}`;
    count++;
  }
  
  this.slug = uniqueSlug;
  next();
});

module.exports = mongoose.model('Product', productSchema);
