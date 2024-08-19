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

    let perPage = 10;
    let page = parseInt(req.query.page) || 1;

    const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    const count = await Post.countDocuments();
    const nextPage = page + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', {
        locals,
        data,
        current: page,
        nextPage: hasNextPage ? nextPage : null
    });
    } catch (error){
        console.log(error);
    }

});




//Get Post Id
router.get('/post/:id', async (req, res) => {   
    try{

    let slug = req.params.id;
    const data = await Post.findById({ _id: slug})

    const locals ={
            title: data.title,
            description: "Website Description"
        }

    res.render('post', {
        locals,
        data
    });
    } catch (error){
        console.log(error);
    }

});




//Post Search
router.post('/search', async (req, res) => {   
    try{

    const locals ={
            title: 'Search',
            description: "Website Description"
    }

    let searchTerm = req.body.searchTerm;

    console.log(searchTerm);

    res.send(searchTerm);
    } catch (error){
        console.log(error);
    }

});



router.get('/about', (req, res) => {         
    res.render('about');
});


module.exports = router;