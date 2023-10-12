import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import Select, { components } from 'react-select'
import CommentInput from './components/CommentInput';
import { useOutletContext, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { EngineeringAPI } from '../../api/apiConfig';
import { useDispatch, useSelector} from "react-redux";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import {createTicketThunk, getTicketByIdThunk, updateTicketByIdThunk} from '../../app/features/Ticket/AsyncThunks'
import {getOrganisationByIdThunk} from '../../app/features/Organisation/AsyncThunks'
import BasicLoader from '../Loader/basicScreenloader';
import { PaperclipHorizontal, DownloadSimple, Trash, XSquare, Plus, ArrowSquareOut} from "@phosphor-icons/react";
import { TicketsAPI } from '../../api/apiConfig';
import { toast } from 'react-toastify';
import Spinner from 'react-bootstrap/Spinner';
import { ToolTip } from '../Tooltip/index';
import CreatableSelect from 'react-select/creatable';
import {clearExistingTicketData} from "../../app/features/Ticket/TicketsSlice";
import { v4 as uuidv4 } from 'uuid';

const TicketModal = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const {organisationData } = useSelector((state) => state.organisations);
  const {ticketData : existingTicketData, actionStatus, orgTicketsData, downloadState} = useSelector((state)=>state.tickets)
  const [showDescAttachments, setShowDescAttachments] = useState(false)
  const [ticketsDropdown, setTicketsDropdown] = useState(null)
  const [descAttachmentsData, setDescAttachmentsData] = useState(null)
  const [loadingState, setLoadingState] = useState(false)
  const {orgId} = useParams();
  const [{userType, userEmail}] = useOutletContext();
   
    const initTicketState = {
      name: "",
      description: {
          text: "",
          attachments: []
      },
      type: "TASK",
      priority: "ENHANCEMENT",
      status: "READY",
      comments: [],
      createdBy: userEmail,
      assignee: "",
      linkedTickets: [],
  }
    const [ticketData, setTicketData] = useState(initTicketState)   
    const [ticketDataError, setTicketDataError] = useState({})    
    const [togglePreview, setTogglePreview] = useState(searchParams.has("ticketId"))
    const [orgUsers, setOrgUsers] = useState(false)
    const [isTicketPresent, setIsTicketPresent] = useState(searchParams.has("ticketId")); //convert into variable
    const [previewData, setPreviewData] = useState(null)
    const [previewLoadState, setPreviewLoadState] = useState(false)
    const [ticketCts, setTicketCts] = useState(null)

    const [labelValue, setLabelValue] = useState('');
    const [labelList, setLabelList] = useState([]);
  
    const handleKeyDown = (event) => {
      if (!labelValue) return;
      switch (event.key) {
        case 'Enter':
        case 'Tab':
          setLabelList((prev) => [...prev, createOption(labelValue)]);
          setLabelValue('');
          event.preventDefault();
      }
    };


    const handleTicketLinkClick = (e, props) => {
      e.stopPropagation();
      e.preventDefault();
      setSearchParams(searchParams => {
        searchParams.set("ticketId",props.data.value);
        return searchParams;
      })
      window.location.reload(true)
    }
    
    const MultiValueContainer = props => {
      return (
        <div style={{margin: "0 5px"}} className='d-flex align-items-center'>
          <components.MultiValueContainer {...props} style={{margin: 0}} />
          <ToolTip name={"Go To Ticket"}>
          <div     
          onClick={(e) => handleTicketLinkClick(e, props)}
          className='link-ticket-icon-bg d-flex align-items-center'>     
             <ArrowSquareOut className='link-ticket-icon' size={12}  />
          </div>
          </ToolTip>
        </div>
      );
    };

    const handleClose= () => {
      if(searchParams.has("ticketId")){
        searchParams.delete("ticketId")
        setSearchParams(searchParams);
        setPreviousAssignee(null);
        dispatch(clearExistingTicketData());
        //set existing ticket data to null
      } 
    }

    const handleCreateTicket = async (ticketData) => {
      const addedTicketData = await dispatch(createTicketThunk({orgId, ticketBody: ticketData}))
      if(isFulfilled(addedTicketData)){
        props.getTickets("CREATE")
      }
      setLoadingState(false)
      // props.setCurrentPageToInital()
      props.onHide();
      handleClose();
    }

    const handleDeleteAttachment = async (file, attachmentIndex) => {
      const attachmentList = ticketData.attachments.map(attachment => attachment)
      attachmentList.splice(attachmentIndex, 1)
      setTicketData(prev => ({...prev, attachments: attachmentList}))
      console.log(file, "THE FILEEE")
      const res = await TicketsAPI.deleteTicketAttachment(file, searchParams.get('ticketId'))
      if(res.status === 200){
        toast.success("Attachment Deleted Successfully", {autoClose: 3000})
      }
      console.log(res, "att deletion tickets")
    }

    const validate = (values) => {
      const errors = {};
      Object.keys(values).map(key => {
        if(key === "assignee" || key === "createdBy" || key === "name" || key === "priority" || key === "status" || key === "type"){
          if(!values[key]) errors[key] = true;
        }
      })
      return errors
    }

    const handleSubmit = async () => {
      console.log("IN SUBMIT")
      const errorsObj = validate(ticketData);
      if(Object.keys(errorsObj).length === 0 ){
            setLoadingState(true)
      if(descAttachmentsData){
        try{
          console.log(descAttachmentsData, "DESC ATTACHMENTS")
          let maxSizeCount = 50000000;
          const largeFiles = descAttachmentsData.filter(item => item.size > maxSizeCount)

          if(descAttachmentsData.length > 3 || largeFiles.length > 0){
            throw new Error('Error while uploading attachments');
          }
          const responseData = await TicketsAPI.uploadAttachments(descAttachmentsData);
          console.log(responseData, "RESPONSEDATA submit")
          if(responseData.status !== 200){
            throw new Error('Error while uploading attachments');
          }
          if(responseData.data.data){
            const fileKeysArray = responseData.data.data.map(fileData => ({fileKey: fileData.key}))
            const _ticketData = {...ticketData, description: ticketData.description.text, attachments: fileKeysArray, labels: labelList}
            handleCreateTicket(_ticketData)
           }
        }catch(err){
          toast.error("Please keep files under 50MB each and upload a maximum of 3 files at a time.")
          setLoadingState(false);
          // props.onHide();
          // handleClose();
        }
    
      }else{
        const _ticketData = {...ticketData, description: ticketData.description.text, attachments: [], labels: labelList}
        handleCreateTicket(_ticketData)
      }
      }else{
        setTicketDataError(errorsObj)
      }
    }

    const handleTicketUpdate = async (newTicketData) => {
      const updatedTicketData = await dispatch(updateTicketByIdThunk({ticketId: searchParams.get('ticketId'), ticketBody: newTicketData}))
      if(isFulfilled(updatedTicketData)){
        // dispatch(getOrganisationByIdThunk({orgId: orgId}))
        props.getTickets("UPDATE")
      }
      setLoadingState(false)
      // props.clearFilterState()
      props.onHide();
      handleClose();
    }

    const handleUpdate = async () => {
      console.log("IN UPDATE")
      const errorsObj = validate(ticketData);
      if(Object.keys(errorsObj).length === 0 ){
      setLoadingState(true)
      if(descAttachmentsData){
        try{
          let maxSizeCount = 50000000;
          const largeFiles = descAttachmentsData.filter(item => item.size > maxSizeCount)

          if(descAttachmentsData.length > 3 || largeFiles.length > 0){
            throw new Error('Error while uploading attachments');
          }
          const responseData = await TicketsAPI.uploadAttachments(descAttachmentsData);
          if(responseData.status !== 200){
            throw new Error('Error while uploading attachments');
          }
          if(responseData?.data?.data){
            const fileKeysArray = responseData.data.data.map(fileData => ({fileKey: fileData.key, fileSize: fileData.size}))
            const _ticketData = {...ticketData, attachments: [...ticketData.attachments, ...fileKeysArray], labels: labelList};
            handleTicketUpdate(_ticketData);
          }
        }catch(err){
          toast.error("Please keep files under 50MB each and upload a maximum of 3 files at a time.")
          setLoadingState(false);
          // props.onHide();
          // handleClose();
        }
      }else{
        handleTicketUpdate({...ticketData, labels: labelList})
      }}else{
        setTicketDataError(errorsObj)
      }
    }


    const handleUserInput = (e ) => {
      const {name, value} = e.target
        if(name === "description"){
          setTicketData(prev => ({...prev, [name]: {...prev[name],text: value }}))
        }else{
          setTicketData(prev => ({...prev, [name]: value}))
        }
    }
    

    const downloadAttachment = ({ fileKey }) => {
      // setDownloadStatus(fileKey.toString())
      TicketsAPI.downloadImage({ fileKey })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", fileKey);
          link.click();
        })
        .catch((err) => {
          console.log("Error in downloading attachment");
        });
    };

    const viewPreview = (attachmentFileKey) => {
      setLoadingState(true)
      setPreviewLoadState(true)
      TicketsAPI.downloadImage({fileKey: attachmentFileKey})
      .then((res) => {
        setLoadingState(false)
        setPreviewLoadState(true)
        const url = window.URL.createObjectURL(new Blob([res.data]));
        if(res.data.type.toString().includes("video")){
          setPreviewData({isVideo: true, url: url, urlStatus: false});
        }else if(res.data.type.toString().includes("image")){
          setPreviewData({isVideo: false, url: url, urlStatus: false})
        }
      })
      .catch((err) => {
        console.log("Error in previewing attachment");
      });
    }

    const labelComponents = {
      DropdownIndicator: null,
    };
    
    const createOption = (label) => ({
      label,
      value: label,
    });

    useEffect(()=>{
      if(!searchParams.has("ticketId") && organisationData?.supportUsers){
        const validSupportUsers = organisationData?.supportUsers.map(user => (user?.isLocked || user?.isDeleted) ? null : user).filter(item => item!== null);
        if(validSupportUsers.length > 0){
          setTicketData(prev => ({...prev, assignee: validSupportUsers[0].email}))
        }else{
          toast.error("Need atleast one support user", {autoClose: 2500})
          handleClose()
        }
      }
      if(searchParams.has("ticketId")){
       dispatch(getTicketByIdThunk({ticketId: searchParams.get("ticketId")}));        
      }
  },[])

  useEffect(()=>{
    // organisationData.tickets && setTicketsDropdown(organisationData.tickets)
    if(organisationData){
      organisationData.supportUsers && setOrgUsers([...organisationData.supportUsers, ...organisationData.clientUsers])
    }
  }, [organisationData, isTicketPresent])


  useEffect(()=>{
    if(orgUsers && isTicketPresent && existingTicketData){
      const {assignee} = existingTicketData
      if(!orgUsers.some(el => el._id === assignee._id)){
        setCurrentAssignee(assignee)
      }
    }
  },[orgUsers, isTicketPresent, existingTicketData])

  useEffect(()=>{
    if(orgTicketsData && orgTicketsData?.ticketsData?.length > 0 ){
      const formattedTicketsDropdown = orgTicketsData.ticketsData.reduce((acc, curr)=>{
        const option = {value: curr._id, label: curr.name}
        return [...acc, option ]
    }, [])
    setTicketsDropdown(formattedTicketsDropdown.filter(item => item.value !== searchParams.get("ticketId")))
    }
  },[orgTicketsData])

const [previousAssignee, setPreviousAssignee] = useState(null);
const [currentAssignee, setCurrentAssignee] = useState(null)

const formattedDisplayCts = (timestamp) => {
  let displayCts = "";
  console.log(timestamp, "COMMENST CTS Map")
  if(timestamp){
    const createdDate = new Date(timestamp)
    const currentDate = new Date();
    const timeDifference = currentDate - createdDate;
    console.log(timeDifference, "timee differencee")
    const secondsPassed = Math.floor(timeDifference / 1000);
    const minutesPassed = Math.floor(timeDifference / (1000 * 60));
    const hoursPassed = Math.floor(timeDifference / (1000 * 60 * 60));
    const daysPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    
    
    if(daysPassed >= 1){
      const formattedDate = createdDate.toLocaleDateString("en-GB");
      displayCts = formattedDate
    }else if(hoursPassed >= 1){
      displayCts = `${hoursPassed} hr(s) ago`
    } else if(minutesPassed >= 1){
      // Display minutes
      displayCts = `${minutesPassed} min(s) ago`
    }else{
      displayCts = `${secondsPassed} sec(s) ago`
    }
  }
  return displayCts;
}

  useEffect(()=>{
    if(isTicketPresent && existingTicketData){
      const {name, description, status, type, priority, assignee, createdBy, attachments, comments, childrenTickets, labels, cts} = existingTicketData;
      console.log(existingTicketData.cts, "CTSTTTS tickets")
      setTicketCts(cts)
      const formattedLabels = labels.map(item => ({label: item, value: item}));
      setLabelList(formattedLabels)
      let formattedChildrenTickets = childrenTickets.map(ticket =>({label: ticket.name, value: ticket._id}))
      let commentsObj = []
      if(comments){
        comments.map(comment => commentsObj.push({text: comment.text, attachments: comment.attachments, createdBy: comment.createdBy, id: comment._id, 
          cts: comment.cts, mts: comment.mts}))
      }
      if(assignee?.isDeleted || assignee?.isLocked){
        setPreviousAssignee(assignee)
      }
      
      setTicketData({
        name, description: {text: description}, attachments: attachments, status, type, priority, assignee, comments: commentsObj, createdBy, linkedTickets: formattedChildrenTickets
      })

      organisationData.supportUsers && setOrgUsers([...organisationData.supportUsers, ...organisationData.clientUsers])
    }
  },[existingTicketData, isTicketPresent])

    return (
      <>
      
        {previewData && previewData.url && <div>
          <XSquare onClick={()=>setPreviewData(null)} className='position-fixed close-img' size={32} />
          {!previewData.isVideo &&  <img className='position-fixed preview-img' src={previewData.url} width="100vw" height="100vh" align="center"/>}
          {previewData.isVideo &&  <video className='position-fixed preview-video' src={previewData.url} id="video" controls />}
          </div>}
        <Modal backdrop="static" size="lg" show={props.show} 
          onHide={() => {props.onHide();handleClose();}} aria-labelledby="contained-modal-title-vcenter">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {isTicketPresent ? (previewLoadState ? "Attachment Preview" : (loadingState ? "Updating Ticket" : "Update Ticket") ) : (loadingState ? "Creating Ticket" : "Create Ticket")}
        </Modal.Title>
      </Modal.Header>
           <Modal.Body className="show-grid">
            {actionStatus.getTicketById === "loading" && <BasicLoader />}
            {loadingState ? <div className='d-flex'><Spinner className='me-3' animation="border" size="sm" /> <p>Loading ...</p></div>
          :   (actionStatus.getTicketById === "fulfilled" || !isTicketPresent) &&  
            <Container>
                <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    placeholder="Enter Ticket Name"
                    value={ticketData.name}
                    name="name"
                    className={ticketDataError.name && "error-field"}
                    onChange={(e)=> handleUserInput(e)}
                    autoFocus={!isTicketPresent}
                  />
                </Form.Group>
                <Form.Group
                  className="mb-3">
                    <div className='d-flex justify-content-between align-items-center'>
                    <Form.Label className='mb-0'>Description</Form.Label>
                    <Button onClick={()=>{
                        setTogglePreview(prev => !prev)
                    }} variant="link" size="sm" className='m-0'>
                        {togglePreview ? "Edit Markdown" : "Preview Markdown" }
                        </Button>
                    </div>
                    
                    {togglePreview ? 
                    <ReactMarkdown remarkPlugins={[remarkGfm]} children={ticketData.description.text} className="markdown-preview"/>
                    :  <Form.Control 
                    value={ticketData.description.text}
                    name="description"
                    onChange={(e)=>handleUserInput(e)}
                    as="textarea" rows={3} />
                }
                </Form.Group>
                <div className='d-flex justify-content-between align-items-start'>
                  <Form.Group className="mb-3 d-flex">
                    <Form.Label visuallyHidden={true}>Multiple files input example</Form.Label>
                    <Form.Control 
                    onChange={((e)=>{
                      setDescAttachmentsData(Array.from(e.target.files))
                      // setTicketData(prev => (
                      // {...prev, description: {...prev.description, attachments: Array.from(e.target.files)}}))
                      })} type="file" size="sm" multiple />
                  </Form.Group>
                  {isTicketPresent && ticketData.attachments && ticketData.attachments.length > 0 && <div onClick={()=>{
                    setShowDescAttachments(prev => !prev)
                  }} className='blue-txt cursor me-4 position-relative'>{ showDescAttachments ? "Hide" : "View" } <PaperclipHorizontal size={22} />
                  
                  {showDescAttachments && <div onClick={()=>{}} className='position-absolute d-flex flex-column attachments-dropdown'>
                      {ticketData.attachments.map((file, i) => {
                      const ext = file.fileKey.split(".").slice("-1")[0]
                      return <div className="d-flex justify-content-between p-2" key={file._id} onClick={()=>viewPreview(file.fileKey)} >
                        <p>{file.fileKey.split("-")[0]}.{ext}</p>
                        <div className='d-flex g-10'>
                          <Trash onClick={(e)=>{
                            e.stopPropagation();
                            handleDeleteAttachment(file, i)
                          }} size={22}  />
                          <DownloadSimple size={22} onClick={(e) => {
                            e.stopPropagation();
                            downloadAttachment({ fileKey: file.fileKey });
                          }}/>
                        </div>
                      </div>})}
                    </div> } 
                  </div>}

                </div>
              <Row>
                <Col xs={6} md={4}>
                <Form.Group
                  className="mb-3"
                >
                  <Form.Label aria-label="Select">Type</Form.Label>
                  <Form.Select value={ticketData.type} 
                  name="type"
                  className={ticketDataError.type && "error-field"}
                  onChange={(e)=>handleUserInput(e)}>
                        <option value="TASK">Task</option>
                        <option value="INCIDENT">Incident</option>
                        <option value="QUERY">Query</option>
                        <option value="BUG">Bug</option>
                        <option value="STORY">Story</option>
                  </Form.Select>
                </Form.Group>
                </Col>
                <Col xs={6} md={4}>
                <Form.Group className="mb-3">
                  <Form.Label aria-label="Select">Priority</Form.Label>
                  <Form.Select value={ticketData.priority}  
                  name="priority"
                  className={ticketDataError.priority && "error-field"}
                  onChange={(e)=>handleUserInput(e)}>
                        <option value="ENHANCEMENT">Enhancement (P4)</option>
                        <option value="MINOR">Minor (P3) </option>
                        <option value="MAJOR">Major (P2) </option>
                        <option value="CRITICAL">Critical (P1) </option>
                  </Form.Select>
                </Form.Group>
                </Col>
                <Col xs={6} md={4}>
                <Form.Group
                  className="mb-3"
                >
                  <Form.Label aria-label="Select">Status</Form.Label>
                  <Form.Select 
                  value={ticketData.status}  
                  name="status"
                  className={ticketDataError.status && "error-field"}
                  onChange={(e)=>handleUserInput(e)}>
                        <option value="READY">Ready</option>
                        <option value="IN PROGRESS">In Progress</option>
                        <option value="USER VALIDATION">User Validation</option>
                        <option value="DONE">Done</option>
                  </Form.Select>
                </Form.Group>
                </Col>
              </Row>
              <Row>
              <Col md={6}>
              <Form.Group className="mb-3">
                  <Form.Label>Created By</Form.Label>
                  <Form.Control
                    value={isTicketPresent ? ticketData.createdBy.email : userEmail}
                    placeholder="name@example.com"
                    disabled
                  />
                  {isTicketPresent && (ticketData.createdBy.isDeleted || ticketData.createdBy.isLocked) && 
                  <p className='warning-txt mt-1'> 
                  {ticketData?.createdBy?.isDeleted && ticketData.createdBy.isLocked ? 'User has been Locked and Deleted' : 
                  ticketData?.createdBy?.isDeleted ? 'User has been Deleted' : 
                  ticketData?.createdBy?.isLocked && 'User has been Locked' }</p>}
                </Form.Group>
              </Col>
              <Col md={6}>
              <Form.Group  className="mb-3">
              {isTicketPresent && console.log(currentAssignee, "currr rn asssign")}
                  <Form.Label aria-label="Select">Assignee</Form.Label>
                  {userType === "CLIENT USER" ? 
                    <Form.Control disabled 
                    value={isTicketPresent ? ticketData.assignee.email : ticketData.assignee}>
                  </Form.Control> :  
                  <Form.Select value={isTicketPresent ? ticketData.assignee.email : ticketData.assignee} 
                  name="assignee" 
                  className={ticketDataError.assignee && "error-field"}
                    onChange={(e)=>handleUserInput(e)}>
                    { orgUsers && orgUsers.map(support => {
                      return  !support?.isDeleted && !support?.isLocked ? <option key={support._id} value={support.email}>{support.email.split("@")[0]}</option>
                      : isTicketPresent && previousAssignee?._id === support._id &&
                       <option key={previousAssignee._id} value={previousAssignee.email}> {`${[previousAssignee?.email.split("@")[0]]}`}</option>
                    }).concat(isTicketPresent && currentAssignee && <option key={currentAssignee?._id} value={currentAssignee?.email}> {`${[currentAssignee?.email.split("@")[0]]}`}</option> ) }
                    
                  </Form.Select>}
                  {isTicketPresent && (previousAssignee?.isDeleted || previousAssignee?.isLocked) && 
                  (ticketData.assignee.email === previousAssignee?.email || ticketData.assignee === previousAssignee?.email) && 
                  <p className='warning-txt mt-1'>User has been 
                    {
                      previousAssignee?.isDeleted && previousAssignee?.isLocked ? ' Locked and Deleted' : previousAssignee?.isDeleted ? ' Deleted' : previousAssignee?.isLocked && ' Locked'
                    }
                  </p>}
                </Form.Group>
              </Col>
              </Row>
                
                {ticketsDropdown?.length > 0 && <Form.Group className="mb-3">
                <Form.Label aria-label="Select">Linked Tickets</Form.Label>
                <Select
                  value={ticketData.linkedTickets}
                  isMulti
                  name="linkedTickets"
                  components={{ MultiValueContainer }}
                  onChange={(chosenOption)=> {
                    setTicketData(prev => ({...prev, linkedTickets: chosenOption}))
                  }}
                  styles={{
                    multiValue: (base) => ({
                      ...base,
                      margin: 0,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }),
                  }}
                  options={ticketsDropdown}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  />
                </Form.Group>}

                <Form.Group className="mb-3">
                <Form.Label aria-label="Select">Labels</Form.Label>
                <CreatableSelect
                  components={labelComponents}
                  inputValue={labelValue}
                  isClearable
                  isMulti
                  menuIsOpen={false}
                  onChange={(newValue) => setLabelList(newValue)}
                  onInputChange={(newValue) => setLabelValue(newValue)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a label and press enter ..."
                  value={labelList}
                />
                </Form.Group>
                <div className="mb-3">
                    <Button 
                    onClick={()=>{
                        setTicketData(prev => 
                          ({...prev, 
                            comments: [{
                              uid: uuidv4(),
                              text: "",
                              createdBy: userEmail,
                              attachments: [],
                          }, ...prev.comments] 
                        })
                          )
                    }} 
                    variant="outline-dark" size="sm">
                        Add Comment
                    </Button>
                </div>
                <div>
                    {ticketData.comments.map((comment, i)=>{
                        return (
                            <CommentInput downloadAttachmentFn = {downloadAttachment} commentCts={formattedDisplayCts(comment.cts)} key={comment.uid} comment={comment} commentIndex={i} setTicketData={setTicketData} isTicketPresent={isTicketPresent} ticketData={ticketData}  />
                        )
                    })}
                </div>
              </Form>
            </Container> }
         </Modal.Body>
   
        { !(actionStatus.downloadAttachment === "loading" || loadingState) &&

      <Modal.Footer className='d-flex justify-content-between'>
        {isTicketPresent && ticketCts ? <p className='md-txt'>{formattedDisplayCts(ticketCts)}</p> : <p></p>}
        <div className='d-flex g-10'>
        <Button variant="secondary" onClick={()=>{
          props.onHide();
          handleClose()
          }}>Close</Button>
        {actionStatus.uploadAttachment === "loading" && <Button variant="primary" disabled >
            Uploading Attachment/s
        </Button> }
       { actionStatus.uploadAttachment !== "loading" && (isTicketPresent ? 
       <Button variant="primary" onClick={handleUpdate}>
            Update Ticket
        </Button> : <Button variant="primary" onClick={handleSubmit}>
        Create Ticket
        </Button>)}
        </div>
      </Modal.Footer>}
        </Modal>
      </>
    );
};

export default TicketModal;