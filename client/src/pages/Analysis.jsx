import React from 'react';
import { PieChart, TrendingUp, AlertCircle } from 'lucide-react';

const Analysis = () => {
    return (
        <div className="page" style={{ padding: '20px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    Analyse
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Tendances & Santé</p>
            </header>

            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <TrendingUp size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h3>Données Insuffisantes</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                    Continuez à remplir votre journal pour voir apparaître des corrélations entre votre alimentation et votre santé intestinale.
                </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>À venir</h3>
                <div className="card" style={{ marginBottom: '1rem', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                    <PieChart size={24} color="#60a5fa" />
                    <div>
                        <div style={{ fontWeight: '600' }}>Répartition Calorique</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Macronutriments</div>
                    </div>
                </div>
                <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                    <AlertCircle size={24} color="#f87171" />
                    <div>
                        <div style={{ fontWeight: '600' }}>Déclencheurs Symptômes</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aliments à risque</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
