import './App.css';
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import Login from './pages/Authentication/Login';
import InviteExpiredPage from './pages/Info/inviteExpired';
import NotFoundPage from './pages/Info/notFound';
import TicketsPage from "./pages/Tickets";
import ResetPage from "./pages/Authentication/Reset";
import ProfilePage from "./pages/Profile";
import ManageUsersPage from "./pages/ManageUsers";
import { PrivateRoutes } from './components/PrivateRoutes';
import { ClientRoutes } from './components/ClientRoutes';
import 'bootstrap/dist/css/bootstrap.min.css';
import SignUp from './pages/Authentication/SignUp';
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ROLES = {
  "Client": "CLIENT USER",
  "Support": "SUPPORT USER",
  "Admin" : "ADMIN USER"
}

function App() {

  if(window.navigator.serviceWorker){
    navigator.serviceWorker.register("/src/sw.js").then(()=>{
      console.log("service worker registered")
    }).catch(err => console.log(err, "Service err"))
    console.log("service werker present");
    // const message = {
    //   type: type,
    //   orgId: orgId,
    //   searchValue: searchValue,
    //   filterState: filterState
    // }

    // console.log(message)
  }
  
    return (
      <div className="App">
        <ToastContainer
        // autoClose={2500}
        closeOnClick
        draggable
        transition={Slide}
        limit={1}
      />
        <Routes>
          <Route element={<PrivateRoutes allowedRoles={[ROLES.Admin, ROLES.Support, ROLES.Client ]} />}>
            <Route element={<ProfilePage />} path="/profile" />
            <Route element={<TicketsPage />} path="/tickets/:orgId" />
          </Route>
          <Route element={<PrivateRoutes allowedRoles={[ROLES.Admin, ROLES.Support ]} />}>
             <Route element={<Home />} path="/" exact />
             <Route element={<ManageUsersPage />} path="/users" />
          </Route>
          <Route element={<Login />} path="/login" />
          <Route element={<SignUp />} path="/signup/:token" />
          <Route element={<ResetPage />} path="/reset/:token" />
          <Route element={<InviteExpiredPage />} path="/expired" />
          <Route path='*' element={<NotFoundPage />}/>
        </Routes>
      </div>
    );
  }

export default App;
