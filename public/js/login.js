// passport.use(new FacebookStrategy({
//     clientID: 863725693963905,
//     clientSecret: c9960bb24b0c6dbee0bde294cb244ff2,
//     callbackURL: "http://localhost:6767/auth/facebook/callback",
//     profileFields: ['id', 'displayName', 'photos', 'email','first_name','last_name'],
//     enableProof: true
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));