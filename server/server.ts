import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import getDB from './utils/db';

import InMemorySessionStore from './sessionStore';
const sessionStore = new InMemorySessionStore();

import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

app.use(express.json());
app.use(express.urlencoded());

app.get('/api', (req, res) => {
  res.json({ users: ['user1', 'user2', 'user3'] });
});

app.post('/api/:roomid', async (req, res) => {
  //   console.log(req.body);
  const db = await getDB();

  const users = await db.execute({
    sql: 'SELECT * FROM roomUser WHERE ROOMID = ?',
    args: [req.params.roomid],
  });

  let flag = 0;

  for (let i = 0; i < users.rows.length; i++) {
    if (users.rows[i].userId === req.body.userid) {
      flag = 1;
      break;
    }
  }
  // console.log(flag);
  if (!flag) {
    res.status(401).json({ msg: 'User Unauthorised' });
  } else {
    res.json({ msg: 'Welcome to the club' });
  }
});

io.use((socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;
  // console.log(socket.handshake.auth);
  if (sessionId) {
    const session = sessionStore.findSession(sessionId);
    if (session) {
      (socket as any).sessionID = sessionId;
      (socket as any).userID = session.userID;
      (socket as any).roomId = session.roomId;
      (socket as any).name = session.name;
      return next();
    }
  }

  const id = socket.handshake.auth.userId;
  const name = socket.handshake.auth.name;
  const roomId = socket.handshake.auth.roomid;
  // console.log(socket.handshake.auth);
  if (!id) {
    return next(new Error('invalid id'));
  }
  (socket as any).sessionID = randomId();
  (socket as any).userID = id;
  (socket as any).roomId = roomId;
  (socket as any).name = name;
  next();
});

io.on('connection', (socket) => {
  console.log('A user connected');
  sessionStore.saveSession((socket as any).sessionID, {
    userID: (socket as any).userID,
    name: (socket as any).name,
    roomid: (socket as any).roomId,
    connected: true,
  });

  socket.join((socket as any).roomId);

  const users: Array<{ userID: string; name: string }> = [];
  for (let [id, socket] of io.of('/').sockets) {
    users.push({
      userID: (socket as any).userID,
      name: (socket as any).name,
    });
  }

  socket.emit('users', users);

  socket.emit('session', {
    sessionID: (socket as any).sessionID,
    userID: (socket as any).userID,
  });

  socket.on('disconnect', async () => {
    const matchingSockets = await io.in((socket as any).userID).fetchSockets();
    console.log(matchingSockets);
    const isDisconnected = matchingSockets.length === 0;
    if (isDisconnected) {
      // notify other users
      // socket.broadcast.emit('user disconnected', {
      //   userid: (socket as any).userID,
      //   name: (socket as any).name,
      // });
      // update the connection status of the session
      sessionStore.saveSession((socket as any).sessionID, {
        userID: (socket as any).userID,
        name: (socket as any).name,
        roomid: (socket as any).roomId,
        connected: false,
      });
    }
    io.sockets.in((socket as any).roomId).emit('user disconnected', {
      userid: (socket as any).userID,
      name: (socket as any).name,
    });
  });

  socket.broadcast.emit('user connected', {
    userID: (socket as any).userID,
    name: (socket as any).name,
  });
  //   socket.on('init', () => {
  //     console.log('init', socket.id);
  //   });

  socket.on('new chat message', (msg) => {
    console.log('message : ' + msg);
    io.sockets.in((socket as any).roomId).emit('chat message add', {
      msg: msg.message,
      name: (socket as any).name,
    });
  });

  // socket.on('disconnect', () => {
  //   console.log('User disconnected');
  // });
});

server.listen(5000, () => {
  console.log('Server started on Port:5000');
});
