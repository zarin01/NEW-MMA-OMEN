const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const adminLayout = '../views/layouts/admin'
const jwtsecret = process.env.JWT_SECRET;


// Admin / Login Page
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "Admin",
            description: "Blog Description"
        }

        res.render('admin/index', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
})



// Admin / Check Login
router.post('/admin', async (req, res) => {
    try {

        const {username, password} = req.body;

        const user = await User.findOne({username});

        if(!user){
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const token = jwt.sign({ userId: user._id}, jwtsecret );
        res.cookie('token', token, { httpOnly: true});

        res.redirect('/dashboard');

        
    } catch (error) {
        console.log(error);
    }
});


// Admin / Check Login
router.post('/admin', async (req, res) => {
    res.render('admin/dashboard');
});

// Admin / Register
router.post('/register', async (req, res) => {
    try {
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword});
            res.status(201).json({ message: 'User Created', user});
        } catch (error) {
            if(error.code === 11000){
                res.status(409).json({ message: 'User already in use'});
            }
            res.status(500).json({ message: 'Internal server error'});
        }
        


        
    } catch (error) {
        console.log(error);
    }
})


module.exports = router;