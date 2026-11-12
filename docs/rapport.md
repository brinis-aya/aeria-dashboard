# Rapport — Module 6 : design et tableau de bord

**Projet Aeria** — plateforme ouverte de surveillance de la qualité de l'air
Auteur : BRINIS Aya — novembre 2026
Dépôt : <https://github.com/brinis-aya/aeria-dashboard> · Site : <https://brinis-aya.github.io/aeria-dashboard/>

---

## 1. Objectif

Les modules 1 à 5 produisent, nettoient, prévoient, maintiennent et sécurisent les données. Ce module les rend
**utiles à quelqu'un**. Il livre trois choses :

1. une **étude de cas UX** : personas, problème, architecture de l'information, wireframes, évaluation ;
2. un **tableau de bord React** : carte, graphiques, prévision, état du parc ;
3. la **page de présentation** du projet, qui est l'accueil du même site.

## 2. Étude UX (synthèse)

Le détail est dans [`etude-ux.md`](etude-ux.md).

Les personas mettent au jour un constat simple : **l'information utile est dans le futur**. Une mère d'enfant
asthmatique veut savoir si demain sera un bon jour pour courir dehors. Les sites d'information montrent
surtout le présent, souvent en µg/m³.

Cinq principes en découlent, appliqués partout :

| Principe | Où on le voit |
|---|---|
| Demain d'abord | l'accueil montre côte à côte la répartition observée et la répartition prévue ; la carte bascule « Observé / Prévu demain » |
| Des mots, pas que des couleurs | chaque pastille porte le numéro et le libellé du niveau, et le polluant responsable |
| Les couleurs officielles ATMO | reconnues par le public ; une seule échelle, aussi pour colorer les concentrations |
| Honnêteté | « positions indicatives », « capteurs simulés », écart avec l'indice communal officiel, signalés sur place |
| Mobile d'abord | une colonne sur téléphone, la carte passe au-dessus de la liste |

Les wireframes basse fidélité (accueil mobile, carte, station) ont servi à trancher trois choix. Deux barres
de répartition plutôt qu'une carte sur l'accueil. Une liste triée « pires d'abord » à côté de la carte, qui
est aussi l'alternative accessible. Un calendrier de 120 jours avant les graphiques.

L'évaluation heuristique de Nielsen du prototype a conduit à sept corrections : date de chaque donnée, noms
des polluants en clair, légende permanente, avertissement sur les positions, etc.

## 3. Réalisation

### 3.1 Architecture

Le site est **statique**. Un script exporte un instantané JSON depuis les autres modules :

| Source | Données | Volume |
|---|---|---|
| entrepôt (module 2) | stations, 120 jours d'indice, 14 jours horaires | ~4 300 lignes journalières, ~60 000 valeurs horaires |
| API de prévision (module 3) | indice de demain par station, métriques du backtest | 33 stations |
| API du back-office (module 4) | parc de capteurs, indicateurs | 16 capteurs |

Ce choix rend le site hébergeable gratuitement (GitHub Pages), sans serveur ni base exposée. C'est aussi une
mesure de sécurité cohérente avec le module 5 : le public ne touche jamais l'API authentifiée du
back-office. La contrepartie est un instantané, et non du temps réel. Le script d'export est prêt pour une
exécution planifiée.

**Coordonnées des stations.** Les données ouvertes du LCSQA ne contiennent pas de coordonnées. Chaque station
est placée au centre de sa commune, géocodée avec l'API Adresse (data.gouv.fr), légèrement écartée quand
plusieurs stations partagent une commune. C'est une approximation assumée et signalée, plutôt qu'une
précision inventée.

### 3.2 Pages

- **Accueil (présentation)** : accroche, indice observé et prévu en barres de répartition, trois missions, sept
  modules liés à leurs dépôts.
- **Carte** : Leaflet sur fond OpenStreetMap. Pastilles colorées par indice, infobulle avec le libellé et le
  polluant, couche des capteurs Aeria. La liste triée est synchronisée avec la carte.
- **Station** :
  - tuiles « observé / prévu / historique » ;
  - calendrier de 120 jours ;
  - concentrations journalières en barres colorées par sous-indice, seuils en pointillé ;
  - courbe horaire des 14 derniers jours.
- **Prévision** : tableau de toutes les stations pour demain, alertes, précision du modèle comparée à la
  persistance.
- **Capteurs Aeria** : état, disponibilité, MTBF, prochain étalonnage, tirés du back-office.
- **À propos** : méthode, sources et licences, limites, déclaration d'accessibilité.

### 3.3 Visualisation

- **Échelle unique.** La couleur des barres de concentration est celle du **sous-indice ATMO** de la valeur.
  Une barre jaune signifie « Dégradé » pour ce polluant, quelle que soit sa hauteur. Le lecteur n'a qu'un code
  couleur à apprendre.
- **Seuils visibles.** Les limites « Bon », « Moyen » et « Dégradé » sont tracées en pointillé. On voit à quelle
  distance du niveau suivant on se trouve.
- **Contraste.** Le texte des pastilles est foncé sur les niveaux clairs (cyan, vert, jaune, rouge) et blanc
  sur les niveaux sombres (bordeaux, violet). Un test unitaire vérifie un contraste d'au moins 4,5:1 pour
  chacun des six niveaux.

## 4. Qualité

- **Tests unitaires** (Vitest) :
  - seuils de l'indice, les mêmes que dans les modules 2 et 3 ;
  - mise en forme des données ;
  - composants : le niveau est écrit en toutes lettres ;
  - contraste des six couleurs.
- **Accessibilité automatisée** : axe-core dans Chromium, en CI, sur les six pages, avec les règles WCAG 2.1
  A et AA. La carte est exclue de l'analyse et documentée comme écart : son équivalent textuel est la liste.
- **Déploiement continu** : chaque commit sur `main` reconstruit et publie le site sur GitHub Pages, si les
  tests et l'accessibilité passent.

## 5. Limites et suites

- **Figma** n'était pas disponible. Les maquettes sont des SVG versionnés, et le prototype haute fidélité est
  le site lui-même. Reproduire le système visuel dans Figma serait utile pour une équipe de design.
- **Test utilisateur** : le protocole (5 participants, 3 tâches, questionnaire SUS) est prêt mais n'a pas été
  mené. C'est la prochaine étape, avant toute nouvelle fonctionnalité.
- **Temps réel** : l'instantané pourrait être régénéré chaque heure par une tâche planifiée, ou remplacé par
  une API publique en lecture seule placée derrière un cache.
- **Notifications** : « prévenez-moi la veille si l'air sera dégradé près de chez moi » est la fonctionnalité
  que les personas réclament le plus. Elle demande un service d'envoi et la gestion du consentement (RGPD).

## 6. Lien avec les autres modules

Le tableau de bord est la vitrine des modules 1 à 4. Il respecte les choix de sécurité du module 5 : site
statique, aucune donnée personnelle, aucune API authentifiée exposée. Le module 7 le présente comme point
d'entrée du projet.
