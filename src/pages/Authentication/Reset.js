import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { EngineeringAPI} from '../../api/apiConfig'
import { encryptPassword } from '../../utils';
import jwt_decode from "jwt-decode";
import AuthIllustration from "../../assets/auth-illustration.png"
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import { toast } from 'react-toastify';
import { Eye, EyeSlash, ArrowLeft} from "@phosphor-icons/react";
import { passwordRegex } from '../../utils';

const Reset = () => {
    const {token} = useParams();
    const [password, setPassword] = useState("")
    const [rePassword, setRePassword] = useState("")
    const [passwordError, setPasswordError] = useState(false)
    const navigate = useNavigate()
    const [passwordShow1, setPasswordShow1] = useState(false)
    const [passwordShow2, setPasswordShow2] = useState(false)

    useEffect(()=>{
        let dateNow = new Date();
        try{
            if(jwt_decode(token).exp < (dateNow.getTime() / 1000)){
                navigate('/expired')
            }
        }catch(err){
            navigate('/expired')
        }
    }, [token])

    const handleResetPswd = async () => {
        if(password.length > 0 && passwordRegex.test(password)){
            let dateNow = new Date();
            if(jwt_decode(token).exp < (dateNow.getTime() / 1000)){
                navigate('/expired')
            }
        }else{
            setPasswordError(true)
        }
    }

    return (
        <div className='login-page-wrapper'>
            <div className='auth-img-wrapper'>
                <img src={AuthIllustration}  className="img-fluid" />
            </div>
           <div className='login-form-wrapper'>
                <img className='mt-5 pt-3' src={ApiwizLogo} style={{width:"45px"}} />
                <h1 className='primary-header mt-4 bold-700'>Reset Password</h1>
                <Form className='mt-4 w-80'>

                    <Form.Group className="mb-3">
                        <Form.Label className='bold-600'>Email</Form.Label>
                        <Form.Control style={{  height: "2.7rem"}} 
                        // value={jwt_decode(token).emailId} 
                        disabled
                         type="email" placeholder="Enter Your Registered Email Address" />
                    </Form.Group>
                    <Form.Group className="mb-3 position-relative">
                    {passwordShow1 ? <Eye onClick={()=>setPasswordShow1(false)} size={22} className='position-absolute password-eye cursor' />  : <EyeSlash onClick={()=>setPasswordShow1(true)} size={22} className='position-absolute password-eye cursor' />}
                        <Form.Label className='bold-600'>New Password</Form.Label>
                        <Form.Control style={{  height: "2.7rem"}} value={password}  onChange={(e)=>{
                            setPassword(e.target.value)
                        }} 
                        type={passwordShow1 ? "text" : "password"} 
                        placeholder="Password" />
                     {passwordError && <p className='error-txt md-txt'>password must contain atleast one number, one special character, one alphabet and be longer than 5 characters</p>}
                    </Form.Group>
                    <Form.Group className="mb-3 position-relative">
                    {passwordShow2 ? <Eye onClick={()=>setPasswordShow2(false)} size={22} className='position-absolute password-eye cursor' />  : <EyeSlash onClick={()=>setPasswordShow2(true)} size={22} className='position-absolute password-eye cursor' />}
                        <Form.Label className='bold-600'>Re-enter Password</Form.Label>
                        <Form.Control style={{  height: "2.7rem"}} value={rePassword}  onChange={(e)=>{
                            setRePassword(e.target.value)
                        }} 
                        type={passwordShow2 ? "text" : "password"} 
                        placeholder="Password" />
                    </Form.Group>

                    <div className='d-flex flex-column justify-content-center mt-4'>
                        <Button 
                        onClick={(e)=>{
                            e.preventDefault()
                            handleResetPswd()
                        }} 
                        disabled={(password !== rePassword) || password === ""} className='text-center w-100' variant="primary" type="submit">
                            Reset Password
                        </Button>
                        <div onClick={()=>navigate('/login')} className='d-flex cursor d-center mt-4'> <ArrowLeft size={23} className="me-2"/> <p>Back To Login</p></div>
                    </div>
                   
                </Form>
            </div>
            
        </div>
    );
};

export default Reset;
