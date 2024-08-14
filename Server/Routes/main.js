const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

//Website Header and Description
router.get('', async (req, res) => {   
    try{

        const locals ={
            title: "MMA OMEN",
            description: "Website Description"
        }

        const data = await Post.find();
        res.render('index', {locals, data});
    } catch (error){
        console.log(error);
    }

    res.render('index', { locals });
});

//
//function insertPostData (){
//    Post.insertMany([
//    {
//        title: "Building blog",
//        body: "Body Text"
//    }
//])
//}
//




router.get('/about', (req, res) => {         
    res.render('about');
});


module.exports = router;