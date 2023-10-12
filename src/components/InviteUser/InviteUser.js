import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { EmailAPI } from '../../api/apiConfig';
import { Trash} from "@phosphor-icons/react";
import {useSelector} from "react-redux";
import BasicLoader from '../Loader/basicScreenloader';
import { toast } from "react-toastify";

const InviteUser = ({showModal, setShowModal, orgId}) => {

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    const [inviteData, setInviteData] = useState({inviteList: [{inviteEmail: "" }]})
    const { actionStatus, organisationData } = useSelector((state) => state.organisations);

    const handleClose = () => {
        setShowModal(false)
    }

    const handleInvite = async () => {
      const emailList = inviteData.inviteList.map((invitee)=>invitee.inviteEmail.length > 0 && invitee.inviteEmail ).filter(item => item !== false).filter(email => emailRegex.test(email))
     const res = await EmailAPI.inviteUserByOrg({orgId: orgId, inviteEmails: emailList})
      if(res.status === 200){
        const inviteResults = res.data.data;
        const someRejected = inviteResults.some(invite => invite.status === "rejected");
        if(someRejected){
          toast.warning("Some Invites have been rejected")
          for(let i = 0; i < inviteResults.length; i++){
            const el = inviteResults[i]
            if(el.status !== "rejected") continue;
            toast.error(`${el.reason}`, {autoClose : false})
          }
        }else{
          toast.success("All Invites have been successfully sent")
        }
      }else{
        toast.error("Unexpected error occurred while sending invites", {autoClose: 2500});
      }
      handleClose()
    }

    const handleEmailChange = (e, ind) => {
      let _inviteData = {...inviteData}
      _inviteData.inviteList[ind].inviteEmail = e.target.value.trim();
      setInviteData(_inviteData)
    }

    const handleInviteeDelete = (ind) => {
      let _inviteData = {...inviteData}
      _inviteData.inviteList.splice(ind, 1)
      setInviteData( _inviteData)
    }

    const [showDomainList, setShowDomainList] = useState(false)

    return (
        <Modal show={showModal} onHide={handleClose}>
        <Modal.Header className='d-flex justify-content-between position-relative'>
          <Modal.Title>Invite User</Modal.Title>
          <Button onClick={()=>setShowDomainList(prev => !prev)} variant="light">{ showDomainList ? "Hide Domains" : "View Domains"} </Button>
          { showDomainList && 
             <div className='position-absolute domains-list-container'>
              {organisationData.emailDomains.map((domain, i) => <p key={i}>{domain}</p>)}
            </div>}
        </Modal.Header>
        <Modal.Body>
          {actionStatus.getOrganisationById === "loading" && <BasicLoader />}
          {actionStatus.getOrganisationById === "fulfilled" && 
            <>
            <div className='d-flex justify-content-end'>
              <Button onClick={()=>{setInviteData(prev => ({...prev, inviteList: [...prev.inviteList, {inviteEmail: ""}]}))}} size="sm" variant="outline-primary">Add Invitees</Button>
            </div>
           
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                {inviteData.inviteList.map((inviteItem, i) => {
                  return <div key={i} className='d-flex align-items-start'>
                    <Form.Control
                      key={i}
                      type="email"
                      placeholder="name@example.com"
                      autoFocus
                      className='mb-3'
                      value={inviteItem.inviteEmail}
                      onChange={(e)=>{
                        handleEmailChange(e, i)}}
                    />
                    {i !== 0 && <Trash onClick={(e)=>{
                      e.stopPropagation();
                      handleInviteeDelete(i)
                      }} size={22} className="ms-2" /> }
                  </div>
                })}
                
              </Form.Group>
            </Form>
            </>
          }
        
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleInvite}>
            Send Invite
          </Button>
        </Modal.Footer>
      </Modal>
    );
};

export default InviteUser;