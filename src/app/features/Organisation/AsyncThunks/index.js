import { createAsyncThunk } from "@reduxjs/toolkit";
import { OrganisationAPI } from "../../../../api/apiConfig";

export const getOrganisationsThunk = createAsyncThunk(
    "organsiation/getOrganisations",
    async (_, {rejectWithValue}) => {
        try {
            const response = await OrganisationAPI.getAllOrganisations();
            return response.data;
          } catch (err) {
            return rejectWithValue(err);
          }
    }
  );

export const getOrganisationByIdThunk = createAsyncThunk(
    "organsiation/getOrganisationById",
    async ({orgId}, {rejectWithValue}) => {
        try {
            const response = await OrganisationAPI.getOrganisationById({orgId});
            return response.data;
          } catch (err) {
            return rejectWithValue(err);
          }
    }
  );

export const deleteOrganisationThunk = createAsyncThunk(
    "organisation/deleteOrganisation",
    async ({orgId}, {rejectWithValue}) => {
        try {
            const response = await OrganisationAPI.deleteOrganisation({ orgId });
            return response.data;
          } catch (err) {
            return rejectWithValue(err);
          }
    }
  );
export const updateOrganisationThunk = createAsyncThunk(
    "organisation/updateOrganisation",
    async ({ orgId, orgBody }, { rejectWithValue }) => {
        try {
          const response = await OrganisationAPI.updateOrganisation({ orgId, orgBody });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

export const createOrganisationThunk = createAsyncThunk(
    "organisation/createOrganisation",
    async ({ orgBody }, { rejectWithValue }) => {
        try {
          const response = await OrganisationAPI.createOrganisation({ orgBody });
          return response.data;
        } catch (err) {
          return rejectWithValue(err);
        }
      }
);

  