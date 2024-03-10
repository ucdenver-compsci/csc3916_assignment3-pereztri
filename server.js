/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});




router.post('/movies', authJwtController.isAuthenticated, function(req, res)
{
    if (!req.body.title || !req.body.actors || req.body.actors.length === 0)
    {
        res.status(400).send({success: false, message: 'The movie does not contain the required infromation. It is missing a title, release date, genre, or actors.' });
    } 
    else 
    {
        var movie = new Movie(req.body);
        movie.save(function(err)
        {
            if (err)
            {
                res.send(err);
            }
            else
            {
                res.json({success: true, message: 'Movie created!' });
            }
        });
    }
});


router.get('/movies', authJwtController.isAuthenticated, function(req, res)
{
    Movie.find({}, function(err, movies)
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            res.json(movies);
        }
    });
});


router.put('/movies', authJwtController.isAuthenticated, function(req, res)
{
    const { id, ...updateData} = req.body; 

    if (!id) 
    {
        res.status(400).send({success: false, message: 'ID is required in the request body.'});
    }
    Movie.findByIdAndUpdate(id, updateData, {new: true}, function(err, movie)
    {
        if (err)
        {
            res.send(err);
        }
        else if (!movie)
        {
            res.status(404).send({success: false, message: 'Movie not found.'});
        }
        else
        {
            res.json({success: true, message: 'Movie updated! Here is the update:', movie});
        }
    });
});


router.delete('/movies', authJwtController.isAuthenticated, function(req, res)
{
    const {id} = req.body; 

    if (!id) 
    {
        res.status(400).send({success: false, message: 'ID is required in the request body.'});
    }
    Movie.findByIdAndRemove(id, function(err, movie)
    {
        if (err)
        {
            res.send(err);
        }
        else if (!movie)
        {
            res.status(404).send({success: false, message: 'Movie not found.'})
        }
        else
        {
            res.json({success: true, message: 'Movie deleted!'});
        }
    });
});









app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


