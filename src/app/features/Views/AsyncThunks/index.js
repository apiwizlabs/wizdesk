import { createAsyncThunk } from "@reduxjs/toolkit";
import { ViewsAPI } from "../../../../api/apiConfig";


export const createViewThunk = createAsyncThunk(
    "views/createView",
    async ({ viewBody, orgId }, { rejectWithValue }) => {
        try {
          const response = await ViewsAPI.createView({ viewBody, orgId });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);
export const deleteViewThunk = createAsyncThunk(
    "views/deleteView",
    async ({ viewID }, { rejectWithValue }) => {
        try {
          const response = await ViewsAPI.deleteView({ viewID });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const getViewsThunk = createAsyncThunk(
    "views/getViews",
    async ({orgId}, { rejectWithValue }) => {
        try {
          const response = await ViewsAPI.getViews({orgId});
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);
