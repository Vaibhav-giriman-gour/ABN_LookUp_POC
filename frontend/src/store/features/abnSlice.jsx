import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// --- Base URL
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// --- In-memory cache for ABN search results ---
const abnQueryCache = {};

// --- Helper to generate a consistent cache key ---
const generateCacheKey = (searchParams) => {
    const sortedParams = Object.keys(searchParams)
        .sort()
        .map(key => [key, searchParams[key] || '']);
    return JSON.stringify(sortedParams);
};

export const fetchAbns = createAsyncThunk(
    'abn/fetchAbns',
    async (searchParams, { rejectWithValue, dispatch }) => {
        try {
            const cacheKey = generateCacheKey(searchParams);

            // Check cache first
            if (abnQueryCache[cacheKey]) {
                return abnQueryCache[cacheKey]; // Cache hit
            }

            // Cache miss: Make API call
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await axios.get(`${BASE_URL}?${queryString}`);

            abnQueryCache[cacheKey] = response.data; // Store in cache
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

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
            selectedAbn: null,
            totalCount: 0,
            currentPage: 1,
            limit: 10,
            searchQuery: '',
            filters: {
                state: '',
                postcode: '',
                entityType: '',
                abnStatus: ''
            },
            status: 'idle',
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
            clearSearch(state) { // Reducer to reset search state and clear cache
                state.abns = [];
                state.selectedAbn = null;
                state.totalCount = 0;
                state.currentPage = 1;
                state.limit = 10;
                state.searchQuery = '';
                state.filters = { state: '', postcode: '', entityType: '', abnStatus: '' };
                state.status = 'idle';
                state.error = null;
                // Clear the actual in-memory cache
                for (const key in abnQueryCache) {
                    delete abnQueryCache[key];
                }
            },
            // New action to explicitly clear cache
            clearAbnQueryCache: (state) => {
                for (const key in abnQueryCache) {
                    delete abnQueryCache[key];
                }
                state.currentPage = 1; // When filters change, reset to page 1
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
                    state.abns = [];
                    state.totalCount = 0;
                })

                // --- FetchAbnDetails
                .addCase(fetchAbnDetails.pending, (state) => {
                    state.status = 'loading';
                    state.error = null;
                    state.selectedAbn = null;
                })
                .addCase(fetchAbnDetails.fulfilled, (state, action) => {
                    state.status = 'succeeded';
                    state.selectedAbn = action.payload;
                })
                .addCase(fetchAbnDetails.rejected, (state, action) => {
                    state.status = 'failed';
                    state.error = action.payload || 'Failed to fetch ABN details';
                    state.selectedAbn = null;
                });
        }
    }
);

// --- EXPORT ACTIONS AND REDUCER
export const { setSearchQuery, setFilters, setCurrentPage, setLimit, clearSearch, clearAbnQueryCache } = abnSlice.actions;

export default abnSlice.reducer;