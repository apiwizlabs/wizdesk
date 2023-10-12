import React, { useEffect, useState } from 'react';
import {EngineeringAPI} from "../../../api/apiConfig"
import BasicLoader from '../../../components/Loader/basicScreenloader';
import Button from 'react-bootstrap/Button';
import UserCard from "./UserCard"

const SupportUsers = () => {

    const [supportUsersList, setSupportUsersList] = useState(null)
    useEffect(()=>{
        (async ()=>{
            const supportUsersResp = await EngineeringAPI.getAllSupportUsers();
            if(supportUsersResp.status === 200){
                setSupportUsersList(supportUsersResp.data.data)
            }
        })()
    },[])

    return (
        <div>
            {!supportUsersList && <BasicLoader />}
            <div className='d-flex g-20 flex-wrap'>
            {supportUsersList && supportUsersList.length > 0 && 
            supportUsersList.map(user => {
                return <UserCard user={user} type={"SUPPORT"} setSupportUsersList={setSupportUsersList} />
            })}
            </div>
            {supportUsersList && supportUsersList.length === 0 && <p>No Users Yet </p>}
            
        </div>
    );
};

export default SupportUsers;