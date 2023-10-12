import React, {useEffect, useState} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { EngineeringAPI } from '../../api/apiConfig';
import {encryptPassword, isValidPhonenumber} from "../../utils"
import { toast } from "react-toastify";
import AuthIllustration from "../../assets/auth-illustration.png"
import ApiwizLogo from "../../assets/apiwiz-logo.png"
import { GoogleLogin } from "@react-oauth/google"
import { Eye, EyeSlash} from "@phosphor-icons/react";
import Spinner from 'react-bootstrap/Spinner';
import { passwordRegex } from '../../utils';

const failureCallback = (data) => {
    console.log(data, "error");
    toast.error(`Error: ${data.details}`, {autoClose: 3000});
  };

const SignUp = () => {
    const {token} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [signupData, setSignupData] = useState({
        name: "",
        password: "",
        reEnterPassword: "",
    })
    const [signupError, setSignupError] = useState({
        name: false,
        password: false,
        reEnterPassword: false,
    })

    const handleSignupInput = (evt, field) => {
        setSignupData((prev)=>({
            ...prev, 
            [field]: evt.target.value,
        }))
        if(evt.target.value.length === 0 
            || (field === "password" && !passwordRegex.test(evt.target.value)) 
            || (field === "reEnterPassword" && evt.target.value !== signupData.password)){
            setSignupError(prev => ({
                ...prev,
                [field]: true
            }))
        }else{
            setSignupError(prev => ({
                ...prev,
                [field]: false
            }))
        }
    }

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
        let result;
        setLoading(true)
        let _data = { token: data.credential, inviteToken: token}        
        const loginResponse = await EngineeringAPI.googleSignup(_data);
        if(loginResponse.status === 200){
            handleToken(loginResponse?.data?.data?.token)
        }else{
            setLoading(false)
        }
      };

    const handleRegister = async () => {
        let dateNow = new Date();
        if(jwt_decode(token).exp < (dateNow.getTime() / 1000)){
            navigate('/expired')
        }
        if(!Object.values(signupError).includes(true) && signupData.password && signupData.name){
            setLoading(true)
            const encryptedPassword = encryptPassword(signupData.password)
            const resp = await EngineeringAPI.userSignup({...signupData, password: encryptedPassword, inviteToken: token });
            if(resp.status === 201){
                setLoading(false)
                toast.warning("You have Already Signed Up! Please Login", {autoClose: 3000})
                navigate('/login')
            }
            else if(resp.status === 200){
                handleToken(resp.data.data.token)
            }else{
                setLoading(false)
            }
        }
    }

//uncomment asap
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

    return (
        <div className='login-page-wrapper'>
             <div className='auth-img-wrapper'>
                <img src={AuthIllustration}  className="img-fluid" />
            </div>
            <div className='login-form-wrapper'>
                <img className='mt-5 pt-3' src={ApiwizLogo} style={{width:"45px"}} />
                <h1 className='primary-header mt-4 bold-700'>Sign Up</h1>
                {loading ?  <p className='light'>Signing You Up...</p> :  <p className='light'>to access Wizdesk</p>}
           {loading ? <div className='d-center'><Spinner className='me-3' animation="border" /></div>  : 
           <Form className='mt-5 w-80'>
                <Form.Group className="mb-3">
                    <Form.Label className='bold-600'>Name</Form.Label>
                    <Form.Control className={signupError.name && "error-field"} style={{  height: "2.7rem"}} onChange={(e)=>handleSignupInput(e, "name")} type="text" placeholder="Enter Your Name" />
                </Form.Group>

                <Form.Group className="mb-3 position-relative">
                {showPassword ? 
                <Eye onClick={()=>setShowPassword(false)} size={22} className='position-absolute password-eye cursor' />  : 
                <EyeSlash onClick={()=>setShowPassword(true)} size={22} className='position-absolute password-eye cursor' />}
                    <Form.Label className='bold-600'>New Password</Form.Label>
                    <Form.Control className={signupError.password && "error-field"} style={{  height: "2.7rem"}} onChange={(e)=>handleSignupInput(e, "password")}
                    type={showPassword ? "text" : "password"} placeholder="Enter Password" />
                    {signupError.password && <p className='error-txt md-txt'>password must contain atleast one number, one special character, one alphabet and be longer than 5 characters</p>}
                </Form.Group>

                <Form.Group className="mb-3 position-relative">
                {showPassword2 ? 
                <Eye onClick={()=>setShowPassword2(false)} size={22} className='position-absolute password-eye cursor' />  : 
                <EyeSlash onClick={()=>setShowPassword2(true)} size={22} className='position-absolute password-eye cursor' />}
                    <Form.Label className='bold-600'>Re-Enter Password</Form.Label>
                    <Form.Control className={signupError.reEnterPassword && "error-field"} style={{  height: "2.7rem"}} 
                    onChange={(e)=>handleSignupInput(e, "reEnterPassword")} type={showPassword2 ? "text" : "password"} placeholder="Re-Enter Password" />
                    {signupError.reEnterPassword && <p className='error-txt md-txt'>passwords dont match</p>}
                </Form.Group>
            
                <div className='d-flex justify-content-center mt-4'>
                        <Button 
                        disabled={Object.values(signupError).includes(true) || !signupData.password || !signupData.name}
                        onClick={(e)=>{
                            e.preventDefault()
                            handleRegister()
                            // handleDummySignUp()
                        }} className='text-center w-100' variant="primary" type="submit">
                            Signup
                        </Button>
                    </div>
                        <hr className='my-4' />
                    <div className='d-flex d-center'>
                    <GoogleLogin
                        onSuccess={ResponseGoogle}
                        onError={failureCallback}
                        prompt={"consent"}
                        theme={"filled_blue"}
                        size="medium"
                        useOneTap
                        width="400px"
                        text="signup_with"
                    />
                    </div>
            </Form>}
            </div>
        </div>
    );
};

export default SignUp;