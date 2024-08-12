require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');

const app = require('express')();
const PORT = 5000 || process.env.PORT;

app.use(express.static('public'));


// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


app.use('/', require('./Server/Routes/main'));



app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});