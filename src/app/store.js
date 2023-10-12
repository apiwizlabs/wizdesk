import { configureStore } from "@reduxjs/toolkit";
import organisationReducer from "./features/Organisation/OrganisationSlice"
import ticketsReducer from "./features/Ticket/TicketsSlice"
import viewsReducer from "./features/Views/ViewsSlice"

export const Store = configureStore({
  reducer: {
    organisations: organisationReducer,
    tickets: ticketsReducer, 
    views: viewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});