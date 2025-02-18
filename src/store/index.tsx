'use client'

import {configureStore} from '@reduxjs/toolkit'
import {PropsWithChildren} from "react";
import {Provider} from "react-redux";
import AppSlice from "@/store/features/AppSlice";

// Create a Redux store
export const store = configureStore({
  reducer: {
    app: AppSlice
  },
})

// Infer the type of store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Create a Redux Provider component
export const ReduxProvider = (props: PropsWithChildren) => {
  return <Provider store={store}>{props.children}</Provider>;
};