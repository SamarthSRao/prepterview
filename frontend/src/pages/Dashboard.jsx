import React from 'react';
import KeywordSection from '../components/KeywordSection';

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <KeywordSection />
            </div>
        </div>
    );
};

export default Dashboard;
