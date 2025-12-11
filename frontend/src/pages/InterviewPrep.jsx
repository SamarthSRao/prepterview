import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`;

function InterviewPrep() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [requests, setRequests] = useState([]);

    // Form states
    const [newCategory, setNewCategory] = useState('');
    const [questionForm, setQuestionForm] = useState({
        question: '',
        answer: '',
        context: '',
        difficulty: 'Medium',
        category_id: ''
    });

    useEffect(() => {
        fetchCategories();
        fetchQuestions();
    }, []);

    useEffect(() => {
        fetchQuestions(selectedCategory);
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_URL}/categories`);
            if (Array.isArray(res.data)) {
                setCategories(res.data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error(err);
            setCategories([]);
        }
    };

    const fetchQuestions = async (catId = '') => {
        try {
            const url = catId ? `${API_URL}/questions?category_id=${catId}` : `${API_URL}/questions`;
            const res = await axios.get(url);
            if (Array.isArray(res.data)) {
                setQuestions(res.data);
            } else {
                setQuestions([]);
            }
        } catch (err) {
            console.error(err);
            setQuestions([]);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/categories`, { name: newCategory });
            setNewCategory('');
            setShowCategoryForm(false);
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error creating category');
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/questions`, {
                ...questionForm,
                category_id: parseInt(questionForm.category_id)
            });
            setQuestionForm({ question: '', answer: '', context: '', difficulty: 'Medium', category_id: '' });
            setShowQuestionForm(false);
            fetchQuestions(selectedCategory);
        } catch (err) {
            alert('Error creating question');
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/questions/${id}`);
            fetchQuestions(selectedCategory);
        } catch (err) {
            alert('Error deleting question');
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) {
            alert('Please select a category to delete');
            return;
        }
        const confirmed = window.confirm('Are you sure you want to delete this category? All associated questions will also be deleted.');
        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/categories/${selectedCategory}`);
            setSelectedCategory('');
            fetchCategories();
            fetchQuestions();
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.response?.data?.error || 'Error deleting category');
        }
    };

    const handleRequestAccess = async () => {
        try {
            await axios.post(`${API_URL}/categories/${selectedCategory}/request-access`);
            alert('Request sent! Waiting for approval.');
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.error || 'Error sending request');
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/categories/${selectedCategory}/requests`);
            setRequests(res.data);
            setShowRequestsModal(true);
        } catch (err) {
            console.error(err);
            alert('Error fetching requests');
        }
    };

    const handleRespond = async (reqId, status) => {
        try {
            await axios.post(`${API_URL}/categories/${selectedCategory}/requests/${reqId}/respond`, { status });
            // Refresh requests list
            const res = await axios.get(`${API_URL}/categories/${selectedCategory}/requests`);
            setRequests(res.data);
        } catch (err) {
            alert('Error updating status');
        }
    };

    const currentCategory = categories.find(c => c.id.toString() === selectedCategory);



    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-72 flex-shrink-0">
                <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden sticky top-24">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-200">Categories</h3>
                        <button
                            onClick={() => setShowCategoryForm(!showCategoryForm)}
                            className="text-green-500 hover:text-green-400 text-sm font-medium"
                        >
                            + Add
                        </button>
                    </div>

                    {showCategoryForm && (
                        <div className="p-4 bg-neutral-800 border-b border-neutral-700">
                            <form onSubmit={handleCreateCategory} className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-green-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500 transition">Save</button>
                                    <button type="button" onClick={() => setShowCategoryForm(false)} className="flex-1 bg-neutral-700 text-gray-300 border border-neutral-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-neutral-600 transition">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${!selectedCategory ? 'bg-green-500/10 text-green-500' : 'text-gray-400 hover:bg-neutral-800 hover:text-gray-200'}`}
                        >
                            <span>All Questions</span>
                            {!selectedCategory && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                        </button>

                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id.toString())}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col gap-1 group ${selectedCategory === c.id.toString() ? 'bg-green-500/10 text-green-500' : 'text-gray-400 hover:bg-neutral-800 hover:text-gray-200'}`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="truncate">{c.name}</span>
                                    {selectedCategory === c.id.toString() && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-600 group-hover:text-gray-500">
                                    by {c.creator_name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {
                        selectedCategory && String(currentCategory?.user_id) === String(user?.id || user?.user_id) && (
                            <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex flex-col gap-2">
                                <button
                                    onClick={fetchRequests}
                                    className="w-full flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Manage Requests
                                </button>
                                <button
                                    onClick={handleDeleteCategory}
                                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Category
                                </button>
                            </div>
                        )
                    }
                </div >
            </aside >

            {/* Main Content */}
            < div className="flex-1 min-w-0" >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {selectedCategory
                            ? categories.find(c => c.id.toString() === selectedCategory)?.name
                            : 'All Questions'}
                        <span className="ml-3 text-sm font-normal text-gray-500 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800">
                            {questions.length}
                        </span>
                    </h2>
                    {currentCategory?.has_permission ? (
                        <button
                            onClick={() => setShowQuestionForm(!showQuestionForm)}
                            className="bg-green-600 text-black px-4 py-2 rounded-lg hover:bg-green-500 transition-all duration-200 shadow-sm hover:shadow-green-500/20 flex items-center gap-2 font-bold text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Question
                        </button>
                    ) : currentCategory?.request_status === 'PENDING' ? (
                        <span className="text-yellow-500 text-sm font-medium bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-900/50">
                            Request Pending
                        </span>
                    ) : selectedCategory ? (
                        <button
                            onClick={handleRequestAccess}
                            className="bg-neutral-800 text-gray-300 px-4 py-2 rounded-lg hover:bg-neutral-700 transition-all duration-200 border border-neutral-700 flex items-center gap-2 font-bold text-sm"
                        >
                            Request Access
                        </button>
                    ) : null}
                </div>

                {
                    showQuestionForm && (
                        <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 mb-8 animate-fade-in ring-1 ring-green-500/20">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-white">New Question</h3>
                                <button onClick={() => setShowQuestionForm(false)} className="text-gray-500 hover:text-gray-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateQuestion} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                                        <select
                                            value={questionForm.category_id}
                                            onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}
                                            className="w-full border border-neutral-700 bg-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Difficulty</label>
                                        <select
                                            value={questionForm.difficulty}
                                            onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                            className="w-full border border-neutral-700 bg-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Question</label>
                                    <input
                                        type="text"
                                        placeholder="What is the difference between..."
                                        value={questionForm.question}
                                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                        className="w-full border border-neutral-700 bg-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Answer</label>
                                    <textarea
                                        placeholder="The main difference is..."
                                        value={questionForm.answer}
                                        onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                                        className="w-full border border-neutral-700 bg-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-32 resize-y text-white placeholder-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Context / Notes (Optional)</label>
                                    <textarea
                                        placeholder="Asked in Google interview..."
                                        value={questionForm.context}
                                        onChange={(e) => setQuestionForm({ ...questionForm, context: e.target.value })}
                                        className="w-full border border-neutral-700 bg-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-y text-white placeholder-gray-600"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setShowQuestionForm(false)} className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-bold text-black bg-green-600 rounded-lg hover:bg-green-500 transition-colors shadow-sm shadow-green-900/20">Save Question</button>
                                </div>
                            </form>
                        </div>
                    )
                }

                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q.id} className="group bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-800 hover:border-green-500/50 transition-all duration-200">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border
                                        ${q.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400 border-green-900' :
                                            q.difficulty === 'Hard' ? 'bg-red-900/30 text-red-400 border-red-900' :
                                                'bg-yellow-900/30 text-yellow-400 border-yellow-900'}`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(q.created_at || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-900/20 rounded"
                                    title="Delete Question"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-100 mb-3 leading-snug">{q.question}</h3>

                            <div className="prose prose-invert prose-sm max-w-none text-gray-400 bg-black/30 p-4 rounded-lg border border-neutral-800">
                                <p className="whitespace-pre-wrap leading-relaxed">{q.answer || 'No answer provided yet.'}</p>
                            </div>

                            {q.context && (
                                <div className="mt-4 flex items-start gap-2 text-sm text-green-400 bg-green-900/10 p-3 rounded-lg border border-green-900/20">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{q.context}</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-16 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                            <div className="bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">No questions found</h3>
                            <p className="text-gray-500 mb-6">Get started by adding your first interview question!</p>
                            <button
                                onClick={() => setShowQuestionForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-black bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Question
                            </button>
                        </div>
                    )}
                </div>
            </div >
            {/* Requests Modal */}
            {
                showRequestsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-neutral-900 w-full max-w-md rounded-xl border border-neutral-800 shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Access Requests</h3>
                                <button onClick={() => setShowRequestsModal(false)} className="text-gray-500 hover:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                {requests.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No pending requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {requests.map(req => (
                                            <div key={req.id} className="bg-black p-3 rounded-lg border border-neutral-800 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-200">{req.user.first_name} {req.user.last_name}</p>
                                                    <p className="text-xs text-gray-500">{req.user.email}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRespond(req.id, 'APPROVED')}
                                                        className="p-1.5 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition"
                                                        title="Approve"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespond(req.id, 'REJECTED')}
                                                        className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition"
                                                        title="Reject"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default InterviewPrep;
