import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useSelector, useDispatch} from "react-redux";
import { getViewsThunk, deleteViewThunk } from '../../app/features/Views/AsyncThunks';
import BasicLoader from "../Loader/basicScreenloader"
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { isFulfilled } from "@reduxjs/toolkit";
import Badge from 'react-bootstrap/Badge';
import { useParams, useOutletContext } from 'react-router-dom';

const ViewModal = ({toggleShow, setToggleShow, setFilterState, handleShowAddView,  clearFilterState}) => {
  const [{userType, userEmail}] = useOutletContext();
  const handleClose = () => setToggleShow(false);
  const {orgId} = useParams()

  const dispatch = useDispatch();
  const { viewsData, actionStatus } = useSelector((state) => state.views);
  const [viewsList, setViewsList] = useState(null)

  const handleDeleteView = async (viewID) => {
   const deleteView = await dispatch(deleteViewThunk({viewID: viewID}))
    if(isFulfilled(deleteView)){
      clearFilterState()
      dispatch(getViewsThunk({orgId: orgId}))
    }
  }

  useEffect(()=>{
    if(viewsData){
      const views = viewsData.filter(view => {
        if(view.createdBy === userEmail){
          return true
        }
        else if(userType === "CLIENT USER"){
          return view.globalView && view.viewType === "EXTERNAL" && view.organization === orgId
       }else{
        return view.globalView && view.viewType === "INTERNAL"
       }})
      setViewsList(views);
    }

  },[viewsData])

  return (
    <>
      <Modal size="lg" show={toggleShow} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Custom Views</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        {actionStatus.getViews === "loading" && <BasicLoader /> }
        {actionStatus.getViews === "error" && <p>Could not fetch data. Please try again later.</p> }
        {viewsList && 
         <div className='d-flex g-20 flex-wrap'>
         {viewsList.length > 0 ? 
        viewsList.map(view => 
         <div className='view-card mb-3' key={view._id}>
            <div className='d-flex justify-content-between'>
                  <p className='view-title'>{view.viewName}</p>
                    <Trash onClick={(e)=>{
                      e.stopPropagation();
                      handleDeleteView(view._id);
                    }} size={18} className="ms-1 delete-btn" />
             </div>
            {view.status.length > 0 && <p className='v-txt mt-2'>Status:  {view.status.map((s, i) => <Badge bg="secondary" className="mx-1"> {s} </Badge>)} </p>}
            {view.priority.length > 0 && <p className='v-txt'>Priority:  {view.priority.map((s, i) => <Badge bg="secondary" className="mx-1"> {s} </Badge>)} </p>}
            {view.type.length > 0 && <p className='v-txt'>Type:  { view.type.map((s, i) => <Badge bg="secondary" className="mx-1"> {s} </Badge> )} </p>}
            {view.assignee.length > 0 && <p className='v-txt'>Assignee:  {view.assignee.map((s, i) => <Badge bg="secondary" className="mx-1"> {s.email} </Badge> )} </p>}
         </div>) : 
         <p className='d-center'>  No Custom Views Added Yet  </p>}
         </div> }
        </Modal.Body>
        <Modal.Footer className='d-flex justify-content-end g-10'>

          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleShowAddView}>
            Create View
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewModal;