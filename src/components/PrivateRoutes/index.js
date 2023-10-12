import React, {useEffect, useState} from 'react';
import {Outlet, Navigate, useNavigate} from 'react-router-dom'
import jwt_decode from "jwt-decode";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import { EngineeringAPI } from '../../api/apiConfig';

const PrivateRoutes = ({allowedRoles}) => {
    let auth = {'token': localStorage.getItem('userToken')}
    const navigate = useNavigate();
    const userInitState = {
        userEmail: "",
        userType:"",
        orgId: ""
    }
    const [currUser, setCurrUser] = useState(userInitState);
    const [userName, setUserName] = useState("")
    const isNotExpired = auth.token && jwt_decode(localStorage.getItem('userToken')).exp * 1000 > Date.now()
    const decoded = auth.token && jwt_decode(auth.token)

    const handleLogout = () => {
        localStorage.removeItem('userToken')
        setCurrUser(userInitState)
        navigate('/login')
    }

    useEffect(()=>{
        if(auth.token && isNotExpired){
            const decoded = auth.token && jwt_decode(auth.token)
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
        }else{
            navigate('/login')
        }
    },[])

    return (
        auth.token && isNotExpired && allowedRoles.includes(decoded.type) ?
        <div>
                <Navbar bg="light">
                <Container>
                    <Navbar.Brand href={decoded.type === "CLIENT USER" ? `/tickets/${decoded.orgId}` : "/"}>
                        <img alt="apiwiz logo" src={ApiwizLogo} width="25" height="25" className='me-2' /> 
                        Wizdesk
                    </Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        {userName ? (
                            <Navbar.Text className='me-4'>
                                Signed in as: <a href="/profile">{userName}</a>
                            </Navbar.Text>
                        ) : decoded.type === "ADMIN USER" ?    
                        <Navbar.Text className='me-4'>
                        Signed in as: <a href="/profile">Admin</a>
                    </Navbar.Text> : null}
                    <Navbar.Text className='cursor' onClick={handleLogout}>
                        Logout
                    </Navbar.Text>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Outlet context={[currUser, setCurrUser]}/> 
        </div>
       : <Navigate to='/notfound'/>
    );
};

export {PrivateRoutes};