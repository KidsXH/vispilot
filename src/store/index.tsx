'use client'

import {configureStore} from '@reduxjs/toolkit'
import {PropsWithChildren} from "react";
import {Provider, TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import AppSlice from "@/store/features/AppSlice";
import CanvasSlice from "@/store/features/CanvasSlice";
import DataSlice from "@/store/features/DataSlice";
import ChatSlice from "@/store/features/ChatSlice";
import CorpusSlice from "@/store/features/CorpusSlice";

// Create a Redux store
export const store = configureStore({
  reducer: {
    app: AppSlice,
    canvas: CanvasSlice,
    data: DataSlice,
    chat: ChatSlice,
    corpus: CorpusSlice,
  },
})

// Infer the type of store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Create a Redux Provider component
export const ReduxProvider = (props: PropsWithChildren) => {
  return <Provider store={store}>{props.children}</Provider>;
};