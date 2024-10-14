const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const adminLayout = '../views/layouts/admin';
const mainLayout = '../views/layouts/main';


/**
 * Check Login middleware
 */

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.isLoggedIn = false; // User is not logged in
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;

    // Fetch user from the database
    const user = await User.findById(req.userId);

    // If the user exists, they are logged in
    req.isLoggedIn = !!user;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    req.isLoggedIn = false; // If there's an error (invalid token, etc.), consider the user not logged in
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
      title: "NodeJs Blog",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    };

    let perPage = 10;
    let page = req.query.page || 1;

    const lastPosts = await Post.find().sort({ createdAt: -1 }).limit(5);
   
    const ufcPosts = await Post.find({ categories: /UFC/ }).sort({ createdAt: -1 }).limit(5);
    const mmaPosts = await Post.find({ categories: /MMA/ }).sort({ createdAt: -1 }).limit(5);
    

    const latestPosts = await Post.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    const PageLayout = req.isLoggedIn ? adminLayout : mainLayout;

    res.render('index', { 
      locals,
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

  const locals = {
    title: "Admin",
    description: "Simple Blog created with NodeJs, Express & MongoDb."
  };

  res.render('admin/index', { locals, currentRoute: '/log-in', isLoggedIn: req.isLoggedIn });
});




/**
 * POST /
 * Admin - Check Login
*/
router.post('/log-in', async (req, res) => {
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

    // Redirect to the homepage
    res.redirect('/'); // Redirect to the homepage after logging in

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});






/**
 * GET /
 * Post :id
*/
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    }

    res.render('post', { 
      locals,
      data,
      currentRoute: `/post/${slug}`,
      isLoggedIn: req.isLoggedIn
    });
  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /
 * Post - searchTerm
*/
router.post('/search', async (req, res) => {
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
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about',
    isLoggedIn: req.isLoggedIn
  });
});



/**
 * GET / User
 * Log In - Register
*/
router.get('/register', (req, res) => {
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
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
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
      // Other internal errors
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
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});




module.exports = router;
