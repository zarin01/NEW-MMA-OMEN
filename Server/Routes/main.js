const express = require('express');
const router = express.Router();

//Website Header and Description
router.get('', (req, res) => {     
    const locals ={
        title: "MMA OMEN",
        description: "Website Description"
    }    
    res.render('index', { locals });
});

router.get('/about', (req, res) => {         
    res.render('about');
});


module.exports = router;