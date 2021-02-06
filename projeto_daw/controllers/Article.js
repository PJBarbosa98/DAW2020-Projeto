// Controller for Article

var Article 	= require('../models/Article');
var mongoose 	= require('mongoose');

// Count number of articles in the system.
module.exports.count = () => {
	return Article
		.countDocuments()
		.exec();
};

// Count number of articles by user e-mail.
module.exports.user_count = ( email ) => {
	return Article
		.find({ "author": email })
		.countDocuments()
		.exec();
};

// Fetch user articles via e-mail.
module.exports.fetch_articles = ( email ) => {
	return Article
		.find({ "author": email })
		.sort({ date: 1 })
		.exec();
}

// Fetch public articles via e-mail.
module.exports.fetch_public_articles = (email) => {
	return Article
		.find({ $and: [ { "author" : email }, { "private" : "false" } ] })
		.sort({ "title": 1 })
		.exec();
}

// Insert article into database.
module.exports.insert = ( article ) => {
	var newArticle = new Article(article);
	return newArticle.save();
};

// Check if an article already exists with that title.
module.exports.title_exists = ( title ) => {
	return Article
		.find({ "title": title })
		.countDocuments()
		.exec();
};

// Fetch article by title.
module.exports.fetch_by_title = ( title ) => {
	return Article
		.findOne({ "title": title })
		.exec();
};

// Delete article by title.
module.exports.delete_by_title = ( title ) => {
	return Article
		.deleteOne({ "title": title })
		.exec();
};

// Fetch all articles in the db. (For admin's feed)
module.exports.fetch_all_articles = () => {
	return Article
		.find()
		.sort({ "title": 1 })
		.exec();
};

// Fetch visible articles to a given user.
module.exports.fetch_visible_artiles = ( email ) => {
	return Article
		.find({ $or: [ { "author" : email },{ "private" : "false" } ] })
		.sort({ "title": 1 })
		.exec();
};

// Update article (with comments).
module.exports.add_comment = ( title, comments ) => {
	return Article
		.updateOne({ "title": title }, { "comments": comments } )
		.exec();
};
