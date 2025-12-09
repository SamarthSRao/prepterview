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
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex justify-end items-center space-x-4">
                    <button
                        onClick={() => setShowCategoryForm(!showCategoryForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        + New Category
                    </button>
                    <button
                        onClick={() => setShowQuestionForm(!showQuestionForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        + New Question
                    </button>
                    <button
                        onClick={() => handleDeleteCategory()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                        Delete Category
                    </button>
                </div>

                {/* Forms */}
                {showCategoryForm && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-xl font-semibold mb-4">Add Category</h2>
                        <form onSubmit={handleCreateCategory} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Category Name"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Save</button>
                        </form>
                    </div>
                )}

                {showQuestionForm && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-xl font-semibold mb-4">Add Question</h2>
                        <form onSubmit={handleCreateQuestion} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    value={questionForm.category_id}
                                    onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}
                                    className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select
                                    value={questionForm.difficulty}
                                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                    className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Question"
                                value={questionForm.question}
                                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                            <textarea
                                placeholder="Answer"
                                value={questionForm.answer}
                                onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                                className="w-full border border-gray-300 p-2 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <textarea
                                placeholder="Context (optional)"
                                value={questionForm.context}
                                onChange={(e) => setQuestionForm({ ...questionForm, context: e.target.value })}
                                className="w-full border border-gray-300 p-2 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Question</button>
                        </form>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-gray-500 mb-3 uppercase text-sm">Categories</h3>
                            <ul className="space-y-2">
                                <li>
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                                    >
                                        All Questions
                                    </button>
                                </li>
                                {categories.map(c => (
                                    <li key={c.id}>
                                        <button
                                            onClick={() => setSelectedCategory(c.id.toString())}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === c.id.toString() ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                                        >
                                            {c.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Question List */}
                    <div className="flex-1 space-y-4">
                        {questions.map(q => (
                            <div key={q.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                            q.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {q.difficulty}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{q.question}</h3>
                                <div className="bg-gray-50 p-4 rounded text-gray-700 whitespace-pre-wrap">
                                    {q.answer || 'No answer provided.'}
                                </div>
                                {q.context && (
                                    <div className="mt-3 bg-blue-50 p-3 rounded text-sm text-blue-800">
                                        <strong>Context:</strong> {q.context}
                                    </div>
                                )}
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="text-center text-gray-500 py-12 bg-white rounded-lg">
                                No questions found. Add some!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewPrep;
