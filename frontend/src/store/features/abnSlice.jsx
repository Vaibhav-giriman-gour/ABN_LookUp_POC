import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// --- Base URL
const BASE_URL = 'http://localhost:5000/api/abns';

export const fetchAbns = createAsyncThunk(
    'abn/fetchAbns',
    async (searchParams, { rejectWithValue }) => {
        try {
            // --- Build the query string
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await axios.get(`${BASE_URL}?${queryString}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
)
export const fetchAbnDetails = createAsyncThunk(
    'abn/fetchAbnDetails',
    async (abn, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/${abn}`); // API call to /api/abns/:abn
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

const abnSlice = createSlice(
    {
        name: 'abn',
        initialState: {
            abns: [],
            selectedAbn: null, // Details of a single selected ABN
            totalCount: 0,
            currentPage: 1,
            limit: 10, // Default limit, matches backend
            searchQuery: '',
            filters: { // Stores current filter values
                state: '',
                postcode: '',
                entityType: '',
                abnStatus: ''
            },
            status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
            error: null
        },
        reducers: {
            // --- Setters for updating state
            setSearchQuery: (state, action) => {
                state.searchQuery = action.payload;
            },
            setFilters: (state, action) => {
                state.filters = { ...state.filters, ...action.payload };
            },
            setCurrentPage: (state, action) => {
                state.currentPage = action.payload;
            },
            setLimit: (state, action) => {
                state.limit = action.payload;
            },
            clearSearch(state) { // Reducer to reset search state
                state.abns = [];
                state.selectedAbn = null;
                state.totalCount = 0;
                state.currentPage = 1;
                state.limit = 10;
                state.searchQuery = '';
                state.filters = { state: '', postcode: '', entityType: '', abnStatus: '' };
                state.status = 'idle';
                state.error = null;
            }
        },
        extraReducers: (builder) => {
            builder
                .addCase(fetchAbns.pending, (state) => {
                    state.status = 'loading';
                    state.error = null;
                })
                .addCase(fetchAbns.fulfilled, (state, action) => {
                    state.status = 'succeeded';
                    state.abns = action.payload.abns;
                    state.totalCount = action.payload.totalCount;
                    state.currentPage = action.payload.currentPage;
                    state.limit = action.payload.limit;
                })
                .addCase(fetchAbns.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.payload || 'Failed to fetch ABNs';
                    state.abns = []; // Clear results on failure
                    state.totalCount = 0;
                }
                )

                // --- FetchAbnDetails
                .addCase(fetchAbnDetails.pending, (state) => {
                    state.status = 'loading';
                    state.error = null;
                    state.selectedAbn = null; // Clear previous details
                })
                .addCase(fetchAbnDetails.fulfilled, (state, action) => {
                    state.status = 'succeeded';
                    state.selectedAbn = action.payload; z
                })
                .addCase(fetchAbnDetails.rejected, (state) => {
                    state.status = 'failed';
                    state.error = action.payload || 'Failed to fetch ABN details';
                    state.selectedAbn = null;
                })
        }
    }
)

// --- EXPORT ACTIONS AND REDUCER 
export const { setSearchQuery, setFilters, setCurrentPage, setLimit, clearSearch } = abnSlice.actions;

export default abnSlice.reducer;