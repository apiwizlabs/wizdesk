import { createSlice } from "@reduxjs/toolkit";
import {
  createOrganisationThunk,
  updateOrganisationThunk,
  deleteOrganisationThunk,
  getOrganisationsThunk,
  getOrganisationByIdThunk
} from "./AsyncThunks";


const initialState = {
    organisationList: [],
    organisationData: {},
    actionStatus: {},
  };
  
  const organisationSlice = createSlice({
    name: "organisations",
    initialState,
    reducers: {},
    extraReducers: {
      [getOrganisationsThunk.pending]: (state) => {
        state.actionStatus.getOrganisations = "loading";
        state.actionStatus.getOrganisationsError = null;
      },
      [getOrganisationsThunk.fulfilled]: (state, action) => {
        state.organisationList = action.payload.data;
        state.actionStatus.getOrganisations = "fulfilled";
        state.actionStatus.getOrganisationsError = null;
      },
      [getOrganisationsThunk.rejected]: (state) => {
        state.actionStatus.getOrganisations = state.actionStatus.getOrganisationsError = "error";
      },

      [getOrganisationByIdThunk.pending]: (state) => {
        state.actionStatus.getOrganisationById = "loading";
        state.actionStatus.getOrganisationByIdError = null;
      },
      [getOrganisationByIdThunk.fulfilled]: (state, action) => {
        state.organisationData = action.payload.data;
        state.actionStatus.getOrganisationById = "fulfilled";
        state.actionStatus.getOrganisationByIdError = null;
      },
      [getOrganisationByIdThunk.rejected]: (state) => {
        state.actionStatus.getOrganisationById = state.actionStatus.getOrganisationByIdError = "error";
      },
   
      [createOrganisationThunk.pending]: (state) => {
        state.actionStatus.createOrganisation = "loading";
        state.actionStatus.createOrganisationError = null;
      },
      [createOrganisationThunk.fulfilled]: (state) => {
        state.actionStatus.createOrganisation = "fulfilled";
        state.actionStatus.createOrganisationError = null;
      },
      [createOrganisationThunk.rejected]: (state) => {
        state.actionStatus.createOrganisation = state.actionStatus.createOrganisationError = "error";
      },
  
      [updateOrganisationThunk.pending]: (state) => {
        state.actionStatus.updateOrganisation = "loading";
        state.actionStatus.updateOrganisationError = null;
      },
      [updateOrganisationThunk.fulfilled]: (state) => {
        state.actionStatus.updateOrganisation = "fulfilled";
        state.actionStatus.updateOrganisationError = null;
      },
      [updateOrganisationThunk.rejected]: (state) => {
        state.actionStatus.updateOrganisation = state.actionStatus.updateOrganisationError = "error";
      },

      [deleteOrganisationThunk.pending]: (state) => {
        state.actionStatus.deleteOrganisation = "loading";
        state.actionStatus.deleteOrganisationError = null;
      },
      [deleteOrganisationThunk.fulfilled]: (state) => {
        state.actionStatus.deleteOrganisation = "fulfilled";
        state.actionStatus.deleteOrganisationError = null;
      },
      [deleteOrganisationThunk.rejected]: (state) => {
        state.actionStatus.deleteOrganisation = state.actionStatus.deleteOrganisationError =
          "error";
      },
    },
  });
  
  export default organisationSlice.reducer;
  