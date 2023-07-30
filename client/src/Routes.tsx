import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Room from './room';
import { SignIn, SignUp } from '@clerk/clerk-react';

const Pages = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/sign-in/*"
            element={<SignIn routing="path" path="/sign-in" />}
          />
          <Route
            path="/sign-up/*"
            element={<SignUp routing="path" path="/sign-up" />}
          />
          <Route path="/:roomid" element={<Room />} />
          <Route path="*" element={<>Stop being a weird ass human</>} />
        </Routes>
      </div>
    </Router>
  );
};

export default Pages;
