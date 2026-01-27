import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet, NavLink } from 'react-router-dom'
import { Activity, Calendar, PieChart, Home, Utensils } from 'lucide-react'
import './index.css'

import Journal from './pages/Journal'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Recipes from './pages/Recipes'
import Ingredients from './pages/Ingredients'

// Placeholder Pages

const Layout = () => {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <Activity className="icon" />
                    <span>HealthTracker</span>
                </div>
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
        path: "/",
        element: <Layout />,
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
        <RouterProvider router={router} />
    )
}

export default App
