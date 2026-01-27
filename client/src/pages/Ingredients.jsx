import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Search, Edit2, Trash2, Merge, Save, X, Check, ArrowRight } from 'lucide-react';

const UNITS = ['g', 'kg', 'mL', 'L', 'pièce', 'c.a.c', 'c.a.s', 'portion', 'paquet', 'Aucune'];

const Ingredients = () => {
    const [ingredients, setIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Selection for Merge
    const [selectedIds, setSelectedIds] = useState([]);
    const [showMergeModal, setShowMergeModal] = useState(false);

    useEffect(() => {
        fetchIngredients();
    }, []);

    const fetchIngredients = () => {
        setLoading(true);
        fetch('${API_BASE_URL}/api/recipes/ingredients/list')
            .then(res => res.json())
            .then(data => {
                setIngredients(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const normalize = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredIngredients = ingredients.filter(ing =>
        normalize(ing.name).includes(normalize(searchTerm))
    );

    // --- EDIT LOGIC ---
    const handleDelete = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cet ingrédient ?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/recipes/ingredients/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setIngredients(ingredients.filter(i => i.id !== id));
            } else {
                const data = await res.json();
                alert(data.message || "Erreur lors de la suppression");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur technique");
        }
    };

    const startEdit = (ing) => {
        setEditingId(ing.id);
        setEditForm({ ...ing });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = () => {
        fetch(`${API_BASE_URL}/api/recipes/ingredients/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        })
            .then(res => res.json())
            .then(updated => {
                setIngredients(ingredients.map(i => i.id === updated.id ? updated : i));
                setEditingId(null);
            });
    };

    // --- MERGE LOGIC ---
    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            if (selectedIds.length >= 2) return; // Max 2 for now
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleMerge = (targetId) => {
        const sourceId = selectedIds.find(id => id !== targetId);

        if (!window.confirm("Êtes-vous sûr ? L'ingrédient non sélectionné sera supprimé et remplacé par le sélectionné dans toutes les recettes.")) return;

        fetch('${API_BASE_URL}/api/recipes/ingredients/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId, targetId })
        })
            .then(res => res.json())
            .then(() => {
                alert("Fusion réussie !");
                setSelectedIds([]);
                setShowMergeModal(false);
                fetchIngredients();
            })
            .catch(err => alert("Erreur lors de la fusion"));
    };

    return (
        <div className="page-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1>Ingrédients</h1>
                    <p className="subtitle">Gérez, modifiez et fusionnez vos ingrédients ({ingredients.length})</p>
                </div>
                {selectedIds.length === 2 && (
                    <button className="btn-primary" onClick={() => setShowMergeModal(true)} style={{ background: '#8b5cf6' }}>
                        <Merge size={20} />
                        <span>Fusionner ({selectedIds.length})</span>
                    </button>
                )}
            </header>

            <div className="search-bar-container" style={{ marginBottom: '2rem' }}>
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (accents ignorés)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '15px', textAlign: 'center', width: '50px' }}>
                                    {selectedIds.length > 0 && <Check size={16} />}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Nom</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Unités possibles</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>Utilisation</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Calories (kCal)</th>
                                <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIngredients.map(ing => (
                                <tr key={ing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(ing.id)}
                                            onChange={() => toggleSelection(ing.id)}
                                            disabled={selectedIds.length >= 2 && !selectedIds.includes(ing.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {editingId === ing.id ? (
                                            <input
                                                className="input"
                                                value={editForm.name || ''}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: '500' }}>{ing.name}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', minWidth: '220px' }}>
                                            {UNITS.map(u => {
                                                const currentUnits = (editingId === ing.id ? (editForm.uniteMesure || '') : (ing.uniteMesure || '')).split(',');
                                                const active = currentUnits.includes(u);

                                                return (
                                                    <label key={u} style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem',
                                                        cursor: editingId === ing.id ? 'pointer' : 'default',
                                                        opacity: active ? 1 : 0.5
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={editingId !== ing.id}
                                                            checked={active}
                                                            onChange={(e) => {
                                                                const current = (editForm.uniteMesure || '').split(',').filter(x => x);
                                                                let newUnits;
                                                                if (e.target.checked) {
                                                                    newUnits = [...current, u];
                                                                } else {
                                                                    newUnits = current.filter(x => x !== u);
                                                                }
                                                                setEditForm({ ...editForm, uniteMesure: newUnits.join(',') });
                                                            }}
                                                        />
                                                        {u}
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {ing._count?.recipeIngredients > 0 ? (
                                            <span style={{
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                color: '#10b981',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {ing._count.recipeIngredients} recettes
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {editingId === ing.id ? (
                                            <input
                                                className="input"
                                                type="number"
                                                style={{ width: '80px' }}
                                                value={editForm.calories || ''}
                                                onChange={e => setEditForm({ ...editForm, calories: e.target.value })}
                                            />
                                        ) : (
                                            <span>{ing.calories || '-'}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                        {editingId === ing.id ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn-icon" onClick={saveEdit} style={{ color: '#10b981' }}><Save size={18} /></button>
                                                <button className="btn-icon" onClick={cancelEdit} style={{ color: '#ef4444' }}><X size={18} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button className="btn-icon" onClick={() => startEdit(ing)} title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="btn-icon" onClick={() => handleDelete(ing.id)} title="Supprimer" style={{ color: '#ef4444' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MERGE MODAL */}
            {showMergeModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass" style={{ padding: '30px', borderRadius: '20px', maxWidth: '600px', width: '100%', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Merge /> Fusionner les ingrédients
                        </h2>
                        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                            Sélectionnez l'ingrédient à <strong>CONSERVER</strong>. L'autre sera supprimé et toutes ses références seront mises à jour.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1fr', gap: '20px', alignItems: 'center' }}>
                            {ingredients.filter(i => selectedIds.includes(i.id)).map(ing => (
                                <button
                                    key={ing.id}
                                    onClick={() => handleMerge(ing.id)}
                                    className="glass"
                                    style={{
                                        padding: '20px', textAlign: 'center', cursor: 'pointer',
                                        border: '2px solid var(--primary)', borderRadius: '10px',
                                        transition: 'transform 0.2s',
                                        background: 'rgba(var(--primary-rgb), 0.1)'
                                    }}
                                >
                                    <h3 style={{ marginBottom: '10px' }}>{ing.name}</h3>
                                    <div className="badge">{ing.calories} kcal</div>
                                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981' }}>CLIQUER POUR GARDER</div>
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn-secondary"
                            style={{ width: '100%', marginTop: '30px' }}
                            onClick={() => setShowMergeModal(false)}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ingredients;
