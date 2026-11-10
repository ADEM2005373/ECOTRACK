# Améliorations Futures — Modernisation du Dashboard de Supervision (EcoTrack V2)

> **Document d'archive et de prospective UI/UX**  
> **Date de création :** 9 novembre 2026  
> **Projet :** EcoTrack V2 — Web Supervision (`apps/web-react`)  
> **Source d'inspiration :** Analyse conceptuelle *Admin Dashboard V2* (Dark Glassmorphism, KPI Cards, Framer Motion)

---

## 1. Contexte & Analyse du Concept Inspirant ("Admin Dashboard V2")

L'analyse de la référence vidéo montre un tableau de bord moderne combinant :
- **Esthétique Dark Glassmorphism :** Panneaux sombres translucides (`backdrop-blur`), halos lumineux diffus (dégradés néon émeraude/cyan), bordures fines semi-transparentes (`border-white/10`).
- **Composants KPI dynamiques :** Cartes statistiques avec micro-interactions au survol (`framer-motion whileHover={{ y: -5 }}`), indicateurs de croissance en pourcentage et icônes Lucide.
- **Organisation modulaire :** Navigation latérale structurée (*Overview, Moderation, Announcements, Finance, Settings*), barre de recherche globale et filtres contextuels.

### Évaluation Critique pour la Production

| Critère | Forces du concept | Limites en usage opérationnel quotidien |
| :--- | :--- | :--- |
| **Impact Visuel** | Exceptionnel pour démos, présentations et soutenances. | Peut devenir distrayant après plusieurs heures d'usage continu. |
| **Accessibilité (WCAG)** | Typographie moderne et hiérarchisée. | Risque de non-conformité si le texte secondaire repose sur un dégradé flou sans contraste suffisant. |
| **Densité de Données** | Grandes cartes aérées, idéales pour la vue macro. | Trop peu dense pour traiter 100+ signalements d'anomalies par jour (scrolling excessif). |
| **Performances GPU** | Rendu fluide sur machines récentes. | Multiples `backdrop-filter: blur(16px)` et ombres lourdes sur cartes peuvent ralentir les terminaux d'agents moins puissants. |

---

## 2. Architecture Cible Recommandée : "Engineered SaaS"

Pour allier l'élégance visuelle du concept à l'efficacité opérationnelle d'outils comme *Linear*, *Vercel* ou *Stripe*, les axes d'amélioration suivants sont préconisés pour EcoTrack :

### A. Évolution vers le "Subtle Precision Dark Glass"
- Remplacer le verre lourd (`bg-white/5` instable) par un fond sombre quasi-solide (`bg-slate-900/85`) avec bordures précises (`border-slate-800`).
- Garantir un ratio de contraste supérieur à **4.5:1 (WCAG AA)** pour l'ensemble des textes d'information et métadonnées.
- Conserver les halos lumineux (`ambient-glow`) uniquement en arrière-plan global de page, jamais directement sous des tableaux de données.

### B. Mode Double Densité (Grille Visuelle vs Tableau Compact)
- **Mode Grille :** Affichage riche avec photos des anomalies urbaines, badges d'état et aperçu rapide (idéal pour le contrôle visuel).
- **Mode Tableau Dense :** Vue compacte avec cases à cocher, colonnes triables (SLA, localisation, criticité) et raccourcis clavier pour le tri en masse.

### C. Barre d'Actions Groupées (Batch Actions)
- Dès que plusieurs signalements sont cochés, apparition d'une barre flottante :
  - *Valider la sélection (N)*
  - *Assigner à l'équipe voirie*
  - *Rejeter / Déclarer doublon*
- Réduction du temps de modération estimée à **~75%**.

### D. Command Palette (`Ctrl + K` / `Cmd + K`)
- Barre de commande universelle pour naviguer sans souris :
  - `> Aller à la modération`
  - `> Rechercher un signalement #ECO-41`
  - `> Assigner équipe Quartier Nord`

### E. Alignement Strict avec la Charte EcoTrack CDCF V2
- **Vert primaire :** `#059669` (actions positives, validation T1, KPIs de performance).
- **Bleu saphir secondaire :** `#1E3A8A` (assignations T2, filtres institutionnels).
- **Ambre / Jaune :** `#F59E0B` (anomalies en attente de modération).
- **Rouge / Rose :** `#DC2626` (SLA dépassé, rejets T5, urgences sécurité).

---

## 3. Structure de Fichiers Cible (`apps/web-react/src`)

```
apps/web-react/src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx      # Conteneur global (Sidebar + Header + Main)
│   │   ├── Sidebar.tsx              # Menu latéral hiérarchisé
│   │   └── Header.tsx               # Recherche globale, notifications, profil
│   ├── dashboard/
│   │   ├── StatsCard.tsx            # Carte KPI réutilisable avec variations
│   │   ├── AnomalyTrendsChart.tsx   # Graphique mensuel des signalements
│   │   └── SLAStatusGauge.tsx       # Jauge de respect des délais MTTR / SLA
│   ├── moderation/
│   │   ├── ModerationView.tsx       # Vue principale de la file de modération
│   │   ├── AnomalyCard.tsx          # Carte unitaire avec photo et actions
│   │   ├── AnomalyTable.tsx         # Tableau haute densité avec sélection
│   │   └── BatchActionsBar.tsx      # Barre d'actions groupées sticky
│   └── ui/
│       ├── Button.tsx               # Bouton atomique existant
│       └── CommandPalette.tsx       # Fenêtre modale de commande (Ctrl+K)
```

---

## 4. Recettes de Code & Snippets Prêts pour Intégration

### 1. Utilitaires CSS (`apps/web-react/src/index.css`)
```css
@layer utilities {
  .glass-card {
    background-color: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(30, 41, 59, 0.8);
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  .glass-card:hover {
    border-color: rgba(51, 65, 85, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  }

  .ambient-glow-emerald {
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 70%);
    filter: blur(60px);
    pointer-events: none;
  }
}
```

### 2. Composant Carte KPI Optimisé (`StatsCard.tsx`)
```tsx
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'sapphire' | 'amber' | 'rose';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs mois précédent',
  icon: Icon,
  variant = 'emerald',
}) => {
  const isPositive = (change ?? 0) >= 0;

  const variantStyles = {
    emerald: 'text-brand-400 bg-brand-600/10 border-brand-600/20',
    sapphire: 'text-blue-400 bg-sapphire-900/30 border-sapphire-900/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[variant];

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={cn('p-2.5 rounded-xl border', variantStyles)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md',
                isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
              )}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {Math.abs(change)}%
            </span>
            <span className="text-[11px] text-slate-400">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3. Logique de Vue Double Densité (`ModerationView.tsx`)
```tsx
import React, { useState } from 'react';
import { LayoutGrid, Table, CheckCheck, XCircle, Users } from 'lucide-react';
import { Button } from '../ui/Button';

export const ModerationView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      {/* Entête avec Sélecteur de Mode */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">File de Modération</h2>
          <p className="text-xs text-slate-400">8 signalements urbains en attente de validation</p>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grille
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Tableau
          </button>
        </div>
      </div>

      {/* Barre d'Actions Groupées Flottante */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 z-50 backdrop-blur-md">
          <span className="text-xs font-semibold text-white">
            {selectedIds.length} élément(s) sélectionné(s)
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <Button variant="primary" size="sm" icon={<CheckCheck className="w-3.5 h-3.5" />}>
            Valider Sélection
          </Button>
          <Button variant="secondary" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
            Assigner Équipe
          </Button>
          <Button variant="destructive" size="sm" icon={<XCircle className="w-3.5 h-3.5" />}>
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
};
```

---

## 5. Procédure pour l'Activation Future

Lorsque le projet entrera dans la phase de refonte du dashboard :
1. **Créer les fichiers composants** selon l'arborescence définie en section 3.
2. **Ajouter les classes d'accessibilité et de verre** dans `apps/web-react/src/index.css`.
3. **Connecter les modèles de données de signalements** (`packages/` ou `services/`) aux props des composants.
4. **Vérifier les ratios de contraste** à l'aide d'outils d'audit a11y (ex. Chrome DevTools Lighthouse) pour maintenir le respect strict de la charte CDCF V2.
