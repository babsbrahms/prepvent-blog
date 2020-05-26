var express = require('express');
var bcrypt = require('bcrypt');

var router = express.Router();
const { check, validationResult } = require('express-validator');

var Blog = require('../model/blog');
var Newsletter = require('../model/newletter')
var User = require('../model/user')

/* GET home page. */
router.get('/', function(req, res, next) {
  Blog.find({}).sort({ createdAt: -1 }).exec(function (err, blogs) {
    Blog.distinct('category').exec((errs, categories) => {
      if (err || errs) {
        res.locals.error = req.app.get('env') === 'development' ? err||errs : {};

        res.render('error', { page: 'Blog', message: err.message|| errs.message });
      }
      res.render('index', { page: 'Home', blogs, categories, msg: req.flash('msg'), errors: req.flash('errors') });
    })
  })

});


router.post('/newsletter' , [ check('email').isEmail().withMessage('Email is required')], (req, res) => {
  const { email, name } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('errors', errors.array() )
    
    return res.redirect(req.get('referer'))
  }

  Newsletter.create({
    email,
    name
  })
  .then(news => {
    req.flash('msg', 'You have sucessfully subscribe for our newsletter')
    res.redirect(req.get('referer'));
  })
  .catch((err) => {
    res.send(err)
  })
})


router.get('/search', function(req, res, next) {
  let { search } = req.query;
  console.log(search);
  Blog.find({ $text: {$search : search }}, (err, result) => {
    if (err) {
      res.status(400).send({ msg: err.message })
    }
    console.log(result);
    
    res.send({ result })
  })
});


// route for user signup
router.get('/signup', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    req.flash('msg', 'You are already logged in')
    res.redirect('/cms')
  } else {
    res.render('signup', { page: 'Sign Up', msg: req.flash('msg'), errors: req.flash('errors')})
  }
})

router.post('/signup', 
  [
  check('name', 'Name field is required').notEmpty(),
  check('email', 'Email field is required').notEmpty(),
  check('password', 'Password field is requird').notEmpty()], 
  (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('errors', errors.array() )

    return res.redirect(req.get('referer'))
  }

  const user = new User()
  var salt = bcrypt.genSaltSync(10);

  var hash = bcrypt.hashSync(password, salt);
  user.email = email;
  user.password = hash;
  user.save()
  .then(user => {
      console.log('USER:', user);
      console.log('VALUE: ', user.dataValues);
      
      req.flash('msg', 'User Created')
      req.session.user = user;
      res.redirect('/cms');
  })
  .catch(error => {
      
      req.flash('errors', [{ msg: error.message }] )
      res.redirect(req.get('referer'));
  });
  
})


// route for user Login
router.get('/login', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    req.flash('msg', 'You are already logged in')
    res.redirect('/cms')
  } else {
    res.render('login', { page: 'Login', msg: req.flash('msg'), errors: req.flash('errors')})
  }
})


router.post('/login', 
  [check('email', 'Email is required').notEmpty(), check('password','Password is required').notEmpty()],
  (req, res) => {
  const {email, password} = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('errors', errors.array() )

    return res.redirect('/login')
  }

  User.findOne({ email }).then(function (user) {
    if (!user) {
        req.flash('errors', [{ msg: 'User not found. Enter valid credentials.'}] )
        res.redirect('/login');
    } else if (!bcrypt.compareSync(password, user.password)) {
        req.flash('errors', [{ msg: 'Incorrect password'}] )
        res.redirect('/login');
    } else {
      console.log('USER:', user);
      console.log('VALUE: ', user.dataValues);
        req.flash('msg', 'Login successfull')
        req.session.user = user;
        res.redirect('/cms');
    }
  });
})

// route for user logout
router.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        req.flash('msg', "Logout successful")
        res.clearCookie('user_sid');
        req.session.user = null;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

module.exports = router;
