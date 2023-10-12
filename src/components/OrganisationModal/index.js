import React, { useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Select from 'react-select'
import { isFulfilled } from "@reduxjs/toolkit";
import { useDispatch} from "react-redux";
import { EngineeringAPI, TicketsAPI} from '../../api/apiConfig'
import {updateOrganisationThunk, createOrganisationThunk, getOrganisationsThunk} from '../../app/features/Organisation/AsyncThunks'
import Spinner from 'react-bootstrap/Spinner';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const AddOrgModal = ({showModal, setShowModal, orgToEdit}) => {
  const dispatch = useDispatch();
 
      const orgInitState =  {
        name: "",
        website: "",
        workspaceName: "",
        plan: "GROWTH",
        supportUsers: [],
        emailDomains: "",
        logo: "",
        idPrefix:"",
    }
    const [organisationData, setOrganisationData] = useState(orgInitState);
    const [organisationDataErrors, setOrganisationDataErrors] = useState({});
    const [allSupportUsers, setAllSupportUsers] = useState([])
    const [loadingState, setLoadingState] = useState(false)
    const [orgLogo, setOrgLogo] = useState(null);
    const [emailDomainError, setEmailDomainError] = useState(false);
    const domainRegex = /^([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;
    const websiteLinkRegex = /^(http:\/\/|https:\/\/)?(www\.)?[a-zA-Z0-9]+\.[a-zA-Z]{2,}([a-zA-Z0-9\/#]+)?$/;
    

    useEffect(()=>{
        if(showModal){
            const fetchSupportUsers = async () => {
                const supportUsers = await EngineeringAPI.getAllSupportUsers();
                const formattedUserOptions = supportUsers.data.data.reduce((acc, curr)=>{
                  if(curr.type !== "ADMIN USER" && !curr.isDeleted && !curr.isLocked){
                    const option = {value: curr._id, label: curr.email.split("@")[0]}
                    return [...acc, option ]
                  } return [...acc]
                }, [])
                setAllSupportUsers(formattedUserOptions)
            }
            fetchSupportUsers().catch(console.error);
        }
        if(orgToEdit){
          const formattedUserOptions = orgToEdit.supportUsers.reduce((acc, curr)=>{
            const option = {value: curr._id, label: curr.email.split("@")[0]}
            return [...acc, option ]
        }, [])
        let formattedEmailDomains = orgToEdit.emailDomains[0];
        if(orgToEdit.emailDomains.length > 1){
          formattedEmailDomains = orgToEdit.emailDomains.join(" ,")
        }
          setOrganisationData( {name: orgToEdit.name, workspaceName:orgToEdit.workspaceName, website: orgToEdit.website, plan: orgToEdit.plan, supportUsers: formattedUserOptions, emailDomains: formattedEmailDomains, idPrefix: orgToEdit.idPrefix })
        }
    },[showModal])

    const handleClose = () => {
      setOrganisationData(orgInitState);
      setShowModal(prev => ({...prev, display: false}))};

    const handleOrgCreation = async (logoData) => {
      const domainList = organisationData.emailDomains.split(",").map(domain => domain.trim()).filter(domain => domainRegex.test(domain))
      if(orgToEdit){
        const updatedOrgData = logoData ? await dispatch(updateOrganisationThunk({orgBody: {...organisationData, logoImage: {fileKey: logoData} , emailDomains: domainList}, orgId: orgToEdit._id})) : await dispatch(updateOrganisationThunk({orgBody: {...organisationData, emailDomains: domainList}, orgId: orgToEdit._id}))
        if(isFulfilled(updatedOrgData)){
          dispatch(getOrganisationsThunk())
        }
        setLoadingState(false)
        handleClose()
      }else{
        if(websiteLinkRegex.test(organisationData.website) && domainList.length > 0){
        const addedOrgData = logoData ?  await dispatch(createOrganisationThunk({orgBody: {...organisationData, logoImage: {fileKey: logoData}, emailDomains: domainList}})) : await dispatch(createOrganisationThunk({orgBody: {...organisationData, emailDomains: domainList}}))
        if(isFulfilled(addedOrgData)){
          dispatch(getOrganisationsThunk())
        }
        setLoadingState(false)
        handleClose()}
      }
    }

    const handleSubmit = async () => {
      const errorObject = validate(organisationData)
      if(Object.keys(errorObject).length === 0){
        setLoadingState(true)
        if(orgLogo){
          const resp = await TicketsAPI.uploadImage(orgLogo)
          if(resp.data.data){
            handleOrgCreation(resp.data.data)
          }
        }else{
          handleOrgCreation()
        }
      }else{
        setOrganisationDataErrors(validate(organisationData))
      }
    }

    const handleChange = (e)=>{
      const {name, value} = e.target;
      if(name === "idPrefix"){
        setOrganisationData({...organisationData, [name]: value.substring(0,4).toUpperCase()})
      }else{
        setOrganisationData({...organisationData, [name]: value})
      }
    }

    const validate = (values) => {
      setEmailDomainError(false)
      const errors = {};
      Object.keys(values).map(key => {
        if(key === "name" || key === "idPrefix" || key === "emailDomains" || key === "plan" || key === "workspaceName" || key === "website"){
          if(!values[key]) errors[key] = true;
        }else if( key=== "supportUsers"){
          if(values.supportUsers.length == 0) errors.supportUsers = true;
        }if(key === "website"){
          const websiteLinkRegex = /^(http:\/\/|https:\/\/)?(www\.)?[a-zA-Z0-9]+\.[a-zA-Z]{2,}([a-zA-Z0-9\/#]+)?$/;
          if(!websiteLinkRegex.test(values[key])){
            errors[key] = true
          }
        }if(key === "emailDomains" && values["emailDomains"]){
          const domainList = values[key].split(",").map(domain => domain.trim()).filter(domain => domainRegex.test(domain))
          if(domainList <= 0){
            errors[key] = true;
          }
          // else if(domainList.some(el => el === "itorix.com" || el === "apiwiz.com")){
          //   errors[key] = true
          //   setEmailDomainError(true)
          // }
        }
      })
      return errors
    }

    const onSelectFile = e => {
      if (!e.target.files || e.target.files.length === 0) {
          return
      }
      setOrgLogo(e.target.files[0])
  }


    return (
        <Modal backdrop="static" show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{orgToEdit ? "Edit Organisation" : "Create Organisation" }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingState ? 
          <div className='d-flex d-center'>
          <Spinner animation="border" /> </div> :
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Organisation Name</Form.Label>
              <Form.Control
                className={organisationDataErrors.name && "error-field"}
                type="text"
                name="name"
                placeholder="Enter Organisation Name"
                value={organisationData.name}
                onChange={handleChange}
                autoFocus
              />
            </Form.Group>
            <Row>
              <Col xs={12} md={7}>
              <Form.Group className="mb-3">
                <Form.Label>Workspace Name</Form.Label>
                <Form.Control
                className={organisationDataErrors.workspaceName && "error-field"}
                name="workspaceName"
                  type="text"
                  onChange={handleChange}
                  placeholder="Enter Workspace Name"
                  value={organisationData.workspaceName}
                />
              </Form.Group>
              </Col>
              <Col xs={12} md={5}>
              <Form.Group className="mb-3">
                <Form.Label>ID Key Name</Form.Label>
                <Form.Control
                  className={organisationDataErrors.idPrefix && "error-field"}
                  name="idPrefix"
                  type="text"
                  onChange={handleChange}
                  placeholder="Short ID Prefix"
                  value={ organisationData.idPrefix}
                />
              </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Email Domains</Form.Label>
              <Form.Control
              name="emailDomains"
              className={organisationDataErrors.emailDomains && "error-field"}
                type="text"
                onChange={handleChange}
                placeholder="Example: xyz.org, apiwiz.com"
                value={organisationData.emailDomains}
              />
              {emailDomainError && <p className='error-txt md-txt'>itorix and apiwiz domains cannot be used here</p>}
            </Form.Group>   
            <Form.Group className="mb-3" >
              <Form.Label>Website Link</Form.Label>
              <Form.Control
              name="website"
                type="text"
                className={organisationDataErrors.website && "error-field"}
                placeholder="www.example.com"
                value={organisationData.website}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group
              className="mb-3">
              <Form.Label aria-label="Select">Choose Plan Type</Form.Label>
              <Form.Select 
              name="plan"
              onChange={handleChange}
              className={organisationDataErrors.plan && "error-field"}
              value={organisationData.plan}
              >
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
              </Form.Select>
            </Form.Group>
            <Form.Group
              className="mb-3">
              <Form.Label aria-label="Select">Select Primary Support Users</Form.Label>
              <Select
                value={organisationData.supportUsers}
                isMulti
                name="supportUsers"
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: organisationDataErrors.supportUsers ? 'red' : 'grey',
                  }),
                }}
                onChange={(chosenOption)=> setOrganisationData(prev=> ({...prev, supportUsers: chosenOption}))}
                options={allSupportUsers}
                className="basic-multi-select"
                classNamePrefix="select"
                />
            </Form.Group>
            <Form.Group className="mb-3 d-flex align-items-center">
              <label htmlFor="file-upload" className="custom-file-upload-org">
                  Upload Logo
              </label>
              <input id="file-upload" accept="image/*" onChange={onSelectFile} className='visually-hidden' type="file"/>
              <p className='custom-file-input-org'>{orgLogo?.name || ""}</p>
            </Form.Group>
          </Form> }
        </Modal.Body>
       {!loadingState && <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>}
      </Modal>
    );
};

export default AddOrgModal;