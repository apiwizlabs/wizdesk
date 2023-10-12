import React, { useEffect, useState } from 'react';
import {EngineeringAPI} from "../../../api/apiConfig"
import BasicLoader from '../../../components/Loader/basicScreenloader';
import Button from 'react-bootstrap/Button';
import UserCard from './UserCard';
import {MagnifyingGlass } from "@phosphor-icons/react";


const ClientUsers = () => {
    const [clientUsersList, setClientUsersList] = useState(null)
    const [filteredClientUsersList, setFilteredClientUsersList] = useState(null)
    useEffect(()=>{
        (async ()=>{
            const clientUsersResp = await EngineeringAPI.getAllClientUsers();
            if(clientUsersResp.status === 200){
                setClientUsersList(clientUsersResp.data.data)
                setFilteredClientUsersList(clientUsersResp.data.data)
            }
        })()
    },[])
    useEffect(()=>{
        setFilteredClientUsersList(clientUsersList)
    },[clientUsersList])

    const handleSearch = (value) => {
        if(value !== ""){
            setFilteredClientUsersList(clientUsersList.filter(user => user.name.toLowerCase().includes(value.toLowerCase()) || user.organizationId.name.toLowerCase().includes(value.toLowerCase())  ))
        }else{
            setFilteredClientUsersList(clientUsersList)
        }
    }


    return (
        <div>
              { clientUsersList?.length > 0 && <div className='d-flex justify-content-end'>
                    <div className='d-flex align-items-center position-relative'>
                        <MagnifyingGlass size={18} className='position-absolute searchicon' />
                        <input className='searchbox' onChange={(e)=> handleSearch(e.target.value)} placeholder='Search Clients'/>
                    </div>
                </div>}
                
            {!clientUsersList && <BasicLoader />}
            
            <div className='d-flex g-20 flex-wrap'>
                {filteredClientUsersList && filteredClientUsersList.length > 0 && 
                filteredClientUsersList.map(user => {
                    return <UserCard user={user} type={"CLIENT"} setClientUsersList={setClientUsersList} />
                })}
            </div>
            {clientUsersList && clientUsersList.length === 0 && <p>No Users Yet </p>}
    </div>
    );
};

export default ClientUsers;