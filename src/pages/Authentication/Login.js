import React, {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google"
import { EngineeringAPI} from '../../api/apiConfig'
import { useNavigate } from "react-router-dom";
import { encryptPassword, isValidPhonenumber } from '../../utils';
import jwt_decode from "jwt-decode";
import AuthIllustration from "../../assets/auth-illustration.png"
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import { Eye, EyeSlash, ArrowLeft} from "@phosphor-icons/react";
import Spinner from 'react-bootstrap/Spinner';
import { passwordRegex } from '../../utils';


  const failureCallback = (data) => {
    console.log(data, "error");
    toast.error(`Error: ${data.details}`, {autoClose: 3000});
  };
  

const Login = () => {

    const navigate = useNavigate();
    const [password, setPassword] = useState("")
    const [invalidDetails, setInvalidDetails ] = useState(false)
    const [forgotPswdState, setForgotPswdState] = useState(false)
    const [email, setEmail] = useState("")
    const [forgotEmail, setForgotEmail] = useState("")
    const [toggleSupportView, setToggleSupportView] = useState(true)
    const [userDetailsError, setUserDetailsError] = useState({})
    const [resetError, setResetError] = useState({})
    const [loading, setLoading] = useState(false);
    const [passwordShow, setPasswordShow] = useState(false);

    const handleToken = (token) => {

        localStorage.setItem("userToken", token);
      
        setTimeout(() => {
            if (localStorage.getItem("userToken")) {
                const decoded = jwt_decode(token)
                if(decoded.type === "CLIENT USER"){
                    setLoading(false)
                    navigate(`/tickets/${decoded.orgId}`)
                }else{
                    setLoading(false)
                    navigate('/')
                }
            }
          }, 1500);

    }

    const ResponseGoogle = async (data) => {
        setLoading(true)
        let _data = { token: data.credential}
        const loginResponse = await EngineeringAPI.loginUser(_data);
        if(loginResponse.status === 200){
            handleToken(loginResponse?.data?.data?.token)
        }else{
            setLoading(false)

        }
      };

      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    const handleDummySignUp = async () => {
        const encryptedPassword = encryptPassword(password);
        const resp = await EngineeringAPI.userRegistrationDummy({email, encryptedPassword, name: "Admin", type: "ADMIN USER"})
        handleToken(resp.data.data.token)
    }

    const handleBasicLogin = async () => {
        console.log(email, password)
        if(emailRegex.test(email) && passwordRegex.test(password)){
        setUserDetailsError({})
        setInvalidDetails(false)
        setLoading(true)
        const encryptedPassword = encryptPassword(password);
        const resp = await EngineeringAPI.basicUserLogin({email, encryptedPassword});
        if(resp.status === 400 || resp.status === 401){
            setLoading(false)
            setInvalidDetails(true)
        }else if(resp.status === 200){
            handleToken(resp.data.data.token)            
        }else{
            setLoading(false);
        }
    }else{
            (!email || !emailRegex.test(email)) ? setUserDetailsError(prev => ({...prev, email: true})) : setUserDetailsError(prev => ({...prev, email: false}));

            (!password || !passwordRegex.test(password)) ? setInvalidDetails(true) : setInvalidDetails(false);

        }
    }

    const handleResetPswd = async () => {
        if(forgotEmail && emailRegex.test(forgotEmail)){
            setResetError({})
            const resp = await EngineeringAPI.resetPassword({emailId: forgotEmail})
            if(resp.status === 200){
                toast.success("Email has been sent!", {autoClose: 3000})
            }
        }else{
            setResetError({email: true})
        }
    }

    useEffect(()=>{
        try{ 
            // if (localStorage.getItem("userToken") && jwt_decode(localStorage.getItem('userToken')).exp * 1000 > Date.now()) {
            //     const decoded = jwt_decode(localStorage.getItem("userToken"))
            //     if(decoded.type === "CLIENT USER"){
            //         navigate(`/tickets/${decoded.orgId}`)
            //     }else{
            //         navigate('/')
            //     }
            // }
        }catch(err){
            console.log(err)
        }
    },[])


    return (
        <div className='login-page-wrapper'>
            <div className='auth-img-wrapper'>
                <img src={AuthIllustration}  className="img-fluid" />
            </div>
            {/* {loading && toast} */}
            {/* {loading && <div className='d-flex'><Spinner className='me-3' animation="border" /> <p>Logging you In ...</p></div>} */}
            {forgotPswdState ? <div className='login-form-wrapper'>
                <img className='mt-5 pt-3' src={ApiwizLogo} style={{width:"45px"}} />
                <h1 className='primary-header mt-4 bold-700'>Forgot Password?</h1>
                <p className='light'>No worries, we'll send you reset instructions.</p>
                <Form className='mt-4 w-80'>
                <Form.Group className="mb-3">
                        <Form.Label className='bold-600'>Email</Form.Label>
                        <Form.Control style={{  height: "2.7rem"}} 
                        className={resetError.email && "error-field"}
                        value={forgotEmail}  
                        onChange={(e)=>{
                            setForgotEmail(e.target.value)
                        }} type="email" 
                        placeholder="Enter Your Registered Email Address" />
                        { resetError.email && <p className='error-txt md-txt mt-1'>Enter a valid email address</p>}
                    </Form.Group>

                    <div className='d-flex flex-column justify-content-center mt-4'>
                        <Button onClick={(e)=>{
                            e.preventDefault()
                            handleResetPswd()
                        }} className='text-center w-100' variant="primary" type="submit">
                            Reset Password
                        </Button>
                        <div onClick={()=>setForgotPswdState(false)} className='d-flex cursor d-center mt-4'> <ArrowLeft size={23} className="me-2"/> <p>Back To Login</p></div>
                    </div>
                   
                </Form>
            </div> : <div className='login-form-wrapper'>
                <img className='mt-5 pt-3' src={ApiwizLogo} style={{width:"45px"}} />
                <h1 className='primary-header mt-4 bold-700'>Sign In</h1>
                {loading ? <p className='light'>Signing You In..</p> : <p className='light'>to access Wizdesk</p>}
                {loading ?  <div className='d-center'><Spinner className='me-3' animation="border" /></div> : <Form className='mt-4 w-80'>
                <Form.Group className="mb-3">
                        <Form.Label className='bold-600'>Email</Form.Label>
                        <Form.Control className={userDetailsError.email && "error-field"} style={{  height: "2.7rem"}}  onChange={(e)=>{
                            setEmail(e.target.value)
                        }} type="email" placeholder="Enter Email" />
                        {userDetailsError.email && <p className='error-txt md-txt mt-1'>Enter a valid email address</p>}
                    </Form.Group>

                    <Form.Group className="mb-3 position-relative">
                    {passwordShow ? <Eye onClick={()=>setPasswordShow(false)} size={22} className='position-absolute password-eye cursor' />  : <EyeSlash onClick={()=>setPasswordShow(true)} size={22} className='position-absolute password-eye cursor' />}
                        <Form.Label className='bold-600'>Password</Form.Label>
                        <Form.Control 
                        // className={userDetailsError.password && "error-field"}
                        style={{  height: "2.7rem"}}  
                        onChange={(e)=>{
                            setPassword(e.target.value)
                        }} 
                        type={passwordShow ? "text" : "password"} 
                        placeholder="Password" />
                        {/* {userDetailsError.password && <p className='error-txt'>password must contain atleast one number, one special character, one alphabet and be longer than 5 characters</p>} */}

                    </Form.Group>
                    <div className='d-flex justify-content-between'>
                        <p className='error-txt md-txt'>{invalidDetails && "Invalid Credentials Please try again."}</p>
                        <p onClick={()=>setForgotPswdState(true)} className='cursor bold-600 primary-color-text'>Forgot Password?</p>
                    </div>
                    <div className='d-flex justify-content-center mt-4'>
                        <Button onClick={(e)=>{
                            e.preventDefault()
                            handleBasicLogin()
                            console.log("LOGIN")
                            // handleDummySignUp()
                        }} className='text-center w-100' variant="primary" type="submit">
                            Login
                        </Button>
                    </div>
                        <hr className='my-4' />
                    
                    <div className='d-flex d-center '>
                    <GoogleLogin
                        onSuccess={ResponseGoogle}
                        onError={failureCallback}
                        prompt={"consent"}
                        theme={"filled_blue"}
                        size="medium"
                        useOneTap
                        width="400px"
                    />
                    </div>
                </Form>}
            </div>}
            
        </div>
    );
};

export default Login;