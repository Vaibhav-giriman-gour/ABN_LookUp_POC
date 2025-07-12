// frontend/src/components/AbnSearchPage.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Corrected path for abnSlice
import { fetchAbns, setSearchQuery, setFilters, setCurrentPage, clearSearch } from '../store/features/abnSlice'; 

function AbnSearchPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get state from Redux store - these are the source of truth for current applied search
    const { abns, totalCount, currentPage, limit, searchQuery, filters, status, error } = useSelector(state => state.abn);

    // Local state for input fields (used for user input, then dispatched to Redux)
    const [qInput, setQInput] = useState(searchQuery);
    const [stateFilterInput, setStateFilterInput] = useState(filters.state);
    const [postcodeFilterInput, setPostcodeFilterInput] = useState(filters.postcode);
    const [entityTypeFilterInput, setEntityTypeFilterInput] = useState(filters.entityType);
    const [abnStatusFilterInput, setAbnStatusFilterInput] = useState(filters.abnStatus);

    // --- Streamlined handleSearch: Now accepts the page number to fetch and a flag to reset inputs ---
    const executeSearch = (pageToFetch, resetInputsAndFilters = false) => {
        let currentQ = qInput;
        let currentFilters = {
            state: stateFilterInput,
            postcode: postcodeFilterInput,
            entityType: entityTypeFilterInput,
            abnStatus: abnStatusFilterInput
        };

        // If this is a new search (from button click or initial load with fresh inputs)
        if (resetInputsAndFilters) {
            // The local input states are the source of truth for the *new* search
            dispatch(setSearchQuery(currentQ));
            dispatch(setFilters(currentFilters));
            dispatch(setCurrentPage(1)); // Always reset to page 1 for a new search
            pageToFetch = 1; // Ensure the page to fetch is 1 for a new search
        } else {
            // If this is triggered by pagination (via useEffect), Redux state is the source of truth
            // for the search query and filters, while pageToFetch is explicit.
            currentQ = searchQuery; // Use Redux state's query
            currentFilters = filters; // Use Redux state's filters
        }

        // Construct search parameters for API call
        const searchParams = {
            q: currentQ,
            state: currentFilters.state.toLowerCase(), // Ensure lowercase for API
            postcode: currentFilters.postcode,
            entityType: currentFilters.entityType.toLowerCase(), // Ensure lowercase for API
            abnStatus: currentFilters.abnStatus.toLowerCase(), // Ensure lowercase for API
            page: pageToFetch,
            limit: limit
        };
        dispatch(fetchAbns(searchParams));
    };

    // --- Streamlined useEffect: Triggers fetch when Redux search params or page/limit change ---
    useEffect(() => {
        // Only fetch if a search has been initiated (status is not idle)
        // OR if there are already search parameters in Redux (for initial load via URL or refresh)
        // OR if currentPage has changed (for pagination clicks)
        if (status !== 'idle' || searchQuery || filters.state || filters.postcode || filters.entityType || filters.abnStatus || currentPage !== 1) {
            // Call executeSearch with the current Redux page, but without resetting inputs/filters
            // Use buildSearchParams based on current Redux state (not local inputs)
            executeSearch(currentPage, false);
        }
    }, [searchQuery, filters.state, filters.postcode, filters.entityType, filters.abnStatus, currentPage, limit, dispatch]);


    // --- Handler for "Search" button click ---
    const handleSearchButtonClick = () => {
        executeSearch(1, true); // Reset to page 1, use current input field values
    };

    // --- Handler for "Clear" button click ---
    const handleClear = () => {
        dispatch(clearSearch()); // Reset all search-related state in Redux
        // Reset local input states as well
        setQInput('');
        setStateFilterInput('');
        setPostcodeFilterInput('');
        setEntityTypeFilterInput('');
        setAbnStatusFilterInput('');
        // No need to explicitly call executeSearch here; clearSearch dispatches will trigger useEffect
    };

    // --- Handler for "Previous/Next" pagination buttons ---
    const handlePageChange = (newPage) => {
        dispatch(setCurrentPage(newPage)); // Updates Redux state, which triggers useEffect
        // useEffect will then call executeSearch with the new page
    };

    const handleAbnClick = (abn) => {
        navigate(`/abns/${abn}`); // Navigate to detail page
    };

    const totalPages = Math.ceil(totalCount / limit);


    return (
        <div className="w-full max-w-4xl bg-gray-100 flex flex-col items-center py-8">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="md:col-span-2">
                    <label htmlFor="q" className="block text-gray-700 text-sm font-bold mb-2">Search by ABN, Legal Name, or Other Names</label>
                    <input
                        type="text"
                        id="q"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSearchButtonClick(); }} 
                        placeholder="e.g., QBE Insurance or 11000000948"
                    />
                </div>

                {/* Filters */}
                <div>
                    <label htmlFor="state" className="block text-gray-700 text-sm font-bold mb-2">State</label>
                    <select
                        id="state"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={stateFilterInput}
                        onChange={(e) => setStateFilterInput(e.target.value)}
                    >
                        <option value="">All States</option>
                        <option value="NSW">NSW</option>
                        <option value="VIC">VIC</option>
                        <option value="QLD">QLD</option>
                        <option value="SA">SA</option>
                        <option value="WA">WA</option>
                        <option value="TAS">TAS</option>
                        <option value="NT">NT</option>
                        <option value="ACT">ACT</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="postcode" className="block text-gray-700 text-sm font-bold mb-2">Postcode</label>
                    <input
                        type="text"
                        id="postcode"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={postcodeFilterInput}
                        onChange={(e) => setPostcodeFilterInput(e.target.value)}
                        placeholder="e.g., 2000"
                    />
                </div>
                <div>
                    <label htmlFor="entityType" className="block text-gray-700 text-sm font-bold mb-2">Entity Type</label>
                    <select
                        id="entityType"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={entityTypeFilterInput}
                        onChange={(e) => setEntityTypeFilterInput(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Organisation">Organisation</option>
                        <option value="Individual">Individual</option>
                        {/* You can add more specific codes from the ABN data like PUB, PRV if desired */}
                    </select>
                </div>
                <div>
                    <label htmlFor="abnStatus" className="block text-gray-700 text-sm font-bold mb-2">ABN Status</label>
                    <select
                        id="abnStatus"
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={abnStatusFilterInput}
                        onChange={(e) => setAbnStatusFilterInput(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="ACT">Active</option>
                        <option value="CAN">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Search & Clear Buttons */}
            <div className="mb-6 flex gap-4">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handleSearchButtonClick} // <<< Use the new button handler
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? 'Searching...' : 'Search'}
                </button>
                <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handleClear}
                    disabled={status === 'loading'}
                >
                    Clear
                </button>
            </div>

            {/* Display Area */}
            {status === 'loading' && <p className="text-blue-500">Loading ABNs...</p>}
            {error && <p className="text-red-500">Error: {error.message || error}</p>}

            {status === 'succeeded' && abns.length === 0 && <p className="text-gray-600">No ABNs found matching your criteria.</p>}

            {status === 'succeeded' && abns.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Search Results ({totalCount} total)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-2 px-4 border-b">ABN</th>
                                    <th className="py-2 px-4 border-b">Legal Name</th>
                                    <th className="py-2 px-4 border-b">Type</th>
                                    <th className="py-2 px-4 border-b">Status</th>
                                    <th className="py-2 px-4 border-b">State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abns.map((abnItem) => (
                                    <tr key={abnItem.abn} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleAbnClick(abnItem.abn)}>
                                        <td className="py-2 px-4 border-b text-blue-600 underline">{abnItem.abn}</td>
                                        <td className="py-2 px-4 border-b">{abnItem.legal_name}</td>
                                        <td className="py-2 px-4 border-b">{abnItem.entity_type}</td>
                                        <td className="py-2 px-4 border-b">{abnItem.abn_status}</td>
                                        <td className="py-2 px-4 border-b">{abnItem.main_location_state}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center items-center gap-4">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || status === 'loading'}
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || status === 'loading'}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AbnSearchPage;