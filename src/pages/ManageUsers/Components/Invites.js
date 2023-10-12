import React, { useEffect, useState } from 'react';
import {EmailAPI, EngineeringAPI} from "../../../api/apiConfig"
import BasicLoader from '../../../components/Loader/basicScreenloader';
import Button from 'react-bootstrap/Button';
import {MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "react-toastify";


const Invites = () => {
    const [invitesList, setInvitesList] = useState(null)
    const [filteredInvitesList, setFilteredInvitesList] = useState(null)
    const searchComparison = (invite, value, field) => {
        return invite[field].toLowerCase().includes(value.toLowerCase())
    }
    const handleSearch = (value) => {
        if(value !== ""){
            setFilteredInvitesList(invitesList.filter(invite => invite?.organizationId?.name.toLowerCase().includes(value.toLowerCase()) || searchComparison(invite, value, "email") || searchComparison(invite, value, "invitedBy")))
        }else{
            setFilteredInvitesList(invitesList)
        }
    }
    useEffect(()=>{
        (async ()=>{
            const invitesResp = await EngineeringAPI.getAllInvitedUsers();
            if(invitesResp?.status === 200){
                setInvitesList(invitesResp.data.data)
                setFilteredInvitesList(invitesResp.data.data)
            }
        })()
    },[])

    const getAllInvites = async () => {
        const invitesResp = await EngineeringAPI.getAllInvitedUsers();
        if(invitesResp?.status === 200){
            setInvitesList(invitesResp.data.data)
            setFilteredInvitesList(invitesResp.data.data)
        }
    }
    
    const handleDisableInvite = async (inviteId) => {
        const resp = await EmailAPI.disableInvite({inviteId})
        if(resp.status === 200){
            getAllInvites()
        }
    }
    const handleEnableInvite = async (inviteId) => {
        const resp = await EmailAPI.enableInvite({inviteId})
        if(resp.status === 200){
            getAllInvites()
        }
    }
    const handleResendInvite = async (inviteId, orgId) => {
        const resp = await EmailAPI.resendInvite(inviteId, orgId)
        if(resp.status === 200){
            toast.success("Your email has been successfully sent!", {autoClose: 3000})
            getAllInvites()
        }
    }

    return (
             <div>
                { invitesList?.length > 0 && <div className='d-flex justify-content-end'>
                    <div className='d-flex align-items-center position-relative'>
                        <MagnifyingGlass size={18} className='position-absolute searchicon' />
                        <input className='searchbox' onChange={(e)=> handleSearch(e.target.value)} placeholder='Search Invites'/>
                    </div>
                </div>}
        {!invitesList && <BasicLoader />}
        <div className='d-flex g-20 flex-wrap'>
        {filteredInvitesList?.length > 0 &&
        filteredInvitesList.map(invite => {
            return (
            <div  key={invite._id} className='user-card-wrapper flex-column d-flex g-10 mt-4 flex-wrap'>     
                
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Invited User</p>
                    <p className='value'>{invite?.email}</p>
                </div>

                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Status</p>
                    <p className='value'>{invite?.userSignedUp ? "Successful" : "Pending"}</p>
                </div>
              
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Organisation</p>
                    <p className='value'>{invite?.organizationId?.name}</p>
                </div>

                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Invited By</p>
                    <p className='value'>{invite?.invitedBy}</p>
                </div>

                {!invite.userSignedUp && 
                <>
                <Button variant="primary" className='mt-2' size="sm" 
                onClick={()=>{
                    if(invite.enabled){
                        handleDisableInvite(invite._id)
                    }else{
                        handleEnableInvite(invite._id)
                    }}}>{invite.enabled ? "Disable" : "Enable"}</Button>
                 
                <Button variant="outline-primary"  size="sm" onClick={()=>handleResendInvite(invite.email, invite.organizationId._id)}>Resend</Button>
                </>}
            </div>)
        })}
        </div>
        {invitesList && invitesList.length === 0 && <p>No Invites Yet </p>}
        
    </div>
    );
};

export default Invites;