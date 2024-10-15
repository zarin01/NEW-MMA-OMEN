const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const badWords = require('../middleware/removedWordsList');
const Contact = require('../models/Contact');

const jwtSecret = process.env.JWT_SECRET;
const adminLayout = '../views/layouts/admin';
const mainLayout = '../views/layouts/main';




/**
 * Check Login middleware
 */
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.isLoggedIn = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;

    const user = await User.findById(req.userId);

    req.isLoggedIn = !!user;

    req.user = user;

    next();
  } catch (error) {
    req.isLoggedIn = false;
    next();
  }
};




/**
 * GET /
 * HOME
 */
router.get('', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "MMA OMEN"
    };

    let perPage = 10;
    let page = req.query.page || 1;

    // Query for the two most recent featured posts
    const featuredPosts = await Post.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(2);

    // Fetch last 5 posts, UFC posts, and MMA posts
    const lastPosts = await Post.find().sort({ createdAt: -1 }).limit(5);
    const ufcPosts = await Post.find({ categories: /UFC/ }).sort({ createdAt: -1 }).limit(5);
    const mmaPosts = await Post.find({ categories: /MMA/ }).sort({ createdAt: -1 }).limit(5);

    // Pagination logic for latest posts
    const latestPosts = await Post.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;

    // Render the page, including featured posts
    res.render('index', { 
      locals,
      featuredPosts,   // Pass the featured posts to the view
      lastPosts,
      ufcPosts,
      mmaPosts,
      latestPosts,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/',
      layout: PageLayout,
      isLoggedIn: req.isLoggedIn
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});




/**
 * GET /
 * Admin - Login Page middleware
*/
router.get('/log-in', authMiddleware, async (req, res) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.userId;

      const user = await User.findById(req.userId);

      if (user && user.role === 'admin') {
        return res.redirect('/dashboard');
      } else {
        return res.redirect('/profile');
      }
    } catch (error) {
      console.log(error);
      return res.redirect('/log-in');
    }
  }

  const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;

  const locals = {
    title: "Admin",
    description: "Simple Blog created with NodeJs, Express & MongoDb."
  };

  res.render('admin/index', { 
    locals, 
    currentRoute: '/log-in',
    layout: PageLayout,
    isLoggedIn: req.isLoggedIn 
  });
});




/**
 * POST /
 * Admin - Check Login
*/
router.post('/log-in', authMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });

    res.redirect('/');

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});



/**
 * GET /
 * Post :slug
 */
router.get('/post/:slug', authMiddleware, async (req, res) => {
  try {
    const slug = req.params.slug;

    const data = await Post.findOne({ slug: slug });

    if (!data) {
      return res.status(404).send('Post not found');
    }

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;

    res.render('post', { 
      locals,
      data,
      layout: PageLayout,
      currentRoute: `/post/${slug}`,
      isLoggedIn: req.isLoggedIn
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});



/**
 * POST /
 * Post - searchTerm
*/
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Search",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      data,
      locals,
      currentRoute: '/',
      isLoggedIn: req.isLoggedIn
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * About
*/
router.get('/about', authMiddleware, (req, res) => {
  const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;
  res.render('about', {
    currentRoute: '/about',
    isLoggedIn: req.isLoggedIn,
    layout: PageLayout
  });
});



/**
 * GET / User
 * Log In - Register
*/
router.get('/register', authMiddleware, (req, res) => {
  const locals = {
    title: "Register",
    description: "Create an account."
  };

  res.render('register', { locals, currentRoute: '/register', isLoggedIn: req.isLoggedIn });
});



/**
 * POST / User
 * Log In - Register
*/
router.post('/register', authMiddleware, async (req, res) => {
  try {

    const { username, password, honeypot } = req.body;

    if (honeypot) {
      return res.status(400).render('register', { 
        locals: { 
          title: "Register", 
          description: "Create an account.", 
          errorMessage: 'Bot activity detected. Registration failed.' 
        }, 
        currentRoute: '/register',
        isLoggedIn: req.isLoggedIn
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password: hashedPassword });

      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });

      res.redirect('/'); 

    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).render('register', { 
          locals: { 
            title: "Register", 
            description: "Create an account.", 
            errorMessage: 'Username already in use' 
          }, 
          currentRoute: '/register' ,
          isLoggedIn: req.isLoggedIn
        });
      }
      return res.status(500).render('register', { 
        locals: { 
          title: "Register", 
          description: "Create an account.", 
          errorMessage: 'Internal server error. Please try again later.' 
        }, 
        currentRoute: '/register',
        isLoggedIn: req.isLoggedIn
      });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).render('register', { 
      locals: { 
        title: "Register", 
        description: "Create an account.", 
        errorMessage: 'Internal server error. Please try again later.' 
      }, 
      currentRoute: '/register',
      isLoggedIn: req.isLoggedIn
    });
  }
});


/**
 * GET /
 * User Logout
*/
router.get('/logout', authMiddleware, (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});


/**
 * GET /
 * Comment
*/
router.get('/post/:slug/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    const comments = await Comment.find({ post: post._id }).sort({ createdAt: -1 });
    const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;

    const locals = {
      title: `${post.title} - Comments`,
      description: 'View and add comments to the post.'
    };

    res.render('comments', {
      post,
      comments,
      layout: PageLayout,
      currentRoute: '/post/:slug/comments',
      isLoggedIn: req.isLoggedIn,
      locals
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

const sanitizeComment = (comment) => {
  let sanitizedComment = comment;

  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitizedComment = sanitizedComment.replace(regex, '*'.repeat(word.length));
  });

  return sanitizedComment;
};

/**
 * POST /
 * Comment
 */
router.post('/post/:slug/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });

    if (!req.isLoggedIn) {
      return res.status(401).send('You must be logged in to comment.');
    }

    const sanitizedBody = sanitizeComment(req.body.body);
    
    const newComment = new Comment({
      post: post._id,
      author: req.user.username || req.user.email,
      body: sanitizedBody,
      sanitizedBody,
      createdAt: Date.now()
    });

    await newComment.save();

    res.redirect(`/post/${post.slug}/comments`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


/**
 * GET /
 * Contact
 */
router.get('/contact', authMiddleware, (req, res) => {

  const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;
  res.render('contact', {
    currentRoute: '/contact',
    layout: PageLayout,
    isLoggedIn: req.isLoggedIn
  });
});

/**
 * POST /
 * Contact
 */
router.post('/contact', authMiddleware, async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;
    
    const newContact = new Contact({
      name,
      email,
      message,
      layout: PageLayout,
      currentRoute: '/contact',
      
    });

    await newContact.save();

    res.redirect('/contact?success=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
