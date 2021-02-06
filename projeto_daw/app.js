const express 			= require('express');
const expressLayouts 	= require('express-ejs-layouts');
const mongoose 			= require('mongoose');
const flash 			= require('connect-flash');
const session 			= require('express-session');
const passport 			= require('passport');
const fs 				= require('fs');

const app 				= express();
const PORT 				= process.env.PORT || 7710;

// File Upload
const multer 			= require('multer');
const upload 			= multer({ dest: "uploads/" });

// Passport Configuration
require('./config/passport')(passport);

// DB Configuration
const db 				= 'mongodb://127.0.0.1/eLibrary';
// Connect to MongoDb
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() 	=> console.log('Connected to MongoDb...'))
	.catch(err 	=> console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Body Parser
app.use(express.urlencoded({ extended: false }));

// Express Session
app.use(session({
	secret: 			'keyboard cat',
	resave: 			true,
	saveUninitialized: 	true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
	res.locals.success_msg 	= req.flash('success_msg');
	res.locals.error_msg 	= req.flash('error_msg');
	res.locals.error 		= req.flash('error');
	next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));


app.listen(PORT, console.log('Server started on port ' + PORT + '...' ));