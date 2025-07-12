// frontend/src/components/AbnDetailPage.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAbnDetails } from '../store/features/abnSlice'; // Corrected path

function AbnDetailPage() {
    const { abn } = useParams(); // Get ABN from URL parameters (e.g., from /abns/12345678901)
    const navigate = useNavigate(); // Hook to navigate back to search page
    const dispatch = useDispatch(); // Hook to dispatch Redux actions

    // Get state from Redux store
    const { selectedAbn, status, error } = useSelector(state => state.abn);

    // Effect to fetch ABN details when the ABN parameter in the URL changes
    useEffect(() => {
        if (abn) { // Only fetch if ABN parameter is present
            dispatch(fetchAbnDetails(abn)); // Dispatch async thunk to fetch details
        }
    }, [abn, dispatch]); // Dependency array: re-run effect if abn param or dispatch changes

    // --- Render based on loading, error, or data status ---
    if (status === 'loading') {
        return <div className="text-center text-blue-500 text-xl mt-8">Loading ABN details...</div>;
    }

    if (error) {
        return (
            <div className="text-center mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error.message || error}
                <button
                    className="block mx-auto mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => navigate('/')}
                >
                    Back to Search
                </button>
            </div>
        );
    }

    if (!selectedAbn) {
        // This might happen if API returns 404 or on initial load before fetch completes
        return (
            <div className="text-center mt-8 p-4 bg-gray-100 border border-gray-400 text-gray-700 rounded">
                ABN details not found or not yet loaded.
                <button
                    className="block mx-auto mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => navigate('/')}
                >
                    Back to Search
                </button>
            </div>
        );
    }

    // --- Render ABN Details ---
    return (
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
            <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mb-4"
                onClick={() => navigate(-1)} // Go back to the previous page (search results)
            >
                &larr; Back to Search Results
            </button>

            <h2 className="text-2xl font-bold text-blue-700 mb-4">ABN: {selectedAbn.abn}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                <div className="mb-2">
                    <p className="font-semibold">Legal Name:</p>
                    <p>{selectedAbn.legal_name || 'N/A'}</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">Entity Type:</p>
                    <p>{selectedAbn.entity_type || 'N/A'}</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">ABN Status:</p>
                    <p>{selectedAbn.abn_status || 'N/A'} (as of {selectedAbn.abn_status_date ? new Date(selectedAbn.abn_status_date).toLocaleDateString() : 'N/A'})</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">Main Location:</p>
                    <p>{selectedAbn.main_location_state || 'N/A'}, {selectedAbn.main_location_postcode || 'N/A'}</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">ACN/ARBN:</p>
                    <p>{selectedAbn.acn_arbn || 'N/A'}</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">GST Status:</p>
                    <p>{selectedAbn.gst_status ? 'Registered' : 'Not Registered'} (as of {selectedAbn.gst_registration_date ? new Date(selectedAbn.gst_registration_date).toLocaleDateString() : 'N/A'})</p>
                </div>
                <div className="mb-2">
                    <p className="font-semibold">DGR Status:</p>
                    <p>{selectedAbn.dgr_status ? 'Registered' : 'Not Registered'} (as of {selectedAbn.dgr_effective_date ? new Date(selectedAbn.dgr_effective_date).toLocaleDateString() : 'N/A'})</p>
                </div>
            </div>

            {selectedAbn.other_names && selectedAbn.other_names.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Other Names:</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {selectedAbn.other_names.map((otherName, index) => (
                            <li key={index} className="text-gray-700">
                                <span className="font-medium">{otherName.name_type}:</span> {otherName.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default AbnDetailPage;