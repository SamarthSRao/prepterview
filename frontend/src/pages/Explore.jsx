import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`;

const Explore = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const fetchUsers = async (query) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/users/search`, {
                params: { q: query },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-8">Explore Developers</h1>

            <div className="relative mb-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-4 border border-neutral-800 rounded-xl bg-neutral-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => navigate(`/profile/${user.id}`)}
                            className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl cursor-pointer hover:border-green-500/50 hover:bg-neutral-800/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-black font-bold text-lg">
                                    {user.first_name?.[0] || '?'}
                                    {user.last_name?.[0] || ''}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold group-hover:text-green-400 transition-colors">
                                        {user.first_name || 'Unknown'} {user.last_name || ''}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && searchQuery && users.length === 0 && (
                        <p className="text-gray-500 text-center col-span-2 py-10">No users found matching "{searchQuery}"</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Explore;
