import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useParams } from 'react-router-dom';
import FilterSelect from '../../pages/Tickets/components/FilterSelect';
import { useSelector, useDispatch} from "react-redux";
import { createViewThunk, getViewsThunk } from '../../app/features/Views/AsyncThunks';
import { isFulfilled } from "@reduxjs/toolkit";

const AddViewModal = ({toggleShow, setToggleShow, clearFilterState}) => {
  const {orgId} = useParams();
    const dispatch = useDispatch();
    const handleClose = () => setToggleShow(false);
    const [viewFilters, setViewFilters] = useState({priority: [], type: [], status: [], assignee: [], viewName: "", globalView: false })
    const { organisationData } = useSelector((state) => state.organisations);
    const [viewFilterError, setViewFilterError] = useState({})

    const handleSubmit = async () => {
      const filtersPresent = viewFilters.priority.length > 0 || viewFilters.type.length > 0 || viewFilters.status.length > 0 || viewFilters.assignee.length > 0
      if(viewFilters.viewName && filtersPresent){
        const createView = await dispatch(createViewThunk({viewBody: viewFilters, orgId: orgId}))
        if(isFulfilled(createView)){
         clearFilterState()
         dispatch(getViewsThunk({orgId: orgId}))
         handleClose()
        }
      }else{
        if(!viewFilters.viewName) setViewFilterError(prev => ({...prev, viewName: true}))
        if(!filtersPresent) setViewFilterError(prev => ({...prev, filtersAbsent: true}))
      }
    }

    return (
        <>
      <Modal backdrop="static" size="lg" show={toggleShow} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create View</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
                <Form.Label>Name of View</Form.Label>
                <Form.Control className={viewFilterError.viewName && "error-field"} value={viewFilters.viewName} onChange={(e)=>{setViewFilters(prev => ({...prev, viewName: e.target.value}))}} placeholder="Enter Name Of Your View" />
            </Form.Group>
            <div className='d-flex g-20 mb-3'>
                  <FilterSelect
                      type={"custom"}
                      filters={viewFilters}
                      setFilters={setViewFilters}
                      filterType={"priority"} 
                      filterOptions={ [ "Enhancement (P4)",
                                          "Minor (P3)",
                                          "Major (P2)",
                                          "Critical (P1)"]} />
                    <FilterSelect 
                    type={"custom"}
                    filters={viewFilters}
                    setFilters={setViewFilters}
                    filterType={"type"} 
                    filterOptions={ [ "Task",
                    "Incident",
                    "Bug",
                    "Story",
                    "Query"]} />
                    <FilterSelect 
                    type={"custom"}
                     filters={viewFilters}
                     setFilters={setViewFilters}
                    filterType={"status"} 
                    filterOptions={ ["Ready",
                    "In Progress",
                    "User Validation",
                    "Done"]} />
                    {organisationData.name && 
                    <FilterSelect  
                    type={"custom"}
                    filters={viewFilters}
                    setFilters={setViewFilters}
                      filterType={"assignee"} 
                    filterOptions={[...organisationData.supportUsers, ...organisationData.clientUsers].reduce((acc, curr) => {
                      return [...acc, {
                        email: curr.email,
                        filterUId: curr._id
                      }]
                    },[])  } />}

            </div>
            {viewFilterError.filtersAbsent && <p className='error-txt mt-1 mb-3'>Atleast one filter should be selected</p>}
            
            
            {/* DO NOT DELETE IMPROVEMENT: Global view functionality */}
            {/* <Form.Check  className='mb-3'
            onChange={(e)=>setViewFilters(prev => ({...prev, globalView: e.target.checked}))}
            type={'checkbox'}
            id={`default-checkbox`}
            label={`Enable Global View`}
          /> */}

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add View
          </Button>
        </Modal.Footer>
      </Modal>
    </>
    );
};

export default AddViewModal;