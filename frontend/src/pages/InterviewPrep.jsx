import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`;

function InterviewPrep() {
    const [categories, setCategories] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);

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

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-72 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900">Categories</h3>
                        <button
                            onClick={() => setShowCategoryForm(!showCategoryForm)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                            + Add
                        </button>
                    </div>

                    {showCategoryForm && (
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                            <form onSubmit={handleCreateCategory} className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition">Save</button>
                                    <button type="button" onClick={() => setShowCategoryForm(false)} className="flex-1 bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${!selectedCategory ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span>All Questions</span>
                            {!selectedCategory && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                        </button>

                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id.toString())}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${selectedCategory === c.id.toString() ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className="truncate">{c.name}</span>
                                {selectedCategory === c.id.toString() && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={handleDeleteCategory}
                                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Category
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {selectedCategory
                            ? categories.find(c => c.id.toString() === selectedCategory)?.name
                            : 'All Questions'}
                        <span className="ml-3 text-sm font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {questions.length}
                        </span>
                    </h2>
                    <button
                        onClick={() => setShowQuestionForm(!showQuestionForm)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 font-medium text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Question
                    </button>
                </div>

                {showQuestionForm && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-fade-in ring-1 ring-indigo-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">New Question</h3>
                            <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateQuestion} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                    <select
                                        value={questionForm.category_id}
                                        onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Difficulty</label>
                                    <select
                                        value={questionForm.difficulty}
                                        onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Question</label>
                                <input
                                    type="text"
                                    placeholder="What is the difference between..."
                                    value={questionForm.question}
                                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Answer</label>
                                <textarea
                                    placeholder="The main difference is..."
                                    value={questionForm.answer}
                                    onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32 resize-y"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Context / Notes (Optional)</label>
                                <textarea
                                    placeholder="Asked in Google interview..."
                                    value={questionForm.context}
                                    onChange={(e) => setQuestionForm({ ...questionForm, context: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20 resize-y"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowQuestionForm(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save Question</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q.id} className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border
                                        ${q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(q.created_at || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-rose-50 rounded"
                                    title="Delete Question"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-snug">{q.question}</h3>

                            <div className="prose prose-slate prose-sm max-w-none text-slate-600 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                <p className="whitespace-pre-wrap leading-relaxed">{q.answer || 'No answer provided yet.'}</p>
                            </div>

                            {q.context && (
                                <div className="mt-4 flex items-start gap-2 text-sm text-indigo-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{q.context}</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No questions found</h3>
                            <p className="text-slate-500 mb-6">Get started by adding your first interview question!</p>
                            <button
                                onClick={() => setShowQuestionForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Question
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InterviewPrep;
