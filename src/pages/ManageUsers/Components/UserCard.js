import React, { useState } from 'react';
import {EngineeringAPI} from "../../../api/apiConfig";
import BasicLoader from '../../../components/Loader/basicScreenloader';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useOutletContext } from 'react-router-dom';

const UserCard = ({user, type, setClientUsersList, setSupportUsersList}) => {

    const [lockLoading, setLockLoading] = useState(false)
    const [deleteLoading, setDeleteloading] = useState(false)
    const [{userType}] = useOutletContext();

    const handleLockUser = async (userId) => {
        const isLockConfirmed = window.confirm("Are you sure you want to Lock User?")
        if(isLockConfirmed){
        setLockLoading(true)
        await EngineeringAPI.lockUserById(userId);
        if(type === "SUPPORT"){
            const supportUsersResp = await EngineeringAPI.getAllSupportUsers();
            setLockLoading(false)   
            if(supportUsersResp.status === 200){
                setSupportUsersList(supportUsersResp.data.data)
            }
        }else{
            const clientUsersResp = await EngineeringAPI.getAllClientUsers();
            setLockLoading(false)   
            if(clientUsersResp.status === 200){
                setClientUsersList(clientUsersResp.data.data)
            }
        }}
    }

    const handleDeleteUser = async (userId) => {
        const isDeleteConfirmed = window.confirm("Are you sure you want to Delete User?")
        if(isDeleteConfirmed){
            setDeleteloading(true)
            const res = await EngineeringAPI.deleteUserById(userId);
            setDeleteloading(false)

            if(res.status === 200) {
                if(type === "SUPPORT"){
                    const supportUsersResp = await EngineeringAPI.getAllSupportUsers();
                    if(supportUsersResp.status === 200){
                        setSupportUsersList(supportUsersResp.data.data)
                    }
                }else{
                    const clientUsersResp = await EngineeringAPI.getAllClientUsers();
                    if(clientUsersResp.status === 200){
                        setClientUsersList(clientUsersResp.data.data)
                    }
                }
            }
        }
    }

    const handleUnlockUser = async (userId) => {
        setLockLoading(true)
        await EngineeringAPI.unlockUserById(userId);
        if(type === "SUPPORT"){
            const supportUsersResp = await EngineeringAPI.getAllSupportUsers();
            if(supportUsersResp.status === 200){
                setSupportUsersList(supportUsersResp.data.data)
                setLockLoading(false)
            }
        }else{
            const clientUsersResp = await EngineeringAPI.getAllClientUsers();
            if(clientUsersResp.status === 200){
                setClientUsersList(clientUsersResp.data.data)
                setLockLoading(false)
            }
        }
    }
    
    return (
        <div key={user._id} className='user-card-wrapper flex-column d-flex g-10'>
        {type === "SUPPORT" ?  
                <>
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Name</p>
                    <p className='value'>{user.name}</p>
                </div>
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Email</p>
                    <p className='value'>{user.email}</p>
                </div>
            </>  :
            <>
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Name</p>
                    <p className='value'>{user.name}</p>
                </div>
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Email</p>
                    <p className='value'>{user.email}</p>
                </div>
                <div className='d-flex flex-column'>
                    <p className='label md-txt'>Organisation</p>
                    <p className='value'>{user.organizationId.name}</p>
                    <p className='f-600 md-txt'>{user.organizationId.workspaceName}</p>
                </div>
                {/* <Button variant="primary" className='mt-3' size="sm" onClick={()=>handleLockUser(user._id)}>Lock User</Button> */}
             </> }

             {  userType === "ADMIN USER" && user.type !== "ADMIN USER" &&
             (deleteLoading ? <Button disabled variant="danger" className='mt-1' size="sm">Loading <Spinner size="sm" /></Button> 
             : (user.isDeleted ? 
                <p>[User has been Deleted]</p> :
                    <Button onClick={()=>handleDeleteUser(user._id)} variant="outline-danger" className='mt-3' size="sm">Delete User</Button>) )
                 }
             
             {  userType === "ADMIN USER" && user.type !== "ADMIN USER" && !user.isDeleted && (lockLoading ? 
                 <Button disabled variant="primary" className='mt-1' size="sm">Loading <Spinner size="sm" /></Button>   : 
                 user?.isLocked ?
                 <Button onClick={()=>handleUnlockUser(user._id)} variant="primary" className='mt-1' size="sm">Unlock User</Button> :
                 <Button onClick={()=>handleLockUser(user._id)} variant="primary" className='mt-1' size="sm">Lock User</Button>) }
        </div>
       
    )
};

export default UserCard;