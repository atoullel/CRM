
# CRM

## 1. Présentation du projet

Ce projet est une application CRM permettant de gérer une liste de contacts avec :

* des champs fixes (nom, entreprise, téléphone, date d’arrivée, score) ;
* des colonnes personnalisées dynamiques ;
* une édition directement dans une grille ;
* un chargement progressif des contacts ;
* une architecture pensée pour évoluer vers une solution multi-tenant.

L’objectif du test technique était principalement d’évaluer :

* la qualité de l’architecture ;
* la capacité à structurer un projet full-stack ;
* les choix techniques réalisés ;
* la maintenabilité du code ;
* la capacité à anticiper les évolutions futures.

---

# 2. Stack technique

## Backend

* **NestJS** : framework backend structuré basé sur TypeScript.
* **Prisma ORM** : accès base de données typé.
* **PostgreSQL** : stockage relationnel.
* **Docker** : environnement reproductible.

## Frontend

* **React + TypeScript**
* Architecture organisée par fonctionnalités (`features`) :

```
src
├── features
│   ├── contacts
│   │   ├── api
│   │   └── components
│   │       ├── ContactsTable
│   │       ├── TableRow
│   │       ├── TableHeader
│   │       └── EditableCell
│   │
│   └── columns
│       └── api
│
├── app
└── main.tsx
```

Cette organisation permet de garder les fonctionnalités isolées et facilite l'ajout futur de nouvelles sections.

---

# 3. Lancement de l’application

## Prérequis

* Docker
* Docker Compose

## Démarrage

Depuis le backend du projet (pour un clone neuf du projet) :

Voir .env.example pour initialiser .env à la racine, dans le backend et dans le frontend

```bash
npm install
```

Depuis la racine du projet :

```bash
docker compose up --build
```

Les services démarrés sont :

* frontend React ;
* backend NestJS ;
* PostgreSQL.

---

# 4. Initialisation de la base et données de démonstration

La base utilise Prisma.

Génération du client Prisma :

```bash
npx prisma generate
```

Application des migrations :

```bash
npx prisma migrate dev
```

Chargement des données de démonstration :

```bash
npx prisma db seed
```

Le seed initialise notamment :

* une organisation ;
* plusieurs colonnes personnalisées ;
* des contacts associés.

---

# 5. Architecture backend

L’application backend suit une organisation modulaire NestJS :

```
src
├── contacts
│   ├── contacts.controller.ts
│   ├── contacts.service.ts
│   └── dto
│
├── columns
│   ├── columns.controller.ts
│   ├── columns.service.ts
│   └── dto
│
├── prisma
│
└── common
    ├── constants
    └── validators
```

## Contacts

Responsable de :

* récupération paginée ;
* création ;
* modification ;
* suppression logique ;
* validation des champs ;
* gestion des valeurs dynamiques.

## Columns

Responsable de :

* gestion des colonnes personnalisées ;
* définition du type attendu ;
* préparation du système de grille dynamique.

---

# 6. Modèle de données

## Multi-tenant préparé

Même si l’authentification n’était pas dans le périmètre du test, le modèle a été conçu pour supporter une évolution multi-tenant.

Le modèle principal est :

```
Organization
      |
      |
  Contacts
      |
      |
 ContactValues


Organization
      |
      |
  Columns
```

Chaque contact et chaque colonne peuvent appartenir à une organisation.

Cela permettrait plus tard :

* plusieurs clients utilisant la même plateforme ;
* séparation des données par organisation ;
* ajout d’un système utilisateur/rôle.

Actuellement une organisation fixe est utilisée via :

```
CURRENT_ORGANIZATION_ID
```

---

# 7. Gestion des colonnes dynamiques (EAV)

Les colonnes personnalisées utilisent une approche EAV (**Entity Attribute Value**).

Exemple :

Une organisation peut créer :

| Colonne              | Type   |
| -------------------- | ------ |
| Taille entreprise    | NUMBER |
| Secteur              | TEXT   |
| Date contrat         | DATE   |
| Téléphone secondaire | PHONE  |

La table `ContactValue` stocke ensuite :

```
contactId
columnId
value
```

Avantages :

* ajout de colonnes sans modification du schéma SQL ;
* personnalisation par organisation ;
* structure adaptée à un CRM configurable.

Les types actuellement supportés :

```
TEXT
NUMBER
DATE
PHONE
```

---

# 8. Validation des données

La validation est centralisée.

## Champs fixes

Les champs standards sont validés côté backend :

* nom ;
* entreprise ;
* téléphone ;
* date ;
* score.

Exemples :

* téléphone avec contrôle du format ;
* score obligatoirement numérique entier ;
* date vérifiée avant insertion.

## Champs dynamiques

Lorsqu'une valeur personnalisée est envoyée :

1. récupération de la colonne correspondante ;
2. lecture de son type ;
3. validation adaptée.

Exemple :

Une colonne :

```
type = NUMBER
```

refusera :

```
"abc"
```

Une colonne :

```
type = DATE
```

refusera une date invalide.

Cette logique est commune entre champs fixes et dynamiques.

---

# 9. Fonctionnalités terminées

## Backend

✅ Structure NestJS complète
✅ Prisma + PostgreSQL
✅ Modèle de données CRM
✅ Soft delete
✅ CRUD contacts
✅ CRUD colonnes
✅ Colonnes dynamiques EAV
✅ Validation backend centralisée
✅ Pagination API
✅ Seed de données

---

## Frontend

✅ Affichage dynamique du tableau
✅ Chargement des colonnes depuis l’API
✅ Affichage des contacts
✅ Edition inline des cellules
✅ Mise à jour optimiste
✅ Gestion des erreurs avec rollback
✅ Indication visuelle pendant une sauvegarde
✅ Infinite scrolling avec Intersection Observer

---

# 10. Pagination et infinite scrolling

L’implémentation actuelle utilise une pagination offset :

```
?page=1&pageSize=50
?page=2&pageSize=50
```

Ce choix a été fait car :

* il est simple ;
* suffisant pour un MVP ;
* facile à comprendre ;
* adapté au volume attendu dans le cadre du test.

L’infinite scrolling frontend charge ensuite les pages suivantes automatiquement.

## Evolution possible

Pour une très grande volumétrie :

* plusieurs millions de contacts ;
* modifications fréquentes pendant la navigation ;

une pagination cursor-based pourrait être mise en place :

Exemple :

```
GET /contacts?cursor=12500
```

avec :

```
WHERE id > cursor
ORDER BY id
LIMIT 50
```

Cela réduirait le coût des grands offsets.

---

# 11. Fonctionnalités incomplètes

Certaines fonctionnalités prévues pour un CRM complet ne sont pas encore implémentées.

## Gestion UI des contacts

Le backend supporte :

* création ;
* modification ;
* suppression.

Cependant l’interface permettant :

* d’ajouter un contact ;
* supprimer un contact ;
* afficher un formulaire complet ;

n’est pas encore développée.

---

## Gestion UI des colonnes

Le backend permet déjà la gestion des colonnes.

Il manque encore :

* création de colonnes depuis l’interface ;
* suppression de colonnes ;
* modification du type ;
* réorganisation graphique.

La structure prévoit cependant cette évolution avec :

```
Column.position
```

qui permettra plus tard de supporter un drag & drop pour réordonner les colonnes.

---

## Recherche, tri et filtrage

Non implémentés actuellement.

L’architecture permet leur ajout futur.

Exemples possibles :

### Recherche

```
nom contient "Dupont"
```

### Tri

```
score DESC
```

### Filtrage dynamique

Exemple :

```
Secteur = "Industrie"
ET
Taille > 100
```

Pour les colonnes EAV, une couche de requêtes spécifiques serait nécessaire selon les besoins de performance.

---

# 12. Limites connues

## Gestion des très gros volumes

L’architecture actuelle est adaptée à un MVP.

Pour des volumes importants :

* pagination cursor ;
* index supplémentaires ;
* cache ;
* recherche dédiée (ElasticSearch/OpenSearch) ;

pourraient être nécessaires.

---

## Personnalisation avancée du tableau

La grille est fonctionnelle mais il manque encore :

* déplacement des colonnes ;
* masquage de colonnes ;
* largeur personnalisée ;
* préférences utilisateur.

---

## Gestion complète des colonnes dynamiques

La base est prête mais l’expérience utilisateur n’est pas complète :

* création depuis UI ;
* édition ;
* suppression ;
* réorganisation.

---

## Validation frontend

Aujourd’hui la validation finale est réalisée côté backend.

Une amélioration serait de récupérer les métadonnées des colonnes depuis l’API afin d’appliquer les mêmes règles directement côté navigateur avant envoi.

---

# 14. Tests

L'automatisation des tests n'est pas implémentée pour le moment.

---

# 15. Outils d’intelligence artificielle utilisés

Plusieurs outils d’IA ont été utilisés comme assistants durant le développement.

## ChatGPT

Utilisé principalement comme :

* outil de roadmap ;
* aide à la structuration du projet ;
* réflexion architecture ;
* organisation des phases d’implémentation.

## Claude

Utilisé principalement pour :

* revue de code ;
* vérification des implémentations ;
* suggestions d’amélioration ;
* analyse de certains choix techniques ;
* aide ponctuelle sur certaines parties frontend.

Ces outils ont servi comme support de réflexion et de validation, les choix finaux restant réalisés manuellement.

---

# 16. Temps approximatif consacré

Temps total estimé :

**Environ 25 heures**

Répartition approximative :

* analyse et architecture : 4h ;
* mise en place backend/base de données : 6h ;
* frontend et grille dynamique : 10h ;
* corrections, validations et améliorations : 5h.

---

# Conclusion

Le projet fournit une base CRM fonctionnelle avec une architecture conçue pour évoluer :

* backend modulaire ;
* modèle multi-tenant préparé ;
* colonnes dynamiques via EAV ;
* grille frontend extensible ;
* validations centralisées ;
* stratégie adaptée à un MVP.
