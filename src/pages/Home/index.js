import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { isFulfilled } from "@reduxjs/toolkit";
import { useNavigate, useOutletContext } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import BasicLoader from '../../components/Loader/basicScreenloader';
import { PencilSimple, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import OrganisationModal from "../../components/OrganisationModal"
import {
    getOrganisationsThunk,
    deleteOrganisationThunk,
  } from "../../app/features/Organisation/AsyncThunks";
import Badge from 'react-bootstrap/Badge';
import { CSVLink } from "react-csv";
import { TicketsAPI } from '../../api/apiConfig';
import CsvExport from '../Tickets/components/csvExport';

const Home = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [{userType}] = useOutletContext();
    const { actionStatus, organisationList } = useSelector((state) => state.organisations);
    const { fileHeaders } = useSelector((state) => state.tickets);
    const [showAddOrgModal, setShowAddOrgModal] = useState({display: false, org: null})
    const [orgList, setOrgList] = useState(organisationList ? organisationList : null)

    const handleOrgDelete =  async (orgId) => {
        const isDeleteConfirmed = window.confirm("Are you sure you want to proceed?")
        if(isDeleteConfirmed){
           const action = await dispatch(deleteOrganisationThunk({orgId: orgId}))
           if (isFulfilled(action)) {
            dispatch(getOrganisationsThunk());
          }
        }
    }

    const handleOrgEdit = (org) => {
        setShowAddOrgModal({display: true, org: org});
    }


    useEffect(()=>{
        if(userType === "CLIENT USER"){
            navigate(`/notFound`, {replace: true});
        }else{
            if(userType){
                dispatch(getOrganisationsThunk())
            }
         }
    },[userType])

    useEffect(() => {
        setOrgList(organisationList);
      }, [organisationList]);

    const handleSearch = (value) => {
        if(value !== ""){
            setOrgList(organisationList.filter(org => org.name.toLowerCase().includes(value.toLowerCase())))
        }else{
            setOrgList(organisationList)
        }
    }

    // useEffect(()=>{
    //  dispatch(getAllTicketsThunk());  
    // },[])


    return (
        <>
            {(userType === "SUPPORT USER" || userType === "ADMIN USER") && 
             <Container> 
                <div className='d-flex justify-content-between align-items-end g-10 mt-5'>
                <Button onClick={()=>{navigate('/users')}} variant="dark">Manage Users</Button>

                    <div className='d-flex g-10'>
                    <div className='d-flex align-items-center position-relative'>
                      <MagnifyingGlass size={18} className='position-absolute searchicon' />
                    <input className='searchbox'onChange={(e)=> handleSearch(e.target.value)} placeholder='Search Organisations'/>
                    </div>
                    {/* <CsvExport children={"Download Tickets"} filterState={filterState} orgId={orgId} fileHeaders={fileHeaders} /> */}
                    <Button variant="outline-primary ms-3">
                    <CsvExport children={"Download All Tickets"} fileHeaders={fileHeaders} type={"ALL"} />
                    </Button>
                     {/* <CSVLink data={allTicketsData} headers={fileHeaders} filename={'AllTickets.csv'}>
                        <Button variant="outline-primary ms-3">Download All Tickets</Button>
                     </CSVLink>  */}
                    
                    <Button onClick={()=>setShowAddOrgModal({display: true, org: null})} style={{display: "block"}} variant="primary">Create Organisation</Button>
                    </div>
                </div>
                
                <div className='d-flex flex-wrap mt-4'>
                {actionStatus.getOrganisations === "fulfilled" && orgList.length === 0 && (
                    <p>No Organisations found</p>
                    )}
                    {actionStatus.getOrganisations === "loading" && <BasicLoader />}
                    {actionStatus.getOrganisations === "fulfilled" && orgList.length > 0 && (
                         orgList.map(organisation => {
                            return ( 
                            <div key={organisation._id} onClick={()=>navigate(`/tickets/${organisation._id}`)} className='org-card bg-light cursor'>
                             <div className='d-flex justify-content-between'>
                                {organisation.plan === "GROWTH" ?  <Badge bg="success">
                                {organisation.plan}
                             </Badge> :  <Badge bg="warning" style={{"color": "black"}}>
                                {organisation.plan}
                             </Badge> }
                            
                                <div className='d-flex'>
                                <PencilSimple onClick={(e)=>{
                                    e.stopPropagation();
                                    handleOrgEdit(organisation)}} size={22} className="me-1 edit-btn" />
                                {userType === "ADMIN USER" && 
                                <Trash onClick={(e)=>{
                                    e.stopPropagation();
                                    handleOrgDelete(organisation._id)
                                 }} size={22} className="ms-1 delete-btn" />}
                                   </div>
                             </div>
                             {/* {organisation.logoImage ? } */}
                              <p className='title mt-4'> {organisation.name}</p>
                              <hr />
                              <p className='xsm-txt'>SUPPORT</p>
                            <div className='d-flex g-10 mt-1 flex-wrap'>
                            {organisation.supportUsers.map((support, i) =>
                            support?.isLocked || support?.isDeleted ? 
                            <Badge key={i} bg="danger">
                                {support.email.split("@")[0]}
                                </Badge>
                            : <Badge key={i} bg="dark">
                            {support.email.split("@")[0]}
                            </Badge>
                                
                            
                                 
                                )}
                            
                             </div>                      
                          </div> )
                         }) 
                    )}
                </div>
                </Container>}
            {showAddOrgModal.display && <OrganisationModal showModal={showAddOrgModal.display} setShowModal={setShowAddOrgModal} orgToEdit={showAddOrgModal.org} />}
          
        </>
    );
};

export default Home;