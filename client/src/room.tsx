import {
  RedirectToSignIn,
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Socket, io } from 'socket.io-client';

const validUsers = ['kinmod', 'ducky'];

const user = 'kinmod';
let socket: Socket;

const Room = () => {
  const { roomid } = useParams();

  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [rcvMsg, setRcvMsg] = useState<Array<string>>([]);

  const { isLoaded, isSignedIn, user } = useUser();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<Array<any>>([]);

  useEffect(() => {
    if (user !== undefined) {
      const isUserValid = async () => {
        setLoading(true);
        console.log('here');
        const res = await fetch(`/api/${roomid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: JSON.stringify({ userid: user?.id }),
        });

        //   const res = isUserValid();
        console.log(res);
        if (res.status === 200) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
        setLoading(false);
        if (res.status === 200) {
          socket = io('http://localhost:5000', { autoConnect: false });

          socket.onAny((event, ...args) => {
            console.log(event, args);
          });

          const sessionID = localStorage.getItem('sessionID');
          if (sessionID) {
            //   socket.auth = { sessionID };
            socket.auth = {
              userId: user?.id,
              sessionId: sessionID,
              name: user?.firstName,
              roomid,
            };
            socket.connect();
          }
          socket.on('session', ({ sessionID, userID }) => {
            // attach the session ID to the next reconnection attempts
            socket.auth = {
              userId: user?.id,
              sessionId: sessionID,
              name: user?.firstName,
              roomid,
            };
            // store it in the localStorage
            localStorage.setItem('sessionID', sessionID);
            // save the ID of the user
            (socket as any).userID = userID;
          });
          socket.auth = {
            userId: user?.id,
            sessionId: sessionID,
            name: user?.firstName,
            roomid,
          };
          socket.connect();

          socket.on('connect_error', (err) => {
            if (err.message === 'invalid id') {
              console.log('here');
              setAllowed(false);
            }
          });

          socket.on('users', (users) => {
            users.forEach((usr: any) => {
              //   setRcvMsg((prev) => [`${usr.name} joined`, ...prev]);
              usr.self = usr.userID === socket.id;
            });
            users = users.sort((a: any, b: any) => {
              if (a.self) return -1;
              if (b.self) return 1;
              if (a.username < b.username) return -1;
              return a.username > b.username ? 1 : 0;
            });
            setUsers(users);
          });

          socket.on('user connected', (user) => {
            console.log('here');
            setUsers((prev) => [...prev, user]);
          });

          socket.on('chat message add', ({ msg, name }) => {
            console.log('recieved', msg, name);
            setRcvMsg((prev) => [`${name} : ${msg}`, ...prev]);
          });

          socket.on('user disconnected', ({ userid, name }) => {
            console.log('recieved', userid, name);
            // const usrs = users;
            // usrs.splice(
            //   usrs.findIndex((usr) => usr.userID === user?.id),
            //   1
            // );
            // console.log(usrs);
            setUsers((usrs) =>
              usrs.splice(
                usrs.findIndex((usr) => usr.userID === user?.id),
                1
              )
            );
            setRcvMsg((prev) => [`${name} left`, ...prev]);
          });
          return () => {
            socket.off('new user ok');
            socket.off('connect_error');
            socket.off('chat message add');
            socket.off('join');
            socket.off('user disconnected');

            socket.disconnect();
          };
        }
      };
      isUserValid();
    }
  }, [isSignedIn, roomid, user]);

  const handleButtonClickMessage = () => {
    socket.emit('new chat message', { message, roomid });
    console.log(message);
    setMessage('');
  };

  //   console.log(users);
  return (
    <>
      {!loading && (
        <>
          {user && `Hi ${user.emailAddresses}`}

          {!isSignedIn ? <SignInButton /> : <SignOutButton />}

          {allowed && (
            <SignedIn>
              <div>
                online :{' '}
                {users.map((usr, idx) => {
                  return <p key={idx}>{usr.name}</p>;
                })}
              </div>
              <input
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={handleButtonClickMessage}>Send message</button>
              {rcvMsg.map((msg, idx) => {
                return <p key={idx}>{msg}</p>;
              })}
            </SignedIn>
          )}
          {!allowed && <p>You are not allowed to be here fool</p>}
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </>
      )}
      {loading && <p>Page loading please wait</p>}
    </>
  );
};

export default Room;
