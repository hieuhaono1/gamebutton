//Imoport các module thư viện cần thiết
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 6767;

// kHởi tạo nodejs port running tại cổng 6767
http.listen(port, function(){
	console.log('Node Server running @ http://localhost:%d',port);
});


const axios = require('axios');

// var mysql = require('mysql');
var ent = require('ent'); // Blocks HTML characters (security equivalent to htmlentities in PHP)
var request = require('request-promise');  

app.use(express.static('public'));

// Tạo kết nối với database
// var conn = mysql.createConnection({
// 	host: "localhost",
// 	user: "root",
// 	password: "",
// 	database: "gamecms_db"
// });

// Khởi tạo thông báo kết nối trên nodemon khi start server
// conn.connect(function(err){
// 	if(err) throw err;
// 	console.log("Connected!!")
// });


// Route Điều hướng các trang sử dụng express
app.get('/',function(req,res){
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/member',function(req,res) {
	res.send('<h1>This is the dashboard page!</h1>');
});

app.get('/history',function(req,res){
    res.sendFile(__dirname + '/views/history.html');
});

app.get('/top_rank',function(req,res){
    res.sendFile(__dirname + '/views/top_rank.html');
});

app.get('/news',function(req,res){
    res.sendFile(__dirname + '/views/news.html');
});

app.get('/referrent_link',function(req,res){
  res.sendFile(__dirname + '/views/referrent_link.html');
});

app.get('/login',function(req,res){
  res.sendFile(__dirname + '/views/login.html');
});

// Route login facebook
// app.get('/auth/facebook',
//   passport.authenticate('facebook'));

// app.get('/auth/facebook/callback',
// passport.authenticate('facebook', { failureRedirect: '/login' }),
// function(req, res) {
  // Successful authentication, redirect home.
  // res.redirect('/');
// });

// Khởi tạo luồng xử lý socket io
var numUsers = 0;


io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

