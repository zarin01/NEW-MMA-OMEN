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

    // Fetch user from the database to check their role
    const user = await User.findById(req.userId);

    if (user && user.role === 'admin') {
      next(); // User is an admin, allow access
    } else {
      return res.status(403).send('Access denied. Admins only.');
    }
  } catch (error) {
    return res.redirect('/');
  }
};

/**
 * Admin Dashboard
 * GET /dashboard
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    const data = await Post.find();
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * Admin - Create New Post
 * GET /add-post
 */
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    res.render('admin/add-post', {
      locals,
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
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filter for image files
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};
  
  
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
    s3: s3, // The S3 client with the region specified
    bucket: 'your-s3-bucket-name',
    acl: 'public-read', // Set file permissions (optional)
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect content type
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname); // Unique filename
    }
  }),
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, and .jpeg format allowed!'), false);
    }
  },
});
  
/**
 * Admin - Create New Post
 * POST /add-post
 */

router.post('/add-post', upload.single('headerImage'), async (req, res) => {
  try {
    const { title, body, author, categories } = req.body;
    const headerImage = req.file ? req.file.location : null; // S3 file URL

    const newPost = new Post({
      title,
      body,
      author,
      categories: categories.split(',').map(cat => cat.trim()), // Convert categories
      headerImage, // Save image URL to the database
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newPost.save(); // Save post to database
    res.redirect('/dashboard'); // Redirect after successful creation
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
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
 * Admin - Edit Post
 * GET /edit-post/:id
 */
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Edit Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    const data = await Post.findOne({ _id: req.params.id });

    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * Admin - Update Post
 * PUT /edit-post/:id
 */
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.log(error);
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
