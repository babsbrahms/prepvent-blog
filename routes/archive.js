var express = require('express');
var router = express.Router();

var Blog = require('../model/blog')

/* GET users listing. */
router.get('/', function(req, res, next) {
  const {nav} = req.query;
  let current = req.session.archive_number || 0;
  
  if (nav === 'previous' && (current !== 0) ) {
    current = current - 1;
  } else if (nav === 'next') {
    current = current + 1;
  }

  req.session.archive_number = current;
  let limit = 10;
  let skip = limit*current;
  Blog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(function (err, blogs) {
    Blog.distinct('category').exec((errs, categories) => {
      if (err || errs) {
        res.locals.error = req.app.get('env') === 'development' ? err||errs : {};

        res.render('error', { page: 'Blog', message: err.message|| errs.message });
      } else if ((blogs.length === 0) && (current !== 0)) {
        let count = (current > 0)? current - 1 : 0
        req.session.archive_number = count;
        res.redirect('/archive')
      } else {
        res.render('archive', { page: 'Archive', blogs, categories, msg: req.flash('msg'), errors: req.flash('errors'), current_number: current, limit });
      }
    })
  })
});

module.exports = router;
