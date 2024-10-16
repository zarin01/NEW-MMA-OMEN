const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;
const app = require('express')();

const multer = require('multer');
const multerS3 = require('multer-s3');
const { Upload } = require('@aws-sdk/lib-storage'); 
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const aws = require('aws-sdk');


/**
 * Check Admin Role middleware
 */
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/'); 
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId; 

    const user = await User.findById(req.userId);

    if (user && user.role === 'admin') {
      next();
    } else {
      return res.status(403).send('Access denied. Admins only.');
    }
  } catch (error) {
    return res.redirect('/');
  }
};




/**
 * Admin - Create New Post
 * GET /add-post
 */
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post'
    };

    res.render('admin/add-post', {
      locals,
      currentRoute: '/add-post',
      layout: adminLayout
    });
  } catch (error) {
    console.log(error);
  }
});



/**
 * Admin - Handle Image Upload
 * Using Multer
 */
  
// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});



const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'mma-omen-image-upload',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, and .jpeg format allowed!'), false);
    }
  },
});



// Middleware to handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send('File upload error: ' + err.message);
  } else if (err) {
    res.status(500).send('Server error');
  }
});


/**
 * Admin - Create New Post
 * POST /add-post
 */

router.post('/add-post', upload.single('headerImage'), async (req, res) => {
  try {
    const { title, body, author, sports, leagues, isFeatured, metaTitle, metaDescription, keywords, imageAlt } = req.body;
    const headerImage = req.file ? req.file.location : null;
    const slugify = require('slugify');

    const slug = slugify(title, { lower: true, strict: true });
    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];

    const newPost = new Post({
      title,
      slug,
      body,
      author,
      sports: Array.isArray(sports) ? sports : [sports],
      leagues: Array.isArray(leagues) ? leagues : [leagues],
      headerImage,
      imageAlt,
      isFeatured: isFeatured === 'true',
      metaTitle,
      metaDescription,
      keywords: keywordsArray,
      ogImage: req.file ? req.file.location : headerImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newPost.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});





/**
 * Admin - Edit Post
 * GET /edit-post/:slug
 */
router.put('/edit-post/:slug', authMiddleware, upload.single('headerImage'), async (req, res) => {
  try {
    const { title, body, sports, leagues, isFeatured, metaTitle, metaDescription, keywords, imageAlt } = req.body;
    const headerImage = req.file ? req.file.location : null;

    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];

    const updateData = {
      title,
      body,
      sports: Array.isArray(sports) ? sports : [sports],
      leagues: Array.isArray(leagues) ? leagues : [leagues],
      isFeatured: isFeatured === 'true',
      metaTitle,
      metaDescription,
      keywords: keywordsArray,
      imageAlt,
      updatedAt: Date.now(),
      ogImage: req.file ? req.file.location : undefined,
    };

    if (headerImage) {
      updateData.headerImage = headerImage;
    }

    const post = await Post.findOneAndUpdate({ slug: req.params.slug }, updateData, { new: true });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    res.redirect(`/edit-post/${post.slug}?success=true`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});




/**
 * Admin - Update Post
 * PUT /edit-post/:slug
 */
router.put('/edit-post/:slug', authMiddleware, upload.single('headerImage'), async (req, res) => {
  try {
    const { title, body, sports, leagues, isFeatured, metaTitle, metaDescription, keywords, imageAlt } = req.body;
    const headerImage = req.file ? req.file.location : null;

    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    const updateData = {
      title,
      body,
      sports: Array.isArray(sports) ? sports : [sports],
      leagues: Array.isArray(leagues) ? leagues : [leagues],
      isFeatured: isFeatured === 'true',
      metaTitle,
      metaDescription,
      keywords: keywordsArray,
      imageAlt,
      updatedAt: Date.now(),
      ogImage: req.file ? req.file.location : undefined,
    };

    if (headerImage) {
      updateData.headerImage = headerImage;
    }

    const post = await Post.findOneAndUpdate({ slug: req.params.slug }, updateData, { new: true });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    res.redirect(`/edit-post/${post.slug}?success=true`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});




/**
 * Admin - Delete Post
 * DELETE /delete-post/:id
 */
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});


/**
 * Admin - Handle Image Upload
 * Using Multer
 */

app.use('/uploads', express.static('uploads'));


module.exports = router;
