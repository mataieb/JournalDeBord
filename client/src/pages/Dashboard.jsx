import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { Activity, Droplets, Flame, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState({
        calories: 0,
        water: 0,
        mood: 'Neutre',
        exercises: 0
    });
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthData, setMonthData] = useState([]);

    useEffect(() => {
        fetchToday();
        fetchMonthData();
    }, [currentDate]);

    const fetchToday = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`${API_BASE_URL}/api/log/${today}?timestamp=${new Date().getTime()}`, { credentials: 'include' });
            const data = await res.json();

            const calories = data.foods.reduce((acc, item) => acc + (item.calories || 0), 0);
            const water = data.drinks.reduce((acc, item) => acc + (item.volumeMl || 0), 0);
            const exercises = data.exercises.length;

            // Logic for 'Intestin' card
            let mood = 'Pas de données';
            if (data.gutHealth) {
                // If there are symptoms => Show 'Symptômes'
                // Else if there is a dailyScore => Show Score/5
                // Else => 'Bien'
                if (data.gutHealth.symptoms && data.gutHealth.symptoms !== '{}') {
                    mood = 'Symptômes';
                } else if (data.gutHealth.dailyScore) {
                    mood = `${data.gutHealth.dailyScore}/5`;
                } else {
                    mood = 'Bien';
                }
            }

            setSummary({ calories, water, mood, exercises });
        } catch (err) { console.error(err); }
    };

    const fetchMonthData = async () => {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const res = await fetch(`${API_BASE_URL}/api/log/month/${year}/${month}`, { credentials: 'include' });
            const data = await res.json();
            setMonthData(data);
        } catch (err) { console.error(err); }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);

        const minDate = new Date(2026, 0, 1);
        if (newDate < minDate) return;

        setCurrentDate(newDate);
    };

    return (
        <div className="page" style={{ padding: '20px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2rem', fontWeight: '700',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    Bienvenue, {user?.name?.split(' ')[0] || 'Voyageur'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Voici votre résumé mensuel de sommeil et santé intestinale</p>
            </header>

            {/* Calendars Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Gut Health Calendar */}
                <section className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={() => changeMonth(-1)}
                            disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                opacity: (currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0) ? 0.3 : 1
                            }}
                        >
                            <ChevronLeft />
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>
                            Intestin - {currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight /></button>
                    </div>
                    <CalendarGrid currentDate={currentDate} monthData={monthData} type="gut" />
                </section>

                {/* Sleep Calendar */}
                <section className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={() => changeMonth(-1)}
                            disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                opacity: (currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0) ? 0.3 : 1
                            }}
                        >
                            <ChevronLeft />
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>
                            Sommeil - {currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight /></button>
                    </div>
                    <CalendarGrid currentDate={currentDate} monthData={monthData} type="sleep" />
                </section>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <SummaryCard icon={<Flame size={24} color="#f87171" />} label="Calories" value={`${summary.calories} kcal`} />
                <SummaryCard icon={<Droplets size={24} color="#60a5fa" />} label="Eau" value={`${summary.water} ml`} />
                <SummaryCard icon={<Activity size={24} color="#a78bfa" />} label="Sport" value={`${summary.exercises} sessions`} />
                <SummaryCard icon={<Brain size={24} color="#34d399" />} label="Intestin" value={summary.mood} />
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value }) => (
    <div className="card" style={{ alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>{icon}</div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}</span>
    </div>
);

const CalendarGrid = ({ currentDate, monthData, type }) => {
    const navigate = useNavigate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ height: '32px' }}></div>);
    }

    const getColor = (score) => {
        if (!score) return 'var(--bg-tertiary)';
        if (score === 1) return '#ef4444'; // Red
        if (score === 2) return '#f97316'; // Orange
        if (score === 3) return '#eab308'; // Yellow
        if (score === 4) return '#84cc16'; // Light Green
        if (score === 5) return '#15803d'; // Dark Green
        return 'var(--bg-tertiary)';
    };

    for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month, d);
        const isFuture = dayDate > today;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayLog = monthData.find(m => m.date === dateStr);

        const score = type === 'gut' ? dayLog?.gutScore : dayLog?.sleepScore;
        let bg = getColor(score);

        if (isFuture) bg = 'rgba(255,255,255,0.05)';

        days.push(
            <div
                key={d}
                onClick={() => !isFuture && navigate(`/journal?date=${dateStr}`)}
                style={{
                    height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600',
                    color: isFuture ? 'var(--text-muted)' : (score ? 'white' : 'var(--text-secondary)'),
                    cursor: isFuture ? 'default' : 'pointer',
                    opacity: isFuture ? 0.3 : 1,
                    transition: 'transform 0.2s',
                    border: dayDate.getTime() === today.getTime() ? '1px solid white' : 'none'
                }}
                title={isFuture ? 'Futur' : (score ? `Score: ${score}` : 'Pas de note')}
                className={!isFuture ? 'hover-scale' : ''}
            >
                {d}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {day}
                </div>
            ))}
            {days}
        </div>
    );
};

export default Dashboard;
