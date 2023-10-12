import React, {useEffect, useState, } from 'react';
import {Outlet, Navigate, useNavigate} from 'react-router-dom'
import jwt_decode from "jwt-decode";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import { EngineeringAPI } from '../../api/apiConfig';


const ClientRoutes = () => {
    let auth = {'token': localStorage.getItem('userToken')}
    const navigate = useNavigate();
    const [currUser, setCurrUser] = useState({
        userEmail: "",
        userType:"",
        orgId: ""
    });
    const [userName, setUserName] = useState("Admin")
    const isNotExpired = auth.token && jwt_decode(localStorage.getItem('userToken')).exp * 1000 > Date.now();

    const handleLogout = () => {
        localStorage.removeItem('userToken')
        setCurrUser({
            userEmail: "",
            userType: ""
        })
        navigate('/login')
    }


    useEffect(()=>{
        if(auth.token && isNotExpired){
            const decoded = auth.token && jwt_decode(auth.token);
            if(decoded.type !== "ADMIN USER"){
                (async ()=>{
                    const userDetails = await EngineeringAPI.getUserByEmail(decoded.email)
                    if(userDetails.status === 200 && userDetails.data.data){
                        setUserName(userDetails.data.data.name)
                    }
                })()
            }
            if(decoded.type === "CLIENT USER" && decoded.orgId){
                setCurrUser({userEmail: decoded.email, userType : decoded.type, orgId: decoded.orgId})
            }else{
                setCurrUser({userEmail: decoded.email, userType : decoded.type})
            }
        }
    },[])

    return (
        auth.token && isNotExpired ?
        <div>
                <Navbar bg="light">
                <Container>
                    <Navbar.Brand href="/">
                        <img alt="apiwiz logo" src={ApiwizLogo} width="25" height="25" className='me-2' /> 
                        Wizdesk
                    </Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text className='me-4'>
                        Signed in as: <a href="/profile">{userName}</a>
                    </Navbar.Text>
                    <Navbar.Text className='cursor' onClick={handleLogout}>
                        Logout
                    </Navbar.Text>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Outlet context={[currUser, setCurrUser]}/> 
        </div>
       : <Navigate to='/notFound'/>
    );
};

export {ClientRoutes};