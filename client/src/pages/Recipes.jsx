import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Clock, Users, ChevronRight, Utensils, Trash2, Award, Tag, X } from 'lucide-react';
import RecipeForm from '../components/recipes/RecipeForm';

const Recipes = () => {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);

    const fetchRecipes = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/recipes`)
            .then(res => res.json())
            .then(data => {
                setRecipes(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const handleSaveRecipe = (recipeData, id) => {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE_URL}/api/recipes/${id}` : `${API_BASE_URL}/api/recipes`;

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData)
        })
            .then(res => res.json())
            .then(() => {
                setShowForm(false);
                setEditingRecipe(null);
                fetchRecipes();
            })
            .catch(err => console.error(err));
    };

    const handleDeleteRecipe = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Supprimer cette recette ?')) {
            fetch(`${API_BASE_URL}/api/recipes/${id}`, { method: 'DELETE' })
                .then(() => fetchRecipes())
                .catch(err => console.error(err));
        }
    };

    const openEditForm = (recipe) => {
        setEditingRecipe(recipe);
        setShowForm(true);
    };

    const filteredRecipes = recipes.filter(r => {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(searchLower);
        const matchesTag = r.tags?.some(t => t.name.toLowerCase().includes(searchLower));
        return matchesName || matchesTag;
    });

    const getComplexityColor = (val) => {
        if (!val) return 'var(--text-muted)';
        if (val <= 3) return '#10b981'; // Green
        if (val <= 6) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    return (
        <div className="recipes-container">
            {showForm && (
                <RecipeForm
                    recipe={editingRecipe}
                    onSave={handleSaveRecipe}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingRecipe(null);
                    }}
                />
            )}

            <header className="page-header">
                <div>
                    <h1>Mon Livre de Cuisine</h1>
                    <p className="subtitle">{recipes.length} recettes enregistrées</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/ingredients')}>
                        <Utensils size={20} />
                        <span>Mes Ingrédients</span>
                    </button>
                    <button className="btn-primary" onClick={() => {
                        setEditingRecipe(null);
                        setShowForm(true);
                    }}>
                        <Plus size={20} />
                        <span>Nouvelle Recette</span>
                    </button>
                </div>
            </header>

            <div className="search-bar-container">
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou tag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary">
                    <Filter size={20} />
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : (
                <div className="recipes-grid">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(recipe => (
                            <div key={recipe.id} className="recipe-card glass" onClick={() => openEditForm(recipe)}>
                                <div className="recipe-image">
                                    {recipe.urlPhoto ? (
                                        <img src={recipe.urlPhoto} alt={recipe.name} />
                                    ) : (
                                        <div className="image-placeholder">
                                            <Utensils size={40} />
                                        </div>
                                    )}
                                    <div className="recipe-tags-overlay">
                                        {recipe.isDraft && (
                                            <div className="overlay-badge" style={{ background: '#f59e0b', color: '#000', fontWeight: '800' }}>
                                                BROUILLON
                                            </div>
                                        )}
                                        {recipe.type === 'ASSEMBLY' && (
                                            <div className="overlay-badge" style={{ background: 'var(--primary)', color: '#fff', fontWeight: '800' }}>
                                                ASSEMBLAGE
                                            </div>
                                        )}
                                        {recipe.complexity && (
                                            <div className="overlay-badge" style={{ color: getComplexityColor(recipe.complexity) }}>
                                                <Award size={12} />
                                                <span>{recipe.complexity}/10</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="btn-delete-card"
                                        onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="recipe-content">
                                    <h3>{recipe.name}</h3>
                                    <p className="recipe-desc">{recipe.description || 'Aucune description'}</p>
                                    <div className="recipe-meta">
                                        <div className="meta-item" title="Portions">
                                            <Users size={16} />
                                            <span>{recipe.servings || 1} pers.</span>
                                        </div>
                                        <div className="meta-item" title="Temps de préparation">
                                            <span style={{ fontSize: '1.1rem' }}>🔪</span>
                                            <span>{recipe.prepTime ? `${recipe.prepTime} min` : '-'}</span>
                                        </div>
                                        <div className="meta-item" title="Temps de cuisson">
                                            <span style={{ fontSize: '1.1rem' }}>🔥</span>
                                            <span>{recipe.cookTime ? `${recipe.cookTime} min` : '-'}</span>
                                        </div>
                                        <button className="btn-icon" onClick={(e) => {
                                            e.stopPropagation();
                                            openEditForm(recipe);
                                        }}>
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>Aucune recette trouvée</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Recipes;
