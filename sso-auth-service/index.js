const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(express.json());
app.use(session({ secret: process.env.clientSecret, resave: false, saveUninitialized: true }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Here, you can save user profile info to your database
    return done(null, profile);
  }
));

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Send login success email
    sendLoginEmail(req.user.emails[0].value);
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Welcome ${req.user.displayName}`);
    } else {
        res.redirect('/');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        sendLogoutEmail(req.user.emails[0].value); // Send email notification
        res.redirect('/');
    });
});

// Email sending function using nodemailer
const sendLoginEmail = (email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });
    
    const mailOptions = {
        from: process.env.email,
        to: email,
        subject: 'Login Notification',
        text: 'You have successfully logged in!'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};



app.listen(3000, () => console.log('SSO Auth Service is running on port 3000'));
