import React, { useEffect, useState, useMemo } from 'react';
import Pagination from './pagination';
import {useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { Spinner, Table } from "react-bootstrap";
import { PencilSimple, Trash, Link, Broom, MagnifyingGlass, Question} from "@phosphor-icons/react";
import Container from 'react-bootstrap/Container';
import InviteUser from '../../components/InviteUser/InviteUser';
import TicketModal from '../../components/TicketModal';
import { isFulfilled } from "@reduxjs/toolkit";
import { toTitleCase } from '../../utils';
import { useSearchParams } from "react-router-dom";
import { getOrganisationByIdThunk } from '../../app/features/Organisation/AsyncThunks'
import { getViewsThunk } from '../../app/features/Views/AsyncThunks';
import { deleteTicketByIdThunk, getTicketsByOrgThunk } from '../../app/features/Ticket/AsyncThunks';
import { useDispatch, useSelector} from "react-redux";
import BasicLoader from '../../components/Loader/basicScreenloader';
import { toast } from "react-toastify";
import AddViewModal from '../../components/ViewModal/AddViewModal';
import ViewModal from '../../components/ViewModal';
import Form from 'react-bootstrap/Form';
import FilterSelect from './components/FilterSelect';
import { ToolTip } from '../../components/Tooltip';
import { TicketsAPI } from '../../api/apiConfig';
import ImportTicketsModal from '../../components/ImportTicketsModal';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import CsvExport from './components/csvExport';
import Badge from 'react-bootstrap/Badge';

const TicketsPage = () => {
    const {orgId} = useParams();
    const [currUser] = useOutletContext()
    const [searchParams, setSearchParams] = useSearchParams();
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showTicketModal, setShowTicketModal] = useState(false)
    const [showFilter, setShowFilter] = useState(false);
    const [showManageFilter, setShowManageFilter] = useState(false);
    const [orgData, setOrgData] = useState(null)
    const [ticketsByOrgData, setTicketsByOrgData] = useState(null)
    const dispatch = useDispatch();
    const { actionStatus, organisationData } = useSelector((state) => state.organisations);
    const { viewsData, actionStatus : viewActionStatus } = useSelector((state) => state.views);
    const {fileHeaders, orgTicketsData } = useSelector((state) => state.tickets);
    const initFilterState = {priority: [], type: [], assignee: [], status: [] }
    const [filterState, setFilterState] = useState(initFilterState);
    const [customFilterState, setCustomFilterState] = useState(initFilterState)
    const [orgLogo, setOrgLogo] = useState(null)
    const [showImportModal, setShowImportModal] = useState(false)
    const PageSize = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const [toggleSupport, setToggleSupport] = useState(false)

    const copyLinkToClip = async (ticketid) => {
      await navigator.clipboard.writeText(window.location.href + "?ticketId=" + ticketid);
      toast.success("Copied Ticket Link To Clipbaord!", {autoClose: 3000})
    }


    const getTicketsAfterAction = (actionType) => {
      if(actionType === "CREATE"){
        setFilterState(initFilterState)
      }else{
        let body = {orgId, pageLimit : PageSize, currentPage, searchValue, }
        if(filterState.type.length > 0 || customFilterState.type.length > 0 )  body.type = [...new Set([...filterState.type, ...customFilterState.type])].toString()
        if(filterState.priority.length > 0 || customFilterState.type.length > 0) body.priority = [...new Set([...filterState.priority, ...customFilterState.priority])].toString()
        if(filterState.status.length > 0 || customFilterState.type.length > 0) body.status = [...new Set([...filterState.status, ...customFilterState.status])].toString()
        if(filterState.assignee.length > 0 || customFilterState.type.length > 0) body.assignee = [...new Set([...filterState.assignee, ...customFilterState.assignee])].toString()
        dispatch(getTicketsByOrgThunk(body))
      }
    }

    const handleTicketDelete = async (ticketid) => {
      const isDeleteConfirmed = window.confirm("Are you sure you want to proceed?")
      if(isDeleteConfirmed){
        const deletedTicket = await dispatch(deleteTicketByIdThunk({ticketId: ticketid, orgId: orgId }))
        if(isFulfilled(deletedTicket)){
          getTicketsAfterAction()
          toast.success("Ticket Deleted Successfully")
        }
      }
    }

    const [customViewState, setCustomViewState] = useState(JSON.stringify(initFilterState))

    useEffect(()=>{
     
      let body = {orgId, pageLimit : PageSize, currentPage: 1, searchValue }
      if(filterState.type.length > 0 || customFilterState.type.length > 0 )  body.type = [...new Set([...filterState.type, ...customFilterState.type])].toString()
      if(filterState.priority.length > 0 || customFilterState.priority.length > 0) body.priority = [...new Set([...filterState.priority, ...customFilterState.priority])].toString()
      if(filterState.status.length > 0 || customFilterState.status.length > 0) body.status = [...new Set([...filterState.status, ...customFilterState.status])].toString()
      if(filterState.assignee.length > 0 || customFilterState.assignee.length > 0) body.assignee = [...new Set([...filterState.assignee, ...customFilterState.assignee])].toString()
      dispatch(getTicketsByOrgThunk(body))
    },[searchValue, filterState, customFilterState])

    useEffect(()=>{

      let body = {orgId, pageLimit : PageSize, currentPage: currentPage, searchValue }
      if(filterState.type.length > 0 || customFilterState.type.length > 0 )  body.type = [...new Set([...filterState.type, ...customFilterState.type])].toString()
      if(filterState.priority.length > 0 || customFilterState.priority.length > 0) body.priority = [...new Set([...filterState.priority, ...customFilterState.priority])].toString()
      if(filterState.status.length > 0 || customFilterState.status.length > 0) body.status = [...new Set([...filterState.status, ...customFilterState.status])].toString()
      if(filterState.assignee.length > 0 || customFilterState.assignee.length > 0) body.assignee = [...new Set([...filterState.assignee, ...customFilterState.assignee])].toString()
      dispatch(getTicketsByOrgThunk(body))

    }, [currentPage])

  
    useEffect(()=>{
        dispatch(getOrganisationByIdThunk({orgId}))
        dispatch(getTicketsByOrgThunk({orgId, pageLimit : PageSize, currentPage, searchValue}))
        //todo
        dispatch(getViewsThunk({orgId: orgId}))
        if(searchParams.get("ticketId")){
          setShowTicketModal(true)
        }
    },[])
  
    useEffect(() => {
      setOrgData(organisationData)
    }, [organisationData]);

    useEffect(() => {
      setTicketsByOrgData(orgTicketsData)
    }, [orgTicketsData]);

    useEffect(()=>{
      if(orgData && orgData.logoImage){
        TicketsAPI.downloadImage({fileKey: orgData.logoImage.fileKey})
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
         if(res.data.type.toString().includes("image")){
          setOrgLogo(url)
          }
        })
        .catch((err) => {
          console.log("Error in previewing attachment");
        });
      }
    },[orgData])

  

    const handleShowAddView = () => {
      setShowManageFilter(false)
      setShowFilter(true)
    }

     useEffect(()=>{
      if(customViewState && viewsData){
        if(customViewState === "clear"){
          setCustomFilterState(initFilterState)
        }else{
          for(let i = 0; i < viewsData.length; i++){
            if(viewsData[i]._id === customViewState){
              const {priority, assignee : viewAssignee, type, status} = viewsData[i]
              let formattedAssignee = [];
              if(viewAssignee.length > 0){
                 formattedAssignee = viewAssignee.reduce((acc, curr)=>{
                  return [...acc, curr._id]
                },[])
              }
              setCustomFilterState({priority, assignee: formattedAssignee, type, status})
            }
          }
        }
      }
     },[customViewState, viewsData])

          return (
              <div>
               { actionStatus.getOrganisationById === "loading" && < BasicLoader />}
               {actionStatus.getOrganisationById === "fulfilled" && orgData &&  <Container>
                  <div className='d-flex align-items-center mt-5 justify-content-between'>
                    <div className='d-flex align-items-center'>
                      {orgLogo && 
                      <div className='org-logo-wrapper me-2'> <img src={orgLogo} alt={orgData.name + " logo"} /></div> }
                      <h1 className='primary-header m-0'>{orgData.name}</h1>
                    </div>
                    <div className='d-flex align-items-center'>
                    
                    {currUser.userType !== "CLIENT USER" && <Button onClick={()=>{setShowInviteModal(prev => !prev)}} variant="link">Invite User</Button>}
                    {orgData && organisationData?.supportUsers.filter(user => user && !user?.isLocked && !user?.isDeleted && user?.phone).length > 0 && 
                    <div className='position-relative'>
                        <ToolTip name={"Contact Support"} align={"top"}>
                          <Question className='cursor' size={22} onClick={()=>{setToggleSupport(prev => !prev)}} />
                      </ToolTip>
                      {toggleSupport && ( <Dropdown.Menu style={{ position: 'absolute', left: '-100px' }} show={toggleSupport} align="middle">
                          {orgData && organisationData?.supportUsers.map(user => {
                            if(user && !user?.isLocked && !user?.isDeleted && user?.phone){
                              return <Dropdown.Item> {user.name.split(" ")[0]}  <a href={`tel:${user.phone}`}>{user.phone}</a> </Dropdown.Item>
                            }
                          })}
                        </Dropdown.Menu> )}
                    </div>}
                    </div>
                  </div>
                  <div className='d-flex justify-content-between g-10 align-items-end mt-4'>
                    <div>
                    <Button onClick={()=>{setShowTicketModal(true)}} variant="primary">Create Ticket</Button>
                                    
                    </div>
                   
                    <div className='d-flex'>
                    <div className='d-flex align-items-center position-relative'>
                      <MagnifyingGlass size={18} className='position-absolute searchicon' />
                    <input className='searchbox' onChange={(e)=>{setSearchValue(e.target.value)}} 
                      placeholder='Search Tickets' />
                    {/* <div className='icon-search d-center'></div> */}
                    </div>

                    <Button onClick={()=>setShowManageFilter(true)} variant="outline-primary ms-3">Custom Views</Button>
                    <DropdownButton className="dropdown-outline ms-3" title="Import / Export">
                    {ticketsByOrgData && ticketsByOrgData?.ticketsData?.length > 0 &&  
                      <Dropdown.Item >                        
                        <CsvExport children={"Export Tickets"} searchValue={searchValue} filterState={filterState} orgId={orgId} fileHeaders={fileHeaders} />
                        {/* <CSVLink onClick={(e)=> e.stopPropagation()} style={{textDecoration: "none", color: "black"}} data={filteredData} headers={fileHeaders} filename={'Tickets.csv'}>
                          <p>Export Excel CSV</p>
                        </CSVLink>  */}
                    </Dropdown.Item> }
                    <Dropdown.Item onClick={()=>setShowImportModal(true)}>Import JIRA Tickets</Dropdown.Item>
                    </DropdownButton>
                    </div>
                  {/* {orgData.tickets && orgData.tickets.length > 0 && <Button variant="outline-primary ms-3">Download Tickets</Button>} */}
                  </div>
                  <div className='d-flex justify-content-between mt-5'>
                  <div className='d-flex align-items-center g-20'>

                    <FilterSelect 
                    filters={filterState}
                    setFilters={setFilterState}
                    filterType={"priority"} 
                    filterOptions={ [ "Enhancement (P4)",
                                        "Minor (P3)",
                                        "Major (P2)",
                                        "Critical (P1)"]} />
                    <FilterSelect 
                      filters={filterState}
                      setFilters={setFilterState}
                    filterType={"type"} 
                    filterOptions={ [ "Task",
                                        "Incident",
                                        "Bug",
                                        "Story",
                                        "Query"]} />
                    <FilterSelect 
                      filters={filterState}
                      setFilters={setFilterState}
                    filterType={"status"} 
                    filterOptions={ [ "Ready",
                                      "In Progress",
                                      "User Validation",
                                      "Done"]} />
                    {organisationData && <FilterSelect filters={filterState}
                      setFilters={setFilterState} filterType={"assignee"} 
                    filterOptions={ [...organisationData.supportUsers, ...organisationData.clientUsers].reduce((acc, curr) => {
                      return [...acc, {
                        email: curr.email,
                        filterUId: curr._id
                      }]
                    },[]) } />}
                  </div>
                  <div className='d-flex align-items-center g-20'>
                      {viewActionStatus.getViews === "fulfilled" && viewsData && 
                         <Form.Group className='d-flex align-items-end'>
                            <Form.Select
                            aria-label="Custom View Select Input"
                            value={customViewState}
                            onChange={(e)=>{
                              setCustomViewState(e.target.value)
                            }}>
                              <option value={"clear"} >Choose View</option>
                              {viewsData.filter(view => {
                                if(view.createdBy === currUser.userEmail){
                                  return true
                                }
                                else if(currUser.userType === "CLIENT USER"){
                                  return view.globalView && view.viewType === "EXTERNAL" && view.organization === orgId
                                }else{
                                  return view.globalView && view.viewType === "INTERNAL"
                                }
                              }).map(view => 
                              <option value={view._id}>{view.viewName}</option>)}
                          </Form.Select>
                        </Form.Group>}
                        <ToolTip name={"Clear All Filters"} align="bottom">
                          <Broom className='cursor' onClick={()=>{
                            setFilterState(initFilterState)
                            setCustomViewState("clear")
                            }} size={22} />
                        </ToolTip>
                  </div>
                  </div>
                  {!ticketsByOrgData && < BasicLoader />}
                  {(ticketsByOrgData && ticketsByOrgData?.ticketsData?.length > 0) && 
                  <Table className='mt-4' striped bordered hover>
                  <thead className="details-table-heading__container">
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Priority</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="detail-body__container">
                    {ticketsByOrgData && ticketsByOrgData?.ticketsData?.map((ticket)=>{
                     return (<tr key={ticket?._id} className='cursor' 
                     onClick={()=>{
                      setSearchParams(searchParams => {
                        searchParams.set("ticketId",ticket._id);
                        return searchParams;
                      })
                      setShowTicketModal( true );
                      }}> 
                      <td className='truncate name'>{ticket.name}</td> 
                      <td>{ticket.shortSeqID}</td> 
                      <td>{toTitleCase(ticket.priority)}</td> 
                      <td>{toTitleCase(ticket.type)}</td> 
                      <td>{toTitleCase(ticket.status)}</td> 
                      <td className='position-relative'>
                        {(ticket?.assignee?.isDeleted || ticket?.assignee?.isLocked) && 
                          <Badge bg="danger" className="position-absolute" style={{right: '50px', top: '10px', right: '10px'}}>
                            {ticket?.assignee?.isDeleted && ticket?.assignee?.isLocked  ? 'Invalid' : ticket?.assignee?.isDeleted ? 'Deleted' : ticket?.assignee?.isLocked && 'Locked'} 
                          </Badge>}
                        {ticket.assignee.email.split('@')[0].length > 17 ? `${ticket.assignee.email.split('@')[0].slice(0, 17) + '...'}` : `${ticket.assignee.email.split('@')[0]}` }
                      </td>
                      <td>
                          <Trash  onClick={(e)=>{
                            e.stopPropagation()
                            handleTicketDelete(ticket._id)}}  size={22} className="me-1 delete-btn" />
                          <Link onClick={(e)=>{
                            e.stopPropagation()
                            copyLinkToClip(ticket._id)}} size={22}  className="ms-1 edit-btn"/>
                      </td>
                      </tr>)
                    })}
                 
                    {/* {currentRelease.tasks &&
                      currentRelease.tasks?.map((task, index) => (
                        <TaskItem task={task} 
                        deleteReleaseTaskHandler={deleteReleaseTaskHandler}
                        setShowTaskModal={setShowTaskModal} 
                        setSelectTask={setSelectTask} />
                      ))}
      
                    {currentRelease && currentRelease.tasks.length === 0 && (
                      <tr className="detail-row">No data found</tr>
                    )} */}
                  </tbody>
                  </Table>}
                  {(ticketsByOrgData && ticketsByOrgData?.ticketsData?.length === 0) && <div className='mt-5 d-flex justify-content-center'>No Tickets To See yet</div>}
                  {ticketsByOrgData && <div className='d-center' style={{marginTop: "30px"}}>
                  <Pagination
                    className="pagination-bar"
                    currentPage={currentPage}
                    totalCount={ticketsByOrgData?.total}
                    pageSize={PageSize}
                    onPageChange={page => setCurrentPage(page)}
                  />
                  </div>}
                
                  
              </Container> }

              <ViewModal clearFilterState={()=>setCurrentPage(1)} handleShowAddView={handleShowAddView}  setFilterState={setFilterState} toggleShow={showManageFilter} setToggleShow={setShowManageFilter} />
              {showFilter && <AddViewModal clearFilterState={()=>setCurrentPage(1)} toggleShow={showFilter} setToggleShow={setShowFilter} />}
              {showImportModal && <ImportTicketsModal toggleShow={showImportModal} setToggleShow={setShowImportModal} />}
              { showInviteModal && <InviteUser showModal={showInviteModal} setShowModal={setShowInviteModal} orgId={orgId}  />}
              {(showTicketModal || searchParams.get("ticketId")) && 
                <TicketModal show 
                  onHide={() => setShowTicketModal(false)} 
                  getTickets={(type)=>getTicketsAfterAction(type)} />}
          </div>

      )
    };

export default TicketsPage;