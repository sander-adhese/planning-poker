const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var users = [];
var result = {};

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('username', (username) => {
    users.push(username);
    io.emit('usernames', users);
  });
  
  socket.on('vote', (username, vote) => {
    result[username] = vote;
    if (Object.keys(result).length == users.length) {
      var sum = 0;
      var valids = 0;
      var qMarks = 0;
      var votes = Object.values(result);
      for (index in votes) {
          if (votes[index] !== "?") {
              valids++;
              sum += parseFloat(votes[index]);
          } else {
              qMarks++;
          }
      }
      io.emit('vote-result', (sum / valids).toFixed(1), qMarks);
      result = {};
    } else {
        var voters = Object.keys(result);
        var awaiting = [];
        for (index in users) {
          if (voters.indexOf(users[index]) == -1) {
              awaiting.push(users[index]);
          }
        }
        io.emit('waiting-on', awaiting);
    }
    
});

  socket.on('force-vote', (username) => {
    var sum = 0;
    var valids = 0;
    var qMarks = 0;
    var votes = Object.values(result);
    for (index in votes) {
        if (votes[index] !== "?") {
            valids++;
            sum += parseFloat(votes[index]);
        } else {
            qMarks++;
        }
    }
    io.emit('vote-result', (sum / valids).toFixed(1));
    result = {};
    console.log(username + ' forced the votes!');        
  });

  socket.on('exit', (username) => {
    while (users.indexOf(username) > -1) {
        users.splice(users.indexOf(username), 1);
    }
    io.emit('usernames', users);
  });
  
  socket.on('clear', (username) => {
    result = {};
    io.emit('vote-cleared');
    console.log(username + ' cleared the votes!');
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});