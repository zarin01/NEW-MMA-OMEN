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
        nextPage: hasNextPage ? nextPage : null,
        currentRoute: '/'
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
            description: "Website Description",
            currentRoute: `/post/${slug}`
        }

    res.render('post', {
        locals,
        data
    });
    } catch (error){
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
        title: "Seach",
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
        currentRoute: '/'
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
      currentRoute: '/about'
    });
  });
  
  



module.exports = router;