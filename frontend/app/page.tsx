'use client';
import { useEffect, useState } from 'react';

interface ApiHealthResponse {
    status: string;
    database: string;
    version: string;
    timestamp: string;
}

export default function Home() {
    const [apiData, setApiData] = useState<ApiHealthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                setApiData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('API Error:', err);
                setLoading(false);
            });
    }, []);

    return (
        <main className="min-h-screen p-8 bg-linear-to-br from-blue-50 to-green-50">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Version Badge - Change this color for each deployment */}
                    <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold mb-6">
                        Version 1.0 - BLUE
                    </div>

                    <h1 className="text-4xl font-bold mb-4 text-gray-800">
                        Blue-Green Deployment Demo
                    </h1>

                    <p className="text-gray-600 mb-8">
                        This is a Next.js frontend connecting to a Flask backend with PostgreSQL
                    </p>

                    {/* API Health Check */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Backend Health Status</h2>
                        {loading ? (
                            <p className="text-gray-500">Checking backend...</p>
                        ) : apiData ? (
                            <div className="space-y-2">
                                <p className="text-green-600 font-semibold">✅ Backend Connected</p>
                                <div className="text-sm text-gray-600">
                                    <p><strong>Status:</strong> {apiData.status}</p>
                                    <p><strong>Database:</strong> {apiData.database}</p>
                                    <p><strong>Version:</strong> {apiData.version}</p>
                                    <p><strong>Timestamp:</strong> {apiData.timestamp}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-600">❌ Backend Unavailable</p>
                        )}
                    </div>

                    {/* Deployment Info */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">Deployment Notes:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Change the version badge color to verify deployments</li>
                            <li>• Blue-Green allows instant rollback if issues occur</li>
                            <li>• Zero downtime during version switches</li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}