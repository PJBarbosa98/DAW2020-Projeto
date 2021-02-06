const express 					= require('express');
const router 					= express.Router();
const { ensureAuthenticated } 	= require('../config/auth');

// Article controller and model
var Article 					= require('../controllers/Article');
var ArticleModel 				= require('../models/Article');

// User controller and model
// var User 						= require('../controllers/User');
// var UserModel 					= require('../models/User');

// Welcome Page
router.get('/', (req, res) => {

	Article.count()
		.then(data => res.render('welcome', { number_of_articles: data }))
		.catch(err => res.render('error', { error_message: err }));

});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {

	let user_email = req.user.email;
	let user_count;

	// Fetch the user's number of articles
	Article.user_count(user_email)
		.then(data => {

			// Fetch the user's articles
			Article.fetch_articles(user_email)
				.then(articles => {

					res.render('dashboard', {
						name: req.user.name,
						number_of_articles: data,
						articles: articles
					});

				})
				.catch(err_2 => {
					res.render('error', {
						error_message: 'Could not fetch user posts!'
					})
				});
		})
		.catch(err => {
			res.render('error', {
				error_message: 'Could not fetch number of articles!'
			})
		});
});

// Feed (to view articles)
router.get('/feed', ensureAuthenticated, (req, res) => {

	let user_email = req.user.email;

	// If user is ADMIN (see all posts)
	if (user_email == 'admin@admin') {
		Article.fetch_all_articles()
			.then(data => {
				res.render('feed', {
					name: req.user.name,
					posts: data
				});
			})
			.catch(err => {
				res.render('error', { error_message: 'Could not fetch articles!' });
			});
	}
	// Otherwise (see visible posts + his own)
	else {
		Article.fetch_visible_artiles(user_email)
			.then(data => {
				res.render('feed', {
					name: req.user.name,
					posts: data
				});
			})
			.catch(err => {
				res.render('error', { error_message: 'Could not fetch articles!' });
			})
	}


})

module.exports 	= router;