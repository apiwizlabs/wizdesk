import { createSlice } from "@reduxjs/toolkit";
import { createViewThunk, getViewsThunk, deleteViewThunk } from "./AsyncThunks";
  
const initialState = {
    viewsData: null,
    actionStatus: {}
  };

  const viewSlice = createSlice({
    name: "views",
    initialState,
    reducers: {},
    extraReducers: {
      [createViewThunk.pending]: (state) => {
        state.actionStatus.createView = "loading";
        state.actionStatus.createViewError = null;
      },
      [createViewThunk.fulfilled]: (state, action) => {
        state.actionStatus.createView = "fulfilled";
        state.actionStatus.createViewError = null;
      },
      [createViewThunk.rejected]: (state) => {
        state.actionStatus.createView = state.actionStatus.createViewError = "error";
      },
      [getViewsThunk.pending]: (state) => {
        state.actionStatus.getViews = "loading";
        state.actionStatus.getViewsError = null;
      },
      [getViewsThunk.fulfilled]: (state, action) => {
        state.actionStatus.getViews = "fulfilled";
        state.viewsData = action.payload.data;
        state.actionStatus.getViewsError = null;
      },
      [getViewsThunk.rejected]: (state) => {
        state.actionStatus.getViews = state.actionStatus.getViewsError = "error";
      },
      [deleteViewThunk.pending]: (state) => {
        state.actionStatus.deleteView = "loading";
        state.actionStatus.deleteViewError = null;
      },
      [deleteViewThunk.fulfilled]: (state, action) => {
        state.actionStatus.deleteView = "fulfilled";
        state.actionStatus.deleteViewError = null;
      },
      [deleteViewThunk.rejected]: (state) => {
        state.actionStatus.deleteView = state.actionStatus.deleteViewError = "error";
      },
    },
  });
  
  export default viewSlice.reducer;