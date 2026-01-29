import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // Important: Send session cookie
            });
            // Handle HTTP errors or non-JSON responses gracefully
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = () => {
        // If in development (localhost:5173), we need to hit standard API URL (localhost:3001)
        // If in production, API_BASE_URL is '' (relative), so we go to /auth/google
        const url = API_BASE_URL ? `${API_BASE_URL}/auth/google` : '/auth/google';
        window.location.href = url;
    };

    const logout = async () => {
        const url = API_BASE_URL ? `${API_BASE_URL}/auth/logout` : '/auth/logout';
        window.location.href = url;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
