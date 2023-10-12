import React, {useState,useRef} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { read, utils } from "xlsx";
import { TicketsAPI, EmailAPI } from '../api/apiConfig';
import { createJsonFromCsvArr, encryptPassword } from '../utils';
import {useSelector, useDispatch} from "react-redux";
import { useParams } from 'react-router-dom';
import { getOrganisationByIdThunk } from '../app/features/Organisation/AsyncThunks';
import Spinner from 'react-bootstrap/Spinner';
import { isFulfilled } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import { useOutletContext } from 'react-router-dom';
import { parse } from "papaparse";


const ImportTicketsModal = ({toggleShow, setToggleShow}) => {
    const dispatch = useDispatch()
    const { actionStatus, organisationData} = useSelector((state) => state.organisations);
    const [loading, setLoading] = useState(false)
    const [{userEmail}] = useOutletContext()
    const {orgId} = useParams()
    const isValid = useRef(true)

    const handleClose = () => {
        setToggleShow(false)
    }

    const jiraDomainRegex = /^(https?:\/\/)?([a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,})$/;
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    const [jiraUserData, setJiraUserData] = useState({
        domainUrl: "",
        apiKey: "",
        jiraEmail: "",
    })

    const [jiraUserDataError, setJiraUserDataError] = useState({})

    const findValidUser = (type = "support") => {
        if(type==="client"){
            const user = organisationData?.clientUsers.map(user => (user?.isLocked || user?.isDeleted) ? null : user).filter(item => item!== null)[0];
            return user ? user : null;
        }else{
            const user = organisationData?.supportUsers.map(user => (user?.isLocked || user?.isDeleted) ? null : user).filter(item => item!== null)[0]
            return user ? user : null;
        }
    }

    const handleChange=(e) => {
        const {name, value} = e.target;
        setJiraUserData(prev => ({...prev, [name]: value}))
    }

    const validate = (values) => {
        const errors = {};
        Object.keys(values).map(key => {
            if(!values[key]) errors[key] = true;
            if(key === "jiraEmail"){
               if(!emailRegex.test(values[key])){
                    errors[key] = true
               }
            }
            if(key === "domainUrl"){
                if(!jiraDomainRegex.test(values[key])){
                    errors[key] = true
                }
            }
        })
        return errors
      }

    const handleImport = (e, isAttachmentRequired) => {
        const errorsObj = validate(jiraUserData)
        if(Object.keys(errorsObj).length !== 0 && isAttachmentRequired){
            setJiraUserDataError(errorsObj)
            e.target.value = ''
            return;
        }else{
            setJiraUserDataError({})
            const supportUser = findValidUser("support")
            const clientUser = findValidUser("client")



        if(supportUser?.email && clientUser?.email){
            setLoading(true)
            const files = e.target.files;
            if(files.length){
                const file = files[0];

                parse(file, {
                  complete: async (results, file) => {
                    const json = createJsonFromCsvArr(results.data)

                    const res = await TicketsAPI.handleImportTickets({
                      rowsList: json,
                      orgId: orgId,
                      supportUser: supportUser.email,
                      clientUser: clientUser.email,
                      isAttachmentRequired,
                      jiraUserData,
                    })  
                    if(res?.status === 200){
                        toast.success("Tickets are getting imported! Please check your email for status updates", {autoClose: 3000})
                        dispatch(getOrganisationByIdThunk({orgId}))
                    }else{
                        toast.error("Importing Tickets has failed")
                    }
                  }
                })
        }
         }
        else{
            toast.error("you need to have atleast one valid client user and support user.", {autoClose: 2500})
            handleClose()
        }
    }
    }

    return (
        <>
      <Modal show={toggleShow} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Import Tickets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {loading ? 
            <div className='d-flex'>
                {/* <Spinner className='me-3' animation="border" size="sm" /> <p>Importing ...</p> */}
                <p>We are currently importing your tickets.<br/> Please check your email to get updates on its status.</p>
            </div> 
            :  <Form>
            <Form.Group className="mb-3">
              <Form.Label>Jira Host Domain URL</Form.Label>
              <Form.Control
                placeholder="https://example.atlassian.net"
                autoFocus
                className={jiraUserDataError.domainUrl && "error-field"}
                value={jiraUserData.domainUrl}
                onChange={handleChange}
                name="domainUrl"
              />
            </Form.Group>
            <Form.Group className="mb-3" >
              <Form.Label>Jira Account Email</Form.Label>
              <Form.Control
               value={jiraUserData.jiraEmail}
               onChange={handleChange}
               className={jiraUserDataError.jiraEmail && "error-field"}
               name="jiraEmail"
              placeholder="example@gmail.com" />
            </Form.Group>
            <Form.Group className="mb-3" >
              <Form.Label>API Key</Form.Label>
              <Form.Control  value={jiraUserData.apiKey}
              name="apiKey"
              className={jiraUserDataError.apiKey && "error-field"}
              onChange={handleChange} />
            </Form.Group>
            <Form.Text muted> If you click on the "skip this step and import button" then your tickets will be imported without attachments. </Form.Text>
          </Form>}
         
        </Modal.Body>
        {!loading &&  <Modal.Footer>
          <div className='d-flex justify-content-between'>
            <>
             <label for="import-upload-wo" className="custom-file-upload outline">  Skip this step and Import </label>
             <input style={{display: "none"}} 
             onChange={(e)=>handleImport(e, false)} 
             accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                id="import-upload-wo" type="file"/>
            </>
            <>
             <label for="import-upload" className="custom-file-upload">  Import with Attachments </label>
             <input style={{display: "none"}} 
                onChange={(e)=>handleImport(e, true)} 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                id="import-upload" type="file"/>
            </>
          </div>
        </Modal.Footer>}
       
      </Modal>
    </>
    );
};

export default ImportTicketsModal;