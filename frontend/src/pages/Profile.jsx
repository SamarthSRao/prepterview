import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ContributionGrid = ({ contributions }) => {
    // Generate last 365 days
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }

    const contribMap = contributions.reduce((acc, curr) => {
        acc[curr.date] = curr.count;
        return acc;
    }, {});

    const getColor = (count) => {
        if (!count) return 'bg-neutral-900';
        if (count < 2) return 'bg-green-900';
        if (count < 5) return 'bg-green-700';
        if (count < 10) return 'bg-green-500';
        return 'bg-green-300';
    };

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 overflow-x-auto">
            <h3 className="text-gray-400 text-sm mb-4">Contribution Activity</h3>
            <div className="flex gap-1 min-w-max">
                <div className="grid grid-rows-7 grid-flow-col gap-1">
                    {days.map(date => (
                        <div
                            key={date}
                            title={`${date}: ${contribMap[date] || 0} contributions`}
                            className={`w-3 h-3 rounded-sm ${getColor(contribMap[date])} transition-colors hover:ring-1 hover:ring-white`}
                        />
                    ))}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 justify-end">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 bg-neutral-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [questionSearch, setQuestionSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { token, user: currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Fetch profile and contributions
                const profileRes = await fetch(`http://localhost:8081/api/users/${id}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const profileData = await profileRes.json();

                // Fetch questions
                const questionsRes = await fetch(`http://localhost:8081/api/users/${id}/questions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const questionsData = await questionsRes.json();

                if (profileRes.ok) setProfile(profileData);
                if (questionsRes.ok) {
                    setQuestions(questionsData);
                    setFilteredQuestions(questionsData);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id, token]);

    useEffect(() => {
        const filtered = questions.filter(q =>
            q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
            (q.answer && q.answer.toLowerCase().includes(questionSearch.toLowerCase()))
        );
        setFilteredQuestions(filtered);
    }, [questionSearch, questions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-white text-center py-20">User not found</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header / Info Section */}
            <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
                <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-black font-bold text-4xl shadow-lg shadow-green-500/20">
                    {profile.user.first_name[0]}
                    {profile.user.last_name[0]}
                </div>
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {profile.user.first_name} {profile.user.last_name}
                    </h1>
                    <p className="text-gray-400 text-lg mb-4">{profile.user.email}</p>
                    <div className="flex gap-4">
                        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
                            <span className="text-gray-500 text-sm">Total Contributions</span>
                            <p className="text-white font-bold text-xl">{profile.total_questions}</p>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
                            <span className="text-gray-500 text-sm">Member Since</span>
                            <p className="text-white font-bold text-lg">
                                {new Date(profile.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
                {currentUser?.id === parseInt(id) && (
                    <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl border border-neutral-700 transition-colors">
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Contribution Chart */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-white mb-4">Contribution Status</h2>
                <ContributionGrid contributions={profile.contributions} />
            </div>

            {/* Questions List */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h2 className="text-2xl font-bold text-white">Shared Questions ({filteredQuestions.length})</h2>
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search questions..."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all pl-10"
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((q) => (
                            <div key={q.id} className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl hover:border-neutral-700 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-white font-medium text-lg leading-relaxed flex-1 pr-4">{q.question}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                                        q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                </div>
                                {q.answer && (
                                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-neutral-800/50">
                                        <p className="text-gray-400 text-sm leading-relaxed">{q.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-neutral-900/50 border border-neutral-800 border-dashed p-12 rounded-2xl text-center">
                            <p className="text-gray-500">No questions shared yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
