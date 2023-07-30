import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { io, Socket } from 'socket.io-client';
import Pages from './Routes';
import { ClerkProvider } from '@clerk/clerk-react';

if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const App = () => {
  // console.log(rcvMsg);

  return (
    <>
      <ClerkProvider publishableKey={clerkPubKey}>
        <Pages />
      </ClerkProvider>
    </>
  );
};

export default App;
