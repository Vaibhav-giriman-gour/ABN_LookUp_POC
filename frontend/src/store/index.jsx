// frontend/src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import abnReducer from './features/abnSlice'; // --- Import your ABN reducer

export const store = configureStore({
    reducer: {
        abn: abnReducer // --- Add ABN reducer
    },
    // --- Middleware and dev tools are automatically included by Redux Toolkit
});