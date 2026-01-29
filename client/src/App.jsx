import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet, NavLink, Navigate } from 'react-router-dom'
import { Activity, Calendar, PieChart, Home, Utensils, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'

import Journal from './pages/Journal'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Recipes from './pages/Recipes'
import Ingredients from './pages/Ingredients'
import Login from './pages/Login'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="loading-screen">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
};

const Layout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <Activity className="icon" />
                    <span>HealthTracker</span>
                </div>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.avatar ?
                            <img src={user.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            : <span style={{ fontSize: '0.8rem' }}>{user.name}</span>
                        }
                        <button onClick={logout} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                )}
            </header>

            <main className="app-main">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Home size={24} />
                    <span>Accueil</span>
                </NavLink>
                <NavLink to="/journal" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Calendar size={24} />
                    <span>Journal</span>
                </NavLink>
                <NavLink to="/analysis" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <PieChart size={24} />
                    <span>Analyse</span>
                </NavLink>
                <NavLink to="/recipes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Utensils size={24} />
                    <span>Cuisine</span>
                </NavLink>
            </nav>
        </div>
    )
}

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/",
        element: <ProtectedRoute><Layout /></ProtectedRoute>,
        children: [
            { path: "/", element: <Dashboard /> },
            { path: "/journal", element: <Journal /> },
            { path: "/analysis", element: <Analysis /> },
            { path: "/recipes", element: <Recipes /> },
            { path: "/ingredients", element: <Ingredients /> },
        ]
    }
])

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    )
}

export default App
