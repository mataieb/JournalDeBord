import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { Plus, Trash2, X, PlusCircle, Users, Clock, Award, GripVertical, Utensils, BookOpen, Tag } from 'lucide-react';

const RecipeForm = ({ recipe, onSave, onCancel }) => {
    const isEdit = !!recipe;
    const [name, setName] = useState(recipe?.name || '');
    const [description, setDescription] = useState(recipe?.description || '');
    const [urlPhoto, setUrlPhoto] = useState(recipe?.urlPhoto || '');
    const [servings, setServings] = useState(recipe?.servings || 1);
    const [prepTime, setPrepTime] = useState(recipe?.prepTime || '');
    const [cookTime, setCookTime] = useState(recipe?.cookTime || '');
    const [uploading, setUploading] = useState(false); // Upload state

    const [complexity, setComplexity] = useState(recipe?.complexity || 5);
    const [isDraft, setIsDraft] = useState(recipe?.isDraft ?? false);
    const [type, setType] = useState(recipe?.type || 'RECIPE');

    const [steps, setSteps] = useState(
        recipe?.steps?.length > 0
            ? [...recipe.steps].sort((a, b) => a.order - b.order).map(s => ({ description: s.description }))
            : [{ description: '' }]
    );

    const [recipeIngredients, setRecipeIngredients] = useState(
        recipe?.ingredients?.length > 0
            ? recipe.ingredients.map(ri => ({
                name: ri.subRecipe ? ri.subRecipe.name : ri.ingredient.name,
                quantity: ri.quantity,
                unit: ri.unit,
                subRecipeId: ri.subRecipeId || null
            }))
            : [{ name: '', quantity: '', unit: '', subRecipeId: null }]
    );

    const [tags, setTags] = useState(
        recipe?.tags?.length > 0
            ? recipe.tags.map(t => t.name)
            : []
    );
    const [tagInput, setTagInput] = useState('');

    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [showIngredientsList, setShowIngredientsList] = useState(null);
    const dragItem = useRef();
    const dragOverItem = useRef();

    useEffect(() => {
        // Fetch ingredients
        fetch(`${API_BASE_URL}/api/recipes/ingredients/list`)
            .then(res => res.json())
            .then(data => setAvailableIngredients(data))
            .catch(err => console.error(err));

        // Fetch recipes for nested suggestions
        fetch(`${API_BASE_URL}/api/recipes`)
            .then(res => res.json())
            .then(data => setAvailableRecipes(data))
            .catch(err => console.error(err));
    }, []);

    const addStep = () => {
        setSteps([...steps, { description: '' }]);
    };

    const removeStep = (index) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleStepChange = (index, value) => {
        const newSteps = [...steps];
        newSteps[index].description = value;
        setSteps(newSteps);
    };

    const dragStart = (e, position) => {
        dragItem.current = position;
    };

    const dragEnter = (e, position) => {
        dragOverItem.current = position;
    };

    const drop = (e) => {
        const copyListItems = [...steps];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setSteps(copyListItems);
    };

    const addTag = () => {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const addIngredient = () => {
        setRecipeIngredients([{ name: '', quantity: '', unit: '', subRecipeId: null }, ...recipeIngredients]);
    };

    const removeIngredient = (index) => {
        setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
    };

    const handleIngredientChange = (index, field, value) => {
        const newIngs = [...recipeIngredients];
        newIngs[index][field] = value;
        // If name changes manually, reset subRecipeId
        if (field === 'name') newIngs[index].subRecipeId = null;
        setRecipeIngredients(newIngs);
    };

    const selectIngredient = (index, item, type) => {
        const newIngs = [...recipeIngredients];
        newIngs[index].name = item.name;
        newIngs[index].unit = type === 'ingredient' ? (item.uniteMesure || '') : 'portion';
        newIngs[index].subRecipeId = type === 'recipe' ? item.id : null;
        setRecipeIngredients(newIngs);
        // Small delay to ensure selection is registered
        setTimeout(() => setShowIngredientsList(null), 50);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const recipeData = {
            name,
            description,
            urlPhoto,
            servings: parseInt(servings),
            prepTime: parseInt(prepTime) || null,
            cookTime: parseInt(cookTime) || null,
            complexity: parseInt(complexity) || null,
            steps: steps.filter(s => s.description.trim() !== ''),
            ingredients: recipeIngredients.filter(i => i.name.trim() !== ''),
            steps: steps.filter(s => s.description.trim() !== ''),
            ingredients: recipeIngredients.filter(i => i.name.trim() !== ''),
            tags: tags.map(t => ({ name: t })),
            isDraft,
            type
        };
        onSave(recipeData, recipe?.id);
    };

    const normalize = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const getFilteredSuggestions = (search) => {
        const s = normalize(search);
        const ings = availableIngredients
            .filter(i => normalize(i.name).includes(s))
            .slice(0, 5)
            .map(i => ({ ...i, type: 'ingredient' }));

        const recs = availableRecipes
            .filter(r => r.id !== recipe?.id && normalize(r.name).includes(s))
            .slice(0, 5)
            .map(r => ({ ...r, type: 'recipe' }));

        return [...recs, ...ings];
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setUrlPhoto(data.url);
            } else {
                alert('Erreur upload: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Erreur upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="recipe-form-overlay">
            <div className="recipe-form-modal glass">
                <header className="form-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2>{isEdit ? 'Modifier la recette' : 'Nouvelle Recette'}</h2>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <input
                                type="checkbox"
                                checked={type === 'ASSEMBLY'}
                                onChange={e => setType(e.target.checked ? 'ASSEMBLY' : 'RECIPE')}
                                style={{ accentColor: 'var(--primary)', transform: 'scale(1.1)' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: type === 'ASSEMBLY' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '500' }}>
                                {type === 'ASSEMBLY' ? 'ASSEMBLAGE' : 'RECETTE STANDARD'}
                            </span>
                        </label>
                        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <input
                                type="checkbox"
                                checked={isDraft}
                                onChange={e => setIsDraft(e.target.checked)}
                                style={{ accentColor: 'var(--warning)', transform: 'scale(1.1)' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: isDraft ? 'var(--warning)' : 'var(--text-muted)', fontWeight: '500' }}>
                                {isDraft ? 'BROUILLON' : 'TERMINÉE'}
                            </span>
                        </label>
                    </div>
                    <button className="btn-icon" onClick={onCancel}><X size={24} /></button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="field">
                            <label>Nom de la recette</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="ex: Lasagnes à la bolognaise"
                            />
                        </div>
                        <div className="grid-4">
                            <div className="field">
                                <label>Portions</label>
                                <div className="input-with-icon">
                                    <Users size={18} />
                                    <input
                                        type="number"
                                        className="input"
                                        value={servings}
                                        onChange={(e) => setServings(e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label>Prépa (min)</label>
                                <div className="input-with-icon">
                                    <Clock size={18} />
                                    <input
                                        type="number"
                                        className="input"
                                        value={prepTime}
                                        onChange={(e) => setPrepTime(e.target.value)}
                                        placeholder="Ex: 15"
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label>Cuisson (min)</label>
                                <div className="input-with-icon">
                                    <Utensils size={18} />
                                    <input
                                        type="number"
                                        className="input"
                                        value={cookTime}
                                        onChange={(e) => setCookTime(e.target.value)}
                                        placeholder="Ex: 30"
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label>Complexité</label>
                                <div className="input-with-icon">
                                    <Award size={18} />
                                    <input
                                        type="number"
                                        className="input"
                                        value={complexity}
                                        onChange={(e) => setComplexity(e.target.value)}
                                        min="1"
                                        max="10"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="field">
                            <label>Photo</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={urlPhoto}
                                    onChange={(e) => setUrlPhoto(e.target.value)}
                                    placeholder="https://... ou uploadez ->"
                                    style={{ flex: 1 }}
                                />
                                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {uploading ? '...' : <><Plus size={18} /> Upload</>}
                                    <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                </label>
                            </div>
                            {urlPhoto && (
                                <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '100px', width: '100px', border: '1px solid var(--border)' }}>
                                    <img src={urlPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
                        <div className="field">
                            <label>Description</label>
                            <textarea
                                className="input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Une brève description..."
                                rows={2}
                            />
                        </div>
                        <div className="field">
                            <label>Tags</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                {tags.map(tag => (
                                    <div key={tag} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', borderRadius: '12px',
                                        background: 'rgba(var(--primary-rgb), 0.2)',
                                        color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500'
                                    }}>
                                        <Tag size={12} />
                                        <span>{tag}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: 'inherit' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Ajouter un tag (ex: curry-thai, végétarien)..."
                                    style={{ flex: 1 }}
                                />
                                <button type="button" className="btn-secondary" onClick={addTag}>
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <h3>Ingrédients et Sous-recettes</h3>
                            <button type="button" className="btn-text" onClick={addIngredient}>
                                <PlusCircle size={18} />
                                <span>Ajouter en haut</span>
                            </button>
                        </div>
                        <div className="ingredients-list-edit">
                            {recipeIngredients.map((ing, index) => (
                                <div key={index} className="ingredient-row">
                                    <div className="ing-name-wrapper">
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            {ing.subRecipeId && <BookOpen size={16} style={{ position: 'absolute', left: '-25px', color: 'var(--primary)' }} />}
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Ingrédient ou Recette..."
                                                value={ing.name}
                                                style={{ borderLeft: ing.subRecipeId ? '3px solid var(--primary)' : '' }}
                                                onChange={(e) => {
                                                    handleIngredientChange(index, 'name', e.target.value);
                                                    setShowIngredientsList(index);
                                                }}
                                                onFocus={() => setShowIngredientsList(index)}
                                            />
                                        </div>
                                        {showIngredientsList === index && (
                                            <>
                                                {/* Backdrop rendu AVANT la dropdown pour éviter l'interception des clics */}
                                                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onMouseDown={() => setShowIngredientsList(null)} />

                                                <div className="ingredients-dropdown" style={{ zIndex: 100 }}>
                                                    {getFilteredSuggestions(ing.name).map(item => (
                                                        <button
                                                            key={`${item.type}-${item.id}`}
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                selectIngredient(index, item, item.type);
                                                            }}
                                                            style={{
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                width: '100%', padding: '10px 12px', background: 'none', border: 'none',
                                                                textAlign: 'left', cursor: 'pointer', color: 'inherit',
                                                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                            }}
                                                        >
                                                            <span>{item.name}</span>
                                                            <span style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', background: item.type === 'recipe' ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)', color: item.type === 'recipe' ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                                {item.type === 'recipe' ? 'RECETTE 📖' : 'BASE'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        className="input qte"
                                        placeholder="Qte"
                                        value={ing.quantity}
                                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                    />

                                    {/* Unit Selector Logic */}
                                    {(() => {
                                        const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
                                        const UNITS = ['g', 'kg', 'mL', 'L', 'pièce', 'c.a.c', 'c.a.s', 'portion', 'paquet', 'Aucune'];

                                        const ingDef = availableIngredients.find(i => normalize(i.name) === normalize(ing.name));

                                        // Si ingrédient connu avec unités restreintes -> Liste restreinte
                                        // Sinon -> Liste complète
                                        const allowedUnits = (ingDef?.uniteMesure && ingDef.uniteMesure.trim() !== '')
                                            ? ingDef.uniteMesure.split(',').filter(x => x)
                                            : UNITS;

                                        return (
                                            <select
                                                className="input"
                                                value={ing.unit}
                                                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                                                style={{ width: '80px', padding: '10px 4px' }}
                                            >
                                                <option value="">Choisir...</option>
                                                {allowedUnits.map(u => (
                                                    <option key={u} value={u === 'Aucune' ? '' : u}>{u}</option>
                                                ))}
                                            </select>
                                        );
                                    })()}
                                    <button type="button" className="btn-delete" onClick={() => removeIngredient(index)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <h3>Étapes de préparation</h3>
                            <button type="button" className="btn-text" onClick={addStep}>
                                <PlusCircle size={18} />
                                <span>Ajouter une étape</span>
                            </button>
                        </div>
                        <div className="steps-list-edit">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="step-row"
                                    onDragStart={(e) => dragStart(e, index)}
                                    onDragEnter={(e) => dragEnter(e, index)}
                                    onDragEnd={drop}
                                    draggable
                                >
                                    <div className="drag-handle">
                                        <GripVertical size={18} />
                                    </div>
                                    <span className="step-number">{index + 1}</span>
                                    <textarea
                                        className="input"
                                        value={step.description}
                                        onChange={(e) => handleStepChange(index, e.target.value)}
                                        placeholder="Décrivez l'étape..."
                                        rows={2}
                                    />
                                    <button type="button" className="btn-delete" onClick={() => removeStep(index)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="hint">Astuce : Glissez les étapes pour les réorganiser.</p>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
                        <button type="submit" className="btn-primary">
                            {isEdit ? 'Mettre à jour' : 'Enregistrer la recette'}
                        </button>
                    </div>
                </form>
            </div>
            {/* BACKDROP TEMPORAIREMENT DESACTIVE POUR DEBUG */}
            {/* {showIngredientsList !== null && <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onMouseDown={() => setShowIngredientsList(null)} />} */}
        </div>
    );
};

export default RecipeForm;
