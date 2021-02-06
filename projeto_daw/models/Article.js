const mongoose 		= require('mongoose');

const ArticleSchema = new mongoose.Schema({
	title: {
		type: 		String,
		required: 	true
	},
	category: {
		type: 		String,
		required: 	true
	},
	author: {
		type: 		String,
		required: 	true
	},
	private: {
		type: 		String,
		required: 	true
	},
	tags: {
		type: 		[ String ],
		required: 	false
	},
	date: {
		type: 		Date,
		default: 	Date.now
	},
	deliverables: {
		type: 		[ String ],
		required: 	true
	},
	comments: {
		type: 		[ { body: String, byWho: String } ],
		required: 	true
	}
});

const Article 		= mongoose.model('Article', ArticleSchema);

module.exports 		= Article;