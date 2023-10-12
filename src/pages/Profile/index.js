import React, {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { useDispatch, useSelector} from "react-redux";
import { useNavigate } from 'react-router-dom';
import jwt_decode from "jwt-decode";
import { EngineeringAPI } from '../../api/apiConfig';
import { getOrganisationByIdThunk } from '../../app/features/Organisation/AsyncThunks';
import BasicLoader from '../../components/Loader/basicScreenloader';
import { ArrowRight } from "@phosphor-icons/react";
import { toTitleCase } from '../../utils';
import { ArrowUpRight } from "@phosphor-icons/react";


const ProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { actionStatus, organisationData } = useSelector((state) => state.organisations);
    const [showOrg, setShowOrg] = useState(false)
    // const [showOrgList, setShowOrgList] = useState(false)
    const [orgDetails, setOrgDetails] = useState({loading: true, data: null})
    const [userDetails, setUserDetails] = useState({loading: true, data: null})
    const [userDetailsError, setUserDetailsError] = useState({})

    useEffect(()=>{
        const token = localStorage.getItem("userToken")
        if (token) {
            const decoded = jwt_decode(token);
            (async () => {
              const res =  await EngineeringAPI.getUserByEmail(decoded.email)
              if(res.status === 200 && res.data.data){
                const {email, name, phone} = res.data.data
                const nameLen = name?.split(" ").length
                let userDetails = {
                  email: email,
                  phone: phone,
                  }
                if(nameLen > 1){
                  userDetails = {
                      firstName: name.split(" ").slice(0, -1).join(" "),
                      lastName: name.split(" ")[nameLen - 1],
                      ...userDetails }
                  } else{
                      userDetails = {
                          firstName: name,
                          lastName: "",
                          ...userDetails
                      }
                  }
              if(decoded.type !== "CLIENT USER"){
                const {assignedOrganisations} = res.data.data
                userDetails = {...userDetails, orgList: assignedOrganisations}
            }
              setUserDetails({loading: false, data: {...userDetails}})
              }
            })()
            if(decoded.orgId){
                setShowOrg(true)
                dispatch(getOrganisationByIdThunk({orgId: decoded.orgId}))
            }
        }
    },[])

    useEffect(()=>{
        if(organisationData && organisationData?.name){
            setOrgDetails({loading: false, data: organisationData})
        }
    },[organisationData])

    const [profileEditMode, setProfileEditMode] = useState(false)
    const handleProfileUpdate = async () => {
        const errorObject = validate(userDetails.data)
        if(Object.keys(errorObject).length === 0){
            setUserDetailsError({})
            setUserDetails(prev => ({...prev, loading: true}))
            const {firstName, lastName, phone} = userDetails.data;
           const res = await EngineeringAPI.updateUserByEmail(userDetails.data.email, {name: firstName + " " + lastName, phone: phone} )
           if(res.status=== 200 && res.data.data){
            const resp =  await EngineeringAPI.getUserByEmail(userDetails.data.email)
            if(resp.status === 200 && resp.data.data){
              const {email, name, phone, assignedOrganisations} = resp.data.data;
              const nameLen = name?.split(" ").length
              let userDetails = {
                email: email,
                phone: phone,
                orgList: assignedOrganisations,
                }
              if(nameLen > 1){
                userDetails = {
                    firstName: name.split(" ").slice(0, -1).join(" "),
                    lastName: name.split(" ")[nameLen - 1],
                    ...userDetails }
                } else{
                    userDetails = {
                        firstName: name,
                        lastName: "",
                        ...userDetails
                    }
                }
                setUserDetails({loading: false, data: {...userDetails}})
                setProfileEditMode(false)
             }
           }
        }else{
            setUserDetailsError(errorObject)
        }
      
    }

    const handleChange = ( e) => {
        const {name, value} = e.target;
        setUserDetails(prev => ({data: {...prev.data, [name]: value}}))
    }

    const validate = (values) => {
        const errors = {};
        Object.keys(values).map(key => {
          if(key === "firstName" || key === "lastName"){
            if(!values[key]) errors[key] = true;
          }
        })
        return errors
      }

    
    return (
        <div className='w-50 m-auto mt-5 pt-4'>
            <h1 className='header-1'>My Profile</h1>
            {userDetails.loading && <BasicLoader />}
            {!userDetails.loading && userDetails.data && 
            <div className='profile-details-wrapper mt-4'>
                <div className='d-flex justify-content-between'>
                <p className="mb-4">Personal Information</p>
                <div>
                    {profileEditMode &&  <Button className='me-2' onClick={()=>setProfileEditMode(false)} variant="secondary" size="sm">Cancel</Button> }
                    { !profileEditMode && <Button style={{height: "30px"}} variant="outline-dark" size="sm" onClick={()=>setProfileEditMode(true)}>Edit Profile</Button>}
               { profileEditMode && <Button style={{height: "30px"}} variant="outline-dark" size="sm" onClick={()=>handleProfileUpdate()}>Update Profile</Button>}
                </div>
                </div>
                <Container>
                    <Row>
                        <Col xs={6} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>First Name</Form.Label>
                                <Form.Control
                                name="firstName"
                                 onChange={handleChange}
                                className={userDetailsError.firstName ? "error-field w-100" : "w-100"} 
                                style={{  height: "2.7rem"}} 
                                value={userDetails.data.firstName} 
                                disabled={!profileEditMode}  />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>Email Address</Form.Label>
                                <Form.Control
                                className='w-100' 
                                disabled={true} value={userDetails.data.email} style={{  height: "2.7rem"}} />
                            </Form.Group>
                        </Col>
                        <Col xs={6} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>Last Name</Form.Label>
                                <Form.Control
                                name="lastName"
                                onChange={handleChange} 
                                className={userDetailsError.lastName ? "error-field w-100" : "w-100"} 
                                disabled={!profileEditMode} value={userDetails.data.lastName} style={{  height: "2.7rem"}} 
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>Contact Number</Form.Label>
                                <Form.Control
                                name="phone"
                                onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} 
                                onChange={handleChange} 
                                className='w-100' disabled={!profileEditMode}
                                value={userDetails.data.phone} 
                                 style={{ height: "2.7rem"}} type="number" />
                            </Form.Group>
                        </Col>
                    </Row>
                </Container>
            </div> }
            {showOrg && orgDetails.loading === true && <BasicLoader />}
            {showOrg && orgDetails.loading === false && orgDetails.data &&
            <div className='profile-details-wrapper mt-4'>
                <div className='d-flex justify-content-between'>
                    <p className="mb-4">Organisation Information</p>
                    <p onClick={()=>window.open("https://www.apiwiz.io/support", '_blank')} 
                    className='cursor primary-color-text md-txt'>Visit Apiwiz Support Docs <ArrowRight className='primary-color-text' size={18} /></p>
                </div>
                <Container>
                    <Row>
                        <Col xs={6} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'> Name</Form.Label>
                                <Form.Control className='w-100' value={orgDetails.data.name} disabled style={{  height: "2.7rem"}} type="email" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'> Website Link</Form.Label>
                                <Form.Control className='w-100' value={orgDetails.data.website} disabled style={{  height: "2.7rem"}} type="email" />
                            </Form.Group>
                        </Col>
                        <Col xs={6} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>Workspace Name</Form.Label>
                                <Form.Control className='w-100' value={orgDetails.data.workspaceName} disabled style={{  height: "2.7rem"}} type="email" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className='bold-600'>Plan Type</Form.Label>
                                <Form.Control className='w-100' value={toTitleCase(orgDetails.data.plan)} disabled style={{  height: "2.7rem"}} type="email" />
                            </Form.Group>
                        </Col>
                    </Row>
                </Container>
            </div>}
            {!userDetails.loading && userDetails?.data?.orgList && 
            <div className='profile-details-wrapper mt-4'>
                <div className='d-flex justify-content-between'>
                    <p className="mb-4">Assigned Organisations</p>
                    <p onClick={()=>window.open("https://www.apiwiz.io/support", '_blank')} 
                    className='cursor primary-color-text md-txt'>Visit Apiwiz Support Docs <ArrowRight className='primary-color-text' size={18} /></p>
                </div>
                <Container>
                    {userDetails.data.orgList.length > 0 ? userDetails.data.orgList.map(org => 
                    <Row>
                        <Form.Group className="mb-3 d-flex g-10 align-items-center">
                            <Form.Control className='w-100' value={org.name} disabled style={{  height: "2.7rem"}} type="email" />
                            <ArrowUpRight onClick={()=>navigate(`/tickets/${org._id}`)} className='primary-color cursor' size={22} />
                        </Form.Group>
                    </Row>) : <p>No Organisations Assigned Yet</p>}
                    
                </Container>
            </div>}

           
        </div>
    );
};

export default ProfilePage;