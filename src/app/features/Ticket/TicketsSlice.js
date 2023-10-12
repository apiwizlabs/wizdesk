import { createSlice } from "@reduxjs/toolkit";
import { createTicketThunk,getTicketsByOrgThunk, uploadAttachmentThunk, downloadAttachmentThunk, getTicketByIdThunk, updateTicketByIdThunk, deleteTicketByIdThunk, deleteCommentByIdThunk } from "./AsyncThunks";


const fileHeaders = [
  {label: 'Name', key: 'name'},
  {label: 'Description', key: 'description'},
  {label: 'Type', key: 'type'},
  {label: 'Status', key: 'status'},
  {label: 'CreatedBy', key: 'createdBy.email'},
  {label: 'Assignee', key: 'assignee.email'},
  {label: 'Organisation Name', key: 'organization.name'},
  {label: 'Comment', key: 'comments'},
]

  
const initialState = {
    ticketData: null,
    orgTicketsData: null,
    allTicketsData: null,
    actionStatus: {},
    fileHeaders: fileHeaders,
    downloadState: null,
    attachmentKeys: null,
  };

  const ticketSlice = createSlice({
    name: "tickets",
    initialState,
    reducers: {
      clearExistingTicketData: (state, action) => {
        state.ticketData = null;
      }, 
      toggleAttachmentsLoader: (state, action) => {
        state.actionStatus.uploadAttachment = action.payload;
      },
      toggleDownloadLoader: (state, action) => {
        state.downloadState = action.payload;
      }

    },
    extraReducers: {
      

      [createTicketThunk.pending]: (state) => {
        state.actionStatus.createTicket = "loading";
        state.actionStatus.createTicketError = null;
      },
      [createTicketThunk.fulfilled]: (state) => {
        state.actionStatus.createTicket = "fulfilled";
        state.actionStatus.createTicketError = null;
      },
      [createTicketThunk.rejected]: (state) => {
        state.actionStatus.createTicket = state.actionStatus.createTicketError = "error";
      },

      [getTicketByIdThunk.pending]: (state) => {
        state.actionStatus.getTicketById = "loading";
        state.actionStatus.getTicketByIdError = null;
      },
      [getTicketByIdThunk.fulfilled]: (state, action) => {
        state.actionStatus.getTicketById = "fulfilled";
        state.ticketData = action.payload.data;
        state.actionStatus.getTicketByIdError = null;
      },
      [getTicketByIdThunk.rejected]: (state) => {
        state.actionStatus.getTicketById = state.actionStatus.getTicketByIdError = "error";
      },
      [getTicketsByOrgThunk.pending]: (state) => {
        state.actionStatus.getTicketsByOrg = "loading";
        state.actionStatus.getTicketsByOrgError = null;
      },
      [getTicketsByOrgThunk.fulfilled]: (state, action) => {
        state.actionStatus.getTicketsByOrg = "fulfilled";
        state.orgTicketsData = action.payload;
        state.actionStatus.getTicketsByOrgError = null;
      },
      [getTicketsByOrgThunk.rejected]: (state) => {
        state.actionStatus.getTicketsByOrg = state.actionStatus.getTicketsByOrgError = "error";
      },
    
      [updateTicketByIdThunk.pending]: (state) => {
        state.actionStatus.updateTicketById = "loading";
        state.actionStatus.updateTicketByIdError = null;
      },
      [updateTicketByIdThunk.fulfilled]: (state) => {
        state.actionStatus.updateTicketById = "fulfilled";
        state.actionStatus.updateTicketByIdError = null;
      },
      [updateTicketByIdThunk.rejected]: (state) => {
        state.actionStatus.updateTicketById = state.actionStatus.updateTicketByIdError = "error";
      },
      [uploadAttachmentThunk.pending]: (state) => {
        state.actionStatus.uploadAttachment = "loading";
        state.actionStatus.uploadAttachmentError = null;
      },
      [uploadAttachmentThunk.fulfilled]: (state, action) => {
        state.actionStatus.uploadAttachment = "fulfilled";
        state.attachmentKeys = action.payload.data;
        state.actionStatus.uploadAttachmentError = null;
      },
      [uploadAttachmentThunk.rejected]: (state) => {
        state.actionStatus.uploadAttachment = state.actionStatus.uploadAttachmentError = "error";
      },
      [deleteTicketByIdThunk.pending]: (state) => {
        state.actionStatus.deleteTicketById = "loading";
        state.actionStatus.deleteTicketByIdError = null;
      },
      [deleteTicketByIdThunk.fulfilled]: (state) => {
        state.actionStatus.deleteTicketById = "fulfilled";
        state.actionStatus.deleteTicketByIdError = null;
      },
      [deleteTicketByIdThunk.rejected]: (state) => {
        state.actionStatus.deleteTicketById = state.actionStatus.deleteTicketByIdError = "error";
      },
      [deleteCommentByIdThunk.pending]: (state) => {
        state.actionStatus.deleteCommentById = "loading";
        state.actionStatus.deleteCommentByIdError = null;
      },
      [deleteCommentByIdThunk.fulfilled]: (state) => {
        state.actionStatus.deleteCommentById = "fulfilled";
        state.actionStatus.deleteCommentByIdError = null;
      },
      [deleteCommentByIdThunk.rejected]: (state) => {
        state.actionStatus.deleteCommentById = state.actionStatus.deleteCommentByIdError = "error";
      },

  
    },
  });

  export const {toggleAttachmentsLoader, clearExistingTicketData, toggleDownloadLoader } = ticketSlice.actions
  
  export default ticketSlice.reducer;