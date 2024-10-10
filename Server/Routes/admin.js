const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

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
 * Admin - Create New Post
 * POST /add-post
 */
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body
    });

    await Post.create(newPost);
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
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

module.exports = router;
