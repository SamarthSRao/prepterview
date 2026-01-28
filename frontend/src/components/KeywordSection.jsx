import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const KeywordSection = () => {
    const [keywords, setKeywords] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [definition, setDefinition] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editKeyword, setEditKeyword] = useState('');
    const [editDefinition, setEditDefinition] = useState('');

    const { token } = useAuth();

    useEffect(() => {
        fetchKeywords();
    }, [token]);

    const fetchKeywords = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8081/keywords', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setKeywords(response.data.keywords);
            setError('');
        } catch (err) {
            console.error('Error fetching keywords:', err);
            setError('Failed to fetch keywords');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        if (!keyword.trim() || !definition.trim()) {
            setError('Please fill in both fields');
            return;
        }

        try {
            await axios.post(
                'http://localhost:8080/keywords',
                { keyword, definition },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setKeyword('');
            setDefinition('');
            setError('');
            fetchKeywords();
        } catch (err) {
            console.error('Error adding keyword:', err);
            setError(err.response?.data?.error || 'Failed to add keyword');
        }
    };

    const handleUpdateKeyword = async (id) => {
        if (!editKeyword.trim() || !editDefinition.trim()) {
            setError('Please fill in both fields');
            return;
        }

        try {
            await axios.put(
                `http://localhost:8080/keywords/${id}`,
                { keyword: editKeyword, definition: editDefinition },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setEditingId(null);
            setEditKeyword('');
            setEditDefinition('');
            setError('');
            fetchKeywords();
        } catch (err) {
            console.error('Error updating keyword:', err);
            setError(err.response?.data?.error || 'Failed to update keyword');
        }
    };

    const handleDeleteKeyword = async (id) => {
        if (!window.confirm('Are you sure you want to delete this keyword?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/keywords/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setError('');
            fetchKeywords();
        } catch (err) {
            console.error('Error deleting keyword:', err);
            setError(err.response?.data?.error || 'Failed to delete keyword');
        }
    };

    const startEdit = (keyword) => {
        setEditingId(keyword.id);
        setEditKeyword(keyword.keyword);
        setEditDefinition(keyword.definition);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditKeyword('');
        setEditDefinition('');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Keyword Definitions
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Add Keyword Form */}
            <form onSubmit={handleAddKeyword} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label
                            htmlFor="keyword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Keyword
                        </label>
                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter keyword"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="definition"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Definition
                        </label>
                        <input
                            type="text"
                            id="definition"
                            value={definition}
                            onChange={(e) => setDefinition(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter definition"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                    Add Keyword
                </button>
            </form>

            {/* Keywords List */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Keywords</h3>
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">
                        Loading keywords...
                    </div>
                ) : keywords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No keywords added yet. Start adding your first keyword above!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {keywords.map((item) => (
                            <div
                                key={item.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                            >
                                {editingId === item.id ? (
                                    <div>
                                        <div className="mb-3">
                                            <label
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                            >
                                                Keyword
                                            </label>
                                            <input
                                                type="text"
                                                value={editKeyword}
                                                onChange={(e) => setEditKeyword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                            >
                                                Definition
                                            </label>
                                            <input
                                                type="text"
                                                value={editDefinition}
                                                onChange={(e) => setEditDefinition(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateKeyword(item.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="font-semibold text-lg text-gray-800 mb-2">
                                            {item.keyword}
                                        </h4>
                                        <p className="text-gray-600 mb-4">{item.definition}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKeyword(item.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeywordSection;
