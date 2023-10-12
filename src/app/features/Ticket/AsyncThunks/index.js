import { createAsyncThunk } from "@reduxjs/toolkit";
import { TicketsAPI } from "../../../../api/apiConfig";


export const createTicketThunk = createAsyncThunk(
    "tickets/createTicket",
    async ({ orgId, ticketBody }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.createTicket({ orgId, ticketBody });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const getTicketByIdThunk = createAsyncThunk(
    "tickets/getTicket",
    async ({ ticketId }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.getTicketById({ ticketId });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const updateTicketByIdThunk = createAsyncThunk(
    "tickets/updateTicket",
    async ({ ticketId, ticketBody }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.updateTicketById({ ticketId, ticketBody });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const deleteTicketByIdThunk = createAsyncThunk(
    "tickets/deleteTicket",
    async ({ ticketId, orgId }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.deleteTicketById({ ticketId, orgId });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const deleteCommentByIdThunk = createAsyncThunk(
    "tickets/deleteComment",
    async ({ commentId }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.deleteCommentById({ commentId });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const uploadAttachmentThunk = createAsyncThunk(
    "tickets/uploadAttachment",
    async ({ uploadedData }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.uploadAttachments(uploadedData);
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const getTicketsByOrgThunk = createAsyncThunk(
    "tickets/getTicketsByOrg",
    async ({ orgId, pageLimit, currentPage, searchValue, type, priority, status, assignee }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.getTicketsByOrg(orgId, pageLimit, currentPage, searchValue, type, priority, status, assignee);
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const uploadImageThunk = createAsyncThunk(
    "tickets/uploadImage",
    async ({ uploadedData }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.uploadImage(uploadedData);
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const downloadAttachmentThunk = createAsyncThunk(
    "tickets/downloadAttachment",
    async ({ fileKey }, { rejectWithValue }) => {
        try {
          const response = await TicketsAPI.downloadImage({fileKey});
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);


  