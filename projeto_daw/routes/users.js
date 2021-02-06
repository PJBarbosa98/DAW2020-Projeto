const express 	= require('express');
const router 	= express.Router();
const bcrypt 	= require('bcryptjs');
const passport 	= require('passport');
const fs 		= require('fs');
const mongoose 	= require('mongoose');
const JSZip 	= require("jszip");
const FileSaver = require('file-saver');

// User model
const User 			= require('../models/User');

// Article controller
var ArticleCont 	= require('../controllers/Article');
// Article model
var Article 		= require('../models/Article');

// File Upload
const multer 	= require('multer');
const upload 	= multer({ dest: "uploads/" });

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register Handle
router.post('/register', (req, res) => {
	const { name, email, filiation, password, password2 } = req.body;
	let errors = [];

	// Check required fields
	if (!name || !email || !password || !password2) {
		errors.push({ msg: 'Please fill in all fields!'});
	}

	// Check passwords match
	if (password != password2) {
		errors.push({ msg: 'Passwords do not match!' });
	}

	// Check password length
	if (password.length < 6) {
		errors.push({ msg: 'Password should be at least 6 characters!' });
	}

	if (errors.length > 0) {
		res.render('register', {
			errors,
			name,
			email,
			password,
			password2
		});
	} else {
		// Validation passed
		User.findOne({ email: email })
			.then(user => {
				if (user) {
					// User exists
					errors.push({ msg: 'Email is already registered!'});
					res.render('register', {
						errors,
						name,
						email,
						filiation,
						password,
						password2
					});
				} else {
					const newUser = new User({
						name,
						email,
						filiation,
						password
					});

					// Hash Password
					bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt,
						(err, hash) => {
							if (err) throw err;
							// Set password to hashed
							newUser.password = hash;
							// Save user
							newUser.save()
								.then(user => {
									req.flash('success_msg', 'You are now registered!');
									res.redirect('/users/login');
								})
								.catch(err => console.log(err));
						}));
				}
			})
			.catch();
	}
});

// Login handle
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true
	}) (req, res, next);
});

// Logout handle
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success_msg', 'Logged out!');
	res.redirect('/users/login');
});

// New article form
router.get('/new', (req, res) => {
	res.render('new_article_form', {
		name: req.user.name
	});
});

// Post article handle
router.post('/articles', upload.array('deliverables'), (req, res) => {

	var title 			= req.body.title;
	var category 		= req.body.category;
	var author 			= req.user.email;
	var private 		= req.body.private;
	var tags 			= req.body.tags.split(',');
	var date 			= req.body.date;
	var deliverables	= [];
	var comments 		= [];

	let errors 			= [];

	// Remove whitespace from tags
	for (let j = 0; j < tags.length; ++j) {
		tags[j] = tags[j].trim();
	}

	// Check all fields are filled (except date)

	if (!title || !category || !private || !tags) {
		errors.push({ msg: 'Please fill in all fields!'});
	}

	// Check if title already exists
	ArticleCont.title_exists(title)
		.then(num_of_records => {
			if (num_of_records > 0) {
				errors.push({ msg: 'Article already exists!'});
				res.render('new_article_form', {
					name: req.user.name,
					errors
				});
			}
			else {

				// Default date to date of submission (if not filled in)
				if (!date) {
					date = String(new Date().toISOString().substr(0, 10));
				}

				// In case there are any errors...
				if (errors.length > 0) {
					res.render('new_article_form', {
						name: req.user.name,
						errors
					});
				}

				// Otherwise...
				else {

					for (let idx = 0; idx < req.files.length; ++idx) {

						// One folder per author

						let oldPath = __dirname + '/../' + req.files[idx].path;
						let newPath = __dirname + '/../fileStore/' + author + '/' + req.files[idx].originalname;

						let fileDir = __dirname + '/../fileStore/' + author + '/';

						// Create directory, if it does not exist
						if (!fs.existsSync(fileDir)) {

							fs.mkdir(fileDir, { recursive: true }, (err) => {
								if (err)
									throw err;
							});
						}

						fs.rename(oldPath, newPath, function(err) {
							if (err)
								throw err;
						});

						// Add deliverable to deliverables
						deliverables[idx] = req.files[idx].originalname;

					}

					let newArticle = new Article({
						title,
						category,
						author,
						private,
						tags,
						date,
						deliverables,
						comments
					});

					// Insert article information into database
					ArticleCont.insert(newArticle)
						.then( ()  => res.redirect('/dashboard'))
						.catch(err => res.render('error', { error_message: 'Cannot insert article!' }));
				}

			}
		})
		.catch(err => {
			res.render('error', { error_message: 'Article with that title already exists!' });
		});


});

// Delete article from database
router.get('/delete/:title', (req, res) => {

	// Fetch title
	var parts = req.url.split('/');
	var title = decodeURI(parts[parts.length - 1]);

	// Delete by title
	ArticleCont.delete_by_title(title)
		.then( ()  => res.redirect('/dashboard'))
		.catch(err => res.render('error', { error_message: 'Cannot delete article!' }));
});


// Edit article
router.get('/edit/:title', (req, res) => {

	// Fetch title
	var parts = req.url.split('/');
	var title = decodeURI(parts[parts.length - 1]);

	ArticleCont.fetch_by_title(title)
		.then(article => {
			res.render('article_edit', {
				name: req.user.name,
				article: article
			});
		})
		.catch(err => res.render('error', { error_message: 'Cannot fetch article!' }));
});

// Post edit article (actually a PUT request)
router.post('/edit/articles', upload.array('deliverables'), (req, res) => {

	var title 			= req.body.title;
	var category 		= req.body.category;
	var author 			= req.user.email;
	var private 		= req.body.private;
	var tags 			= req.body.tags.split(',');
	var date 			= req.body.date;
	var deliverables	= [];
	var comments 		= [];

	let errors 			= [];

	// Remove whitespace from tags
	for (let j = 0; j < tags.length; ++j) {
		tags[j] = tags[j].trim();
	}

	// Check all fields are filled (except date)

	if (!title || !category || !private || !tags) {
		errors.push({ msg: 'Please fill in all fields!'});
	}

	// Default date to date of submission (if not filled in)
	if (!date) {
		date = String(new Date().toISOString().substr(0, 10));
	}

	// In case there are any errors...
	if (errors.length > 0) {
		ArticleCont.count()
			.then(number_of_articles => {

				// Fetch the user's articles
				ArticleCont.fetch_articles(req.user.email)
					.then(articles => {
						res.render('dashboard', {
							errors,
							name: req.user.name,
							number_of_articles: number_of_articles,
							articles: articles
						})
					})
					.catch(err_2 => res.render('error', { error_message: 'Cannot fetch articles'}));
			})
			.catch(err => res.render('error', { error_message: 'Cannot load articles!' }));
	}
	// Otherwise...
	else {

		// Push older articles into 'deliverables'
		ArticleCont.fetch_by_title(title)
			.then(data => {
				for (let j = 0; j < data.deliverables.length; ++j) {
					deliverables.push(data.deliverables[j]);
				}

				// New deliverables
				for (let idx = 0; idx < req.files.length; ++idx) {
					
					let oldPath = __dirname + '/../' + req.files[idx].path;
					let newPath = __dirname + '/../fileStore/' + author + '/' + req.files[idx].originalname;

					let fileDir = __dirname + '/../fileStore/' + author + '/';

					// Create directory, if it does not exist
					if (!fs.existsSync(fileDir)) {
						fs.mkdir(fileDir, { recursive: true }, (err) => {
							if (err)
								throw err;
						});
					}
					
					fs.rename(oldPath, newPath, function(err) {
						if (err)
							throw err;
					});

					// Add deliverable to deliverables
					deliverables.push(req.files[idx].originalname)
				}

				let newArticle = new Article({
					title,
					category,
					author,
					private,
					tags,
					date,
					deliverables,
					comments
				});

				// Put article in database
				ArticleCont.delete_by_title(title)
					.then( ()  => {
						ArticleCont.insert(newArticle)
							.then( ()  => {
								// Redirect to dashboard
								res.redirect('/dashboard');
							})
							.catch(err => { error_message: 'Put Error!' });
					})
					.catch(err => { error_message: 'Put error!' });

			})
			.catch(err => res.render('error', { error_message: 'You cannot change article title!'}));

	}

});

// Download an article
router.get('/download/:title', (req, res) => {

	// Fetch title from URL
	var parts = req.url.split('/');
	var title = decodeURI(parts[parts.length - 1]);

	// Fetch article from title
	ArticleCont.fetch_by_title(title)
		.then(article => {

			// Fetch deliverables' directory
			var deliverables 	= article.deliverables;
			var directories 	= [];

			for (let i = 0; i < deliverables.length; ++i) {
				directories.push(__dirname + '/../fileStore/' + article.author + '/' + deliverables[i]);
			}

			var zip = new JSZip();
			zip.file("metadata.txt", JSON.stringify(article));
			
			for (let i = 0; i < directories.length; ++i) {
				let dataBuffer = fs.readFileSync(directories[i], 'binary');
				zip.file(deliverables[i], dataBuffer, { binary: true });
			}

			zip
			.generateNodeStream({type:'nodebuffer',streamFiles:true})
			.pipe(fs.createWriteStream('out.zip'))
			.on('finish', function () {
			    // JSZip generates a readable stream with a "end" event,
			    // but is piped here in a writable stream which emits a "finish" event.
			    //console.log("out.zip written.");
			    res.download(__dirname + '/../out.zip');
			});


		})
		.catch(err => { error_message: 'Cannot fetch article!' });

});

// User's profile page
router.get('/:email', (req, res) => {

	// Fetch user email from URL
	var parts = req.url.split('/');
	var email = parts[parts.length - 1];

	// Fetch user from user email
	User.find({ "email": email })
		.then(data => {

			var user = data[0];

			// Fetch user articles
			ArticleCont.fetch_public_articles(user.email)
				.then(art => {
					res.render('user_page', { user, art });

				})
				.catch(err => {
					res.render('error', { error_message: 'Cannot fetch user articles!' });
				});

		})
		.catch(err => {
			res.render('error', { error_message: 'Cannot fetch user!' });
		});

});

// Get article page
router.get('/article/:title', (req, res) => {

	// Fetch title from url (URI to decode special characters)
	var parts = req.url.split('/');
	var title = decodeURI(parts[parts.length - 1]);

	// Fetch article from title
	ArticleCont.fetch_by_title(title)
		.then(art => {
			// Display
			res.render('article_page', { article: art });
		})
		.catch(err => {
			res.render('error', { error_message: 'Cannot fetch article!' });
		});
});

// Add comment to article (post request)
router.post('/article/:title', (req, res) => {

	// Build JSON for comment
	var comment = '';

	comment += '{ "body" : "';
	comment += req.body.body;
	comment += '", "byWho" : "';
	comment += req.user.email + '" }';

	// Fetch title from URL
	var parts = req.url.split('/');
	var title = decodeURI(parts[parts.length - 1]);

	console.log(title);
	// Fetch article
	ArticleCont.fetch_by_title(title.trim())
		.then(article => {
			// Update it (add comment to 'comments' parameter)
			article.comments.push(JSON.parse(comment));

			ArticleCont.add_comment(article.title, article.comments)
				.then( () => {
					res.redirect('/users/article/' + article.title);
				})
				.catch(error => { error_message: 'Put error!' });
		})
		.catch(err => {
			console.log(err);
			res.render('error', { error_message: 'Cannot fetch article!' });
		});
});

module.exports 	= router;