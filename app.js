const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const port = process.env.PORT || 8089;
const overide = require('method-override');
const sesion = require('express-session');


app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

app.use(express.urlencoded({ extended: false }));
app.use(overide('_method'));
app.use(sesion({
    secret: 'sdkoda asd',
    resave: true,
    saveUninitialized: true
}));

app.use(require('./routes/index'));
app.use(require('./routes/tracking'));
app.use(require('./routes/users'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, function() {
    console.log('Server is running on port: ' + port);
})
