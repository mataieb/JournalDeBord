import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';

const Journal = () => {
    // Helper to get local date string YYYY-MM-DD
    const toLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [searchParams] = React.useMemo(() => [new URLSearchParams(window.location.search)], [window.location.search]);
    const initialDate = searchParams.get('date') || toLocalDateString(new Date());
    const [date, setDate] = useState(initialDate);
    const [recipes, setRecipes] = useState([]);
    const [log, setLog] = useState({
        foods: [],
        drinks: [],
        habits: [],
        exercises: [],
        gutHealth: null,
        sleep: null
    });
    const [loading, setLoading] = useState(false);

    // Assembly Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedFoodIds, setSelectedFoodIds] = useState(new Set());

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedFoodIds(new Set());
    };

    const toggleFoodSelection = (id) => {
        const newSet = new Set(selectedFoodIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFoodIds(newSet);
    };

    const handleCreateAssembly = async () => {
        const name = prompt("Nom de l'assemblage (ex: Poulet Riz Brocolis) :");
        if (!name) return;

        try {
            const res = await fetch('${API_BASE_URL}/api/recipes/assemble', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    foodItemIds: Array.from(selectedFoodIds),
                    date
                })
            });

            if (res.ok) {
                fetchLog();
                setIsSelectionMode(false);
                setSelectedFoodIds(new Set());
                alert("Assemblage créé avec succès !");
            } else {
                alert("Erreur lors de la création de l'assemblage");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau");
        }
    };

    useEffect(() => {
        fetchLog();
        fetchRecipes();
    }, [date]);

    const fetchRecipes = async () => {
        try {
            const res = await fetch('${API_BASE_URL}/api/recipes');
            const data = await res.json();
            setRecipes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching recipes:', err);
        }
    };

    const fetchLog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/${date}`);
            const data = await res.json();
            setLog(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (type, data) => {
        try {
            const res = await fetch('${API_BASE_URL}/api/log/item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data, date })
            });
            if (res.ok) {
                fetchLog();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateStool = async (id, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/stool/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const deleteStool = async (id) => {
        if (!window.confirm("Supprimer cette entrée ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/stool/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const updateFood = async (id, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/food/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };
    const deleteFood = async (id) => {
        if (!window.confirm("Supprimer ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/food/${id}`, { method: 'DELETE' });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const updateDrink = async (id, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/drink/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };
    const deleteDrink = async (id) => {
        if (!window.confirm("Supprimer ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/drink/${id}`, { method: 'DELETE' });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const updateExercise = async (id, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/exercise/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };
    const deleteExercise = async (id) => {
        if (!window.confirm("Supprimer cette activité ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/exercise/${id}`, { method: 'DELETE' });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const updateHabit = async (id, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/habit/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };
    const deleteHabit = async (id) => {
        if (!window.confirm("Supprimer cette habitude ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/log/habit/${id}`, { method: 'DELETE' });
            if (res.ok) fetchLog();
        } catch (err) { console.error(err); }
    };

    const changeDate = (offset) => {
        const d = new Date(date);
        d.setDate(d.getDate() + offset);
        const newDateStr = d.toISOString().split('T')[0];

        const todayStr = toLocalDateString(new Date());
        const minStr = '2026-01-01';

        if (newDateStr > todayStr || newDateStr < minStr) return;

        setDate(newDateStr);
    };

    const isToday = date === toLocalDateString(new Date());
    const isMinDate = date === '2026-01-01';

    return (
        <div className="page" style={{ paddingBottom: '100px' }}>
            <header className="date-header" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', background: 'var(--bg-secondary)', marginBottom: '1rem',
                position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <button
                    onClick={() => changeDate(-1)}
                    disabled={isMinDate}
                    style={{ opacity: isMinDate ? 0.3 : 1, cursor: isMinDate ? 'default' : 'pointer' }}
                >
                    <ChevronLeft />
                </button>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                    {new Date(date).toLocaleDateString()}
                </h2>
                <button
                    onClick={() => changeDate(1)}
                    disabled={isToday}
                    style={{ opacity: isToday ? 0.3 : 1, cursor: isToday ? 'default' : 'pointer' }}
                >
                    <ChevronRight />
                </button>
            </header>

            <div className="sections" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                padding: '1rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    <section className="card" style={{ height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Alimentation</h3>
                            {log.foods.length > 1 && (
                                <button
                                    onClick={toggleSelectionMode}
                                    style={{
                                        fontSize: '0.8rem',
                                        background: isSelectionMode ? 'var(--bg-tertiary)' : 'transparent',
                                        border: '1px solid var(--border)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: isSelectionMode ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    {isSelectionMode ? 'Annuler' : 'Grouper'}
                                </button>
                            )}
                        </div>

                        {isSelectionMode && selectedFoodIds.size > 1 && (
                            <button
                                onClick={handleCreateAssembly}
                                className="btn-primary"
                                style={{ width: '100%', marginBottom: '1rem', fontSize: '0.9rem', justifyContent: 'center' }}
                            >
                                ✨ Créer un assemblage ({selectedFoodIds.size})
                            </button>
                        )}

                        {!isSelectionMode && <AddItemForm type="food" onAdd={addItem} recipes={recipes} />}

                        <FoodList
                            items={log.foods}
                            onUpdate={updateFood}
                            onDelete={deleteFood}
                            recipes={recipes}
                            selectionMode={isSelectionMode}
                            selectedIds={selectedFoodIds}
                            onToggleSelection={toggleFoodSelection}
                        />
                    </section>
                    <section className="card" style={{ height: 'fit-content' }}>
                        <h3>Boissons</h3>
                        <AddItemForm type="drink" onAdd={addItem} />
                        <DrinkList items={log.drinks} onUpdate={updateDrink} onDelete={deleteDrink} />
                    </section>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <section className="card" style={{ height: 'fit-content' }}>
                        <h3>Habitudes</h3>
                        <AddItemForm type="habit" onAdd={addItem} />
                        <HabitList items={log.habits} onUpdate={updateHabit} onDelete={deleteHabit} />
                    </section>
                    <section className="card" style={{ height: 'fit-content' }}>
                        <h3>Sport</h3>
                        <AddExerciseForm onAdd={addItem} />
                        <ExerciseList items={log.exercises} onUpdate={updateExercise} onDelete={deleteExercise} />
                    </section>
                    <section className="card" style={{ height: 'fit-content' }}>
                        <h3>Sommeil</h3>
                        <SleepForm data={log.sleep} onSave={(data) => addItem('sleep', data)} />
                    </section>
                </div>
                <section className="card">
                    <h3>Suivi Intestinal</h3>
                    <GutHealthForm
                        data={log.gutHealth}
                        onSave={(data) => addItem('gutHealth', data)}
                        onAddStool={(data) => addItem('stool', data)}
                        onUpdateStool={updateStool}
                        onDeleteStool={deleteStool}
                    />
                </section>
            </div>
        </div>
    );
};

const AddItemForm = ({ type, onAdd, recipes = [] }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(type === 'habit' ? 'cigarette' : 'dej');
    const [drinkType, setDrinkType] = useState('eau');
    const [period, setPeriod] = useState('matin');

    // Recipe search state
    const [showRecipeList, setShowRecipeList] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        let data = { name };
        if (type === 'food') {
            data.category = category;
            if (selectedRecipeId) {
                data.recipeId = selectedRecipeId;
            }
        }
        else if (type === 'drink') { data.type = drinkType; data.period = period; }
        else if (type === 'habit') data.category = category;
        console.log("SUBMITTING:", type, data);
        onAdd(type, data);
        setName('');
        setSelectedRecipeId(null);
        setShowRecipeList(false);
    };

    const handleRecipeSelect = (e, recipe) => {
        console.log("SELECTION DECLENCHEE pour:", recipe.name);
        e.preventDefault();
        e.stopPropagation();

        setName(recipe.name);
        setSelectedRecipeId(recipe.id);
        console.log("STATE UPDATE: Recipe ID set to", recipe.id);

        setShowRecipeList(false);
    };

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(name.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="add-form" style={{ flexWrap: 'wrap', gap: '0.5rem', position: 'relative' }}>
            <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                <input
                    type="text"
                    value={name}
                    onChange={e => {
                        setName(e.target.value);
                        if (type === 'food') setShowRecipeList(true);
                        if (selectedRecipeId) setSelectedRecipeId(null);
                    }}
                    onFocus={() => type === 'food' && setShowRecipeList(true)}
                    placeholder={type === 'food' ? "Aliment ou recette..." : type === 'drink' ? "Boisson..." : "Nom..."}
                    className="input"
                    style={{
                        width: '100%',
                        borderLeft: selectedRecipeId ? '3px solid var(--primary)' : '',
                        background: selectedRecipeId ? 'rgba(var(--primary-rgb), 0.1)' : ''
                    }}
                />

                {selectedRecipeId && (
                    <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 'bold', pointerEvents: 'none' }}>
                        📖 LIÉ
                    </div>
                )}

                {type === 'food' && showRecipeList && name.trim().length > 0 && filteredRecipes.length > 0 && (
                    <div className="glass" style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        zIndex: 100, maxHeight: '200px', overflowY: 'auto',
                        marginTop: '4px', border: '1px solid var(--border)', borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        {filteredRecipes.slice(0, 5).map(recipe => (
                            <button
                                key={recipe.id}
                                type="button"
                                onMouseDown={(e) => handleRecipeSelect(e, recipe)}
                                style={{
                                    width: '100%', padding: '10px 12px', cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'none', border: 'none', color: 'inherit', textAlign: 'left'
                                }}
                            >
                                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{recipe.name}</span>
                                <span style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', background: 'rgba(var(--primary-rgb), 0.2)', color: 'var(--primary)', fontWeight: 'bold' }}>RECETTE 📖</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {(type === 'food' || type === 'habit') && (
                <select value={category} onChange={e => setCategory(e.target.value)} className="input" style={{ width: 'auto' }}>
                    {type === 'food' ? (
                        <>{['petit-dej', 'dej', 'gouter', 'apero', 'diner', 'autre'].map(c => <option key={c} value={c}>{c}</option>)}</>
                    ) : (
                        <>{['cigarette', 'joint', 'autre'].map(c => <option key={c} value={c}>{c}</option>)}</>
                    )}
                </select>
            )}
            {type === 'drink' && (
                <><select value={drinkType} onChange={e => setDrinkType(e.target.value)} className="input" style={{ width: 'auto' }}>{['eau', 'cafe', 'jus', 'soda', 'alcool', 'lait', 'autre'].map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="input" style={{ width: 'auto' }}>{['matin', 'midi', 'aprem', 'soir', 'soiree', 'journee'].map(p => <option key={p} value={p}>{p}</option>)}</select></>
            )}
            <button type="submit" className="add-btn"><Plus size={20} /></button>
        </form>
    );
};

const AddExerciseForm = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Course à pied');
    const [duration, setDuration] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!type || !duration) return;
        onAdd('exercise', { name, type, durationMin: parseInt(duration) });
        setName(''); setType('Course à pied'); setDuration('');
    };
    const types = ["Course à pied", "Renforcement", "Etirements", "Yoga", "Volley-ball", "Natation", "Escalade", "Badminton"];
    return (
        <form onSubmit={handleSubmit} className="add-form-multi" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <select value={type} onChange={e => setType(e.target.value)} className="input" style={{ flex: 1, minWidth: '120px' }}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <input className="input" placeholder="Détails..." value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: '100px' }} />
            <input className="input" type="number" placeholder="Min" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '60px' }} />
            <button type="submit" className="add-btn"><Plus size={20} /></button>
        </form>
    );
};

const HabitList = ({ items, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCat, setEditCat] = useState('');
    const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); setEditCat(item.category || 'cigarette'); };
    const saveEdit = () => { onUpdate(editingId, { name: editName, category: editCat }); setEditingId(null); };
    return (
        <div className="list">
            {items.map(item => (
                <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                    {editingId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="input" style={{ flex: 1 }} />
                            <select value={editCat} onChange={e => setEditCat(e.target.value)} className="input"><option value="cigarette">Cigarette</option><option value="joint">Joint</option><option value="autre">Autre</option></select>
                            <button onClick={saveEdit}><Save size={16} /></button><button onClick={() => setEditingId(null)}>✖</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem' }}>{item.category === 'cigarette' ? '🚬' : item.category === 'joint' ? '🌿' : '✨'}</span><div><span style={{ display: 'block' }}>{item.name}</span>{item.category && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.category}</span>}</div></div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => startEdit(item)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button><button onClick={() => onDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const FoodList = ({ items, onUpdate, onDelete, recipes = [], selectionMode, selectedIds, onToggleSelection }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCat, setEditCat] = useState('');
    const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); setEditCat(item.category || 'autre'); };
    const saveEdit = () => { onUpdate(editingId, { name: editName, category: editCat }); setEditingId(null); };

    return (
        <div className="list">
            {items.map(item => (
                <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                    {editingId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}><input value={editName} onChange={e => setEditName(e.target.value)} className="input" style={{ flex: 1 }} /><select value={editCat} onChange={e => setEditCat(e.target.value)} className="input"><option value="petit-dej">Pt-Dej</option><option value="dej">Dej</option><option value="gouter">Goûter</option><option value="apero">Apéro</option><option value="diner">Dîner</option><option value="autre">Autre</option></select><button onClick={saveEdit}><Save size={16} /></button><button onClick={() => setEditingId(null)}>✖</button></div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {selectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => onToggleSelection(item.id)}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                    />
                                )}
                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{item.category || 'Autre'}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ textDecoration: selectionMode && selectedIds.has(item.id) ? 'line-through' : 'none', opacity: selectionMode && selectedIds.has(item.id) ? 0.5 : 1 }}>
                                        {item.name}
                                    </span>
                                    {item.recipeId && (
                                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            📖 {item.recipe?.type === 'ASSEMBLY' ? 'Assemblage' : 'Recette'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!selectionMode && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => startEdit(item)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
                                    <button onClick={() => onDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const DrinkList = ({ items, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('');
    const [editPeriod, setEditPeriod] = useState('');
    const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); setEditType(item.type || 'eau'); setEditPeriod(item.period || 'matin'); };
    const saveEdit = () => { onUpdate(editingId, { name: editName, type: editType, period: editPeriod }); setEditingId(null); };
    return (
        <div className="list">
            {items.map(item => (
                <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                    {editingId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><input value={editName} onChange={e => setEditName(e.target.value)} className="input" style={{ flex: 1, minWidth: '100px' }} /><select value={editType} onChange={e => setEditType(e.target.value)} className="input"><option value="eau">Eau</option><option value="cafe">Café</option><option value="jus">Jus</option><option value="soda">Soda</option><option value="alcool">Alcool</option><option value="lait">Lait</option><option value="autre">Autre</option></select><select value={editPeriod} onChange={e => setEditPeriod(e.target.value)} className="input"><option value="matin">Matin</option><option value="midi">Midi</option><option value="aprem">Aprem</option><option value="soir">Soir</option><option value="soiree">Soirée</option><option value="journee">Journée</option></select><button onClick={saveEdit}><Save size={16} /></button><button onClick={() => setEditingId(null)}>✖</button></div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem' }}>{item.type === 'eau' ? '💧' : item.type === 'alcool' ? '🍷' : item.type === 'cafe' ? '☕' : '🥤'}</span><div><span style={{ display: 'block' }}>{item.name}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.period}</span></div></div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => startEdit(item)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button><button onClick={() => onDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button></div></div>
                    )}
                </div>
            ))}
        </div>
    );
};

const ExerciseList = ({ items, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('');
    const [editDuration, setEditDuration] = useState('');
    const startEdit = (item) => { setEditingId(item.id); setEditName(item.name || ''); setEditType(item.type); setEditDuration(item.durationMin); };
    const saveEdit = () => { onUpdate(editingId, { name: editName, type: editType, durationMin: editDuration }); setEditingId(null); };
    const types = ["Course à pied", "Renforcement", "Etirements", "Yoga", "Volley-ball", "Natation", "Escalade", "Badminton"];
    return (
        <div className="list">
            {items.map(item => (
                <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                    {editingId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><select value={editType} onChange={e => setEditType(e.target.value)} className="input">{types.map(t => <option key={t} value={t}>{t}</option>)}</select><input value={editName} onChange={e => setEditName(e.target.value)} className="input" placeholder="Détails" style={{ flex: 1, minWidth: '80px' }} /><input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} className="input" style={{ width: '60px' }} /><button onClick={saveEdit}><Save size={16} /></button><button onClick={() => setEditingId(null)}>✖</button></div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem' }}>🏃</span><div><span style={{ display: 'block', fontWeight: '500' }}>{item.type}</span><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.durationMin} min {item.name ? `- ${item.name}` : ''}</span></div></div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => startEdit(item)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button><button onClick={() => onDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button></div></div>
                    )}
                </div>
            ))}
        </div>
    );
};

const GutHealthForm = ({ data, onSave, onAddStool, onUpdateStool, onDeleteStool }) => {
    const [score, setScore] = useState(null);
    const [symptoms, setSymptoms] = useState({ morning: [], afternoon: [], evening: [] });
    const [isLoaded, setIsLoaded] = useState(false);
    const [stoolTime, setStoolTime] = useState('');
    const [stoolBristol, setStoolBristol] = useState(4);
    const [stoolNotes, setStoolNotes] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (data) {
            setScore(data.dailyScore || null);
            try { const parsed = data.symptoms ? JSON.parse(data.symptoms) : { morning: [], afternoon: [], evening: [] }; setSymptoms({ morning: parsed.morning || [], afternoon: parsed.afternoon || [], evening: parsed.evening || [] }); } catch (e) { setSymptoms({ morning: [], afternoon: [], evening: [] }); }
        } else { setScore(null); setSymptoms({ morning: [], afternoon: [], evening: [] }); }
        setIsLoaded(true);
    }, [data]);

    const triggerAutoSave = (newScore, newSymptoms) => { onSave({ dailyScore: newScore !== undefined ? newScore : score, symptoms: JSON.stringify(newSymptoms || symptoms) }); };
    const handleScoreChange = (n) => { setScore(n); triggerAutoSave(n, undefined); };
    const toggleSymptom = (period, sym) => { const current = symptoms[period]; const updatedList = current.includes(sym) ? current.filter(s => s !== sym) : [...current, sym]; const newSymptoms = { ...symptoms, [period]: updatedList }; setSymptoms(newSymptoms); triggerAutoSave(undefined, newSymptoms); };
    const handleAddOrUpdateStool = (e) => { e.preventDefault(); if (!stoolTime) return; const payload = { time: new Date(`${new Date().toISOString().split('T')[0]}T${stoolTime}`), bristolType: parseInt(stoolBristol), notes: stoolNotes }; if (editingId) { onUpdateStool(editingId, payload); setEditingId(null); } else onAddStool(payload); setStoolNotes(''); setStoolBristol(4); setStoolTime(''); };
    const startEdit = (stool) => { setEditingId(stool.id); setStoolTime(new Date(stool.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); setStoolBristol(stool.bristolType); setStoolNotes(stool.notes || ''); };
    const cancelEdit = () => { setEditingId(null); setStoolNotes(''); setStoolBristol(4); setStoolTime(''); };
    const symptomOptions = ["Rien à signaler", "Ballonnements / Gaz", "Brûlures d'estomac", "Vomissement", "Crampes"];

    return (
        <div className="gut-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="section-block"><label className="section-label">Score Global (1-5)</label><div className="score-selector" style={{ display: 'flex', gap: '0.5rem' }}>{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => handleScoreChange(n)} className={`score-btn ${score === n ? 'active' : ''}`} style={{ padding: '0.5rem 1rem', background: score === n ? 'var(--primary)' : 'var(--bg-secondary)', color: score === n ? 'white' : 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>{n}</button>))}</div></div>
            <div className="section-block"><label className="section-label">Symptômes</label><div className="symptoms-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>{['morning', 'afternoon', 'evening'].map(period => (<div key={period} className="period-col"><h4 style={{ textTransform: 'capitalize', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{period === 'morning' ? 'Matin' : period === 'afternoon' ? 'Midi' : 'Soir'}</h4><div className="checks" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{symptomOptions.map(opt => (<label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}><input type="checkbox" checked={symptoms[period].includes(opt)} onChange={() => toggleSymptom(period, opt)} />{opt}</label>))}</div></div>))}</div></div>
            <hr style={{ borderColor: 'var(--border)', width: '100%' }} />
            <div className="section-block"><label className="section-label">Journal des Selles</label>
                <div className="stool-list" style={{ marginBottom: '1rem' }}>{data?.stools?.map((s) => (<div key={s.id} className="stool-item" style={{ background: 'var(--bg-secondary)', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><strong>{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>{' - '} Bristol <strong>{s.bristolType}</strong>{s.notes && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({s.notes})</span>}</div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => startEdit(s)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}>✏️</button><button onClick={() => onDeleteStool(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button></div></div>))}{(!data?.stools || data.stools.length === 0) && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aucune entrée.</p>}</div>
                <form onSubmit={handleAddOrUpdateStool} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap', background: editingId ? '#fff8e1' : 'transparent', padding: editingId ? '0.5rem' : '0', borderRadius: '4px' }}>
                    <input type="time" value={stoolTime} onChange={e => setStoolTime(e.target.value)} required className="input" style={{ width: 'auto' }} /><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><span style={{ fontSize: '0.8rem' }}>B: {stoolBristol}</span><input type="range" min="1" max="7" value={stoolBristol} onChange={e => setStoolBristol(e.target.value)} className="range" style={{ width: '60px' }} /></div><input placeholder={editingId ? "Modifier remarque..." : "Remarques..."} value={stoolNotes} onChange={e => setStoolNotes(e.target.value)} className="input" style={{ flex: 1, minWidth: '100px' }} /><button type="submit" className="add-btn">{editingId ? <Save size={16} /> : <Plus size={16} />}</button>{editingId && <button type="button" onClick={cancelEdit} className="add-btn" style={{ background: '#ccc' }}>✖</button>}
                </form>
            </div>
        </div>
    );
};

const SleepForm = ({ data, onSave }) => {
    const [bedtime, setBedtime] = useState('');
    const [waketime, setWaketime] = useState('');
    const [score, setScore] = useState('');
    const [quality, setQuality] = useState(3);
    const [showScore, setShowScore] = useState(false);

    useEffect(() => {
        if (data) {
            setBedtime(data.bedtime ? new Date(data.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
            setWaketime(data.waketime ? new Date(data.waketime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
            setScore(data.score || '');
            setQuality(data.quality || 3);
            if (data.score) setShowScore(true);
        } else {
            setBedtime(''); setWaketime(''); setScore(''); setQuality(3); setShowScore(false);
        }
    }, [data]);

    const triggerSave = (updates = {}) => {
        const today = new Date().toISOString().split('T')[0];
        const createDate = (timeStr) => {
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(':');
            const d = new Date(today);
            d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return d;
        };

        const finalBedtime = updates.bedtime !== undefined ? updates.bedtime : bedtime;
        const finalWaketime = updates.waketime !== undefined ? updates.waketime : waketime;
        const finalScore = updates.score !== undefined ? updates.score : score;
        const finalQuality = updates.quality !== undefined ? updates.quality : quality;

        onSave({
            bedtime: createDate(finalBedtime),
            waketime: createDate(finalWaketime),
            score: showScore ? (finalScore || null) : null,
            quality: parseInt(finalQuality)
        });
    };

    const emojis = [
        { val: 1, img: '😫', label: 'Très fatigué', color: '#ef4444' },
        { val: 2, img: '🥱', label: 'Fatigué', color: '#f97316' },
        { val: 3, img: '😐', label: 'Neutre', color: '#eab308' },
        { val: 4, img: '😊', label: 'Reposé', color: '#84cc16' },
        { val: 5, img: '🤩', label: 'Très reposé', color: '#15803d' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coucher</label>
                    <input
                        type="time"
                        value={bedtime}
                        onChange={e => { setBedtime(e.target.value); triggerSave({ bedtime: e.target.value }); }}
                        className="input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Réveil</label>
                    <input
                        type="time"
                        value={waketime}
                        onChange={e => { setWaketime(e.target.value); triggerSave({ waketime: e.target.value }); }}
                        className="input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
                    {showScore ? (
                        <>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</label>
                            <input
                                type="number"
                                value={score}
                                onChange={e => { setScore(e.target.value); triggerSave({ score: e.target.value }); }}
                                className="input"
                                placeholder="0-100"
                                style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            />
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowScore(true)}
                            title="Renseignez le score Coros"
                            style={{
                                fontSize: '0.75rem', height: '32px', padding: '0 0.5rem',
                                background: 'var(--bg-tertiary)', border: '1px dashed var(--border)',
                                borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)'
                            }}
                        >
                            ⌚ Score Coros
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qualité du sommeil</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                    {emojis.map(e => (
                        <button
                            key={e.val}
                            type="button"
                            onClick={() => { setQuality(e.val); triggerSave({ quality: e.val }); }}
                            style={{
                                flex: 1,
                                padding: '0.6rem 0.2rem',
                                background: quality === e.val ? `${e.color}15` : 'transparent',
                                border: `2px solid ${quality === e.val ? e.color : 'transparent'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                filter: quality === e.val ? 'none' : 'grayscale(100%) opacity(0.4)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                        >
                            <span style={{ fontSize: '1.4rem' }}>{e.img}</span>
                            <span style={{
                                fontSize: '0.55rem',
                                color: quality === e.val ? e.color : 'var(--text-muted)',
                                fontWeight: quality === e.val ? '700' : '400',
                                textAlign: 'center',
                                lineHeight: '1'
                            }}>
                                {e.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Journal;
