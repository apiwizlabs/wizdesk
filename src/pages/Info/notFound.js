import React, { useState, useEffect } from 'react';
import jwt_decode from "jwt-decode";


const NotFoundPage = () => {
    const [userNav, setUserNav] = useState('/')
    useEffect(()=>{
        try{
            const isNotExpired = jwt_decode(localStorage.getItem('userToken')).exp * 1000 > Date.now()
            const token = jwt_decode(localStorage.getItem('userToken'))
            if(isNotExpired && token.type === "CLIENT USER" && token.orgId){
                setUserNav(`/tickets/${token.orgId}`)
            }else{
                setUserNav('/')
            }
        }catch(err){
            console.log(err)
            window.open('/login')
        }
    },[])
    return (
        <div className='w-100 h-100 d-flex flex-column justify-content-center align-items-center'>
            <h1 className='primary-header mt-5'>
                Error 404. Page Not Found.
            </h1>
            <div>
                <a href={userNav}>Back To Home Page</a>
            </div>
        </div>
    );
};

export default NotFoundPage;