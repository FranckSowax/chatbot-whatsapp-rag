# Tech Stack Document

Voici un aperçu clair et accessible des choix technologiques pour notre middleware intelligent, étape par étape.

## 1. Frontend Technologies

Nous avons opté pour une interface web simple et moderne afin que vos clients puissent s’inscrire, gérer leur compte et importer leurs documents en toute facilité.

- **Next.js & React**  
  Frameworks JavaScript qui offrent :  
  • Chargement rapide des pages (optimisation automatique)  
  • Navigation fluide sans recharger toute la page  
- **TypeScript**  
  Un sur-ensemble de JavaScript qui ajoute un système de types. Il permet :  
  • de réduire les erreurs de code ;  
  • d’améliorer la maintenabilité et la lisibilité du projet.  
- **CSS Modules** (ou solution CSS intégrée à Next.js)  
  Pour organiser les styles par composant et éviter les conflits de noms  
- **Typographies & Couleurs**  
  • Polices : Inter ou Roboto, reconnues pour leur lisibilité  
  • Palette neutre : blanc, gris, bleu — pour un look professionnel et facilement personnalisable ultérieurement  

> Rôle principal : offrir un tableau de bord intuitif, rapide et extensible, où chaque élément de l’interface est clair et cohérent.

## 2. Backend Technologies

Le moteur central de notre solution repose sur une API en Python avec FastAPI, reliée à Supabase pour la gestion des données.

- **FastAPI (Python)**  
  • Crée des API très performantes et faciles à documenter  
  • Support natif de la gestion asynchrone, indispensable pour répondre en moins d’une seconde aux messages WhatsApp  
- **Supabase** (plateforme tout-en-un)  
  • **Auth** : gestion des comptes, connexions et réinitialisations de mots de passe  
  • **PostgreSQL** : base relationnelle pour stocker configurations, clés API ManyChat, historiques de facturation et de conversations  
  • **pgvector** : extension pour stocker et rechercher des vecteurs (représentations mathématiques des textes)  
  • **Storage** : espace de stockage sécurisé pour les PDF importés par chaque client  
- **Google Gemini Pro 1.5**  
  • Modèle d’IA qui prend en entrée des extraits de vos documents et la question posée  
  • Génère des réponses précises et contextualisées  

> Rôle principal : orchestrer la réception des messages, lancer la recherche dans Supabase, appeler Gemini et renvoyer la réponse au client sans jamais mélanger les données des différents tenants.

## 3. Infrastructure et Déploiement

Pour assurer fiabilité, montée en charge et déploiement simplifié, nous utilisons :

- **Vercel** (frontend)  
  • Déploiement continu pour le tableau de bord Next.js  
  • Mise en ligne automatique à chaque modification validée sur GitHub
- **Docker sur AWS ou GCP** (backend)  
  • Conteneurisation de l’API FastAPI pour garantir un environnement identique en développement et en production  
  • Possibilité de faire monter en charge plusieurs instances si besoin
- **GitHub & GitHub Actions**  
  • Versionnage du code source  
  • Pipelines CI/CD pour :  
    – Lancer automatiquement les tests  
    – Construire et déployer les images Docker  
- **Sauvegardes Supabase**  
  • Backups journaliers et retention de 7 jours  

> Bénéfice : un processus de déploiement transparent, des mises à jour sécurisées et une plateforme prête à évoluer avec la croissance de vos utilisateurs.

## 4. Intégrations Tierces

Notre solution s’appuie sur des services externes pour gérer le chat, l’IA et la communication WhatsApp.

- **ManyChat API**  
  • Interface entre WhatsApp et notre API middleware  
  • Gère l’envoi et la réception immédiate des messages via le flux préconfiguré  
- **WhatsApp Business API**  
  • Assure la connexion officielle et la livraison des messages aux utilisateurs finaux  
- **Google Gemini Pro**  
  • Fournit la capacité de compréhension et de génération de réponses basées sur le contenu de vos PDF  

> Avantage : tirer parti de solutions spécialisées et robustes pour se concentrer sur la valeur métier (la mémoire et l’intelligence du bot).

## 5. Sécurité et Performance

Nous avons mis en place plusieurs mesures pour protéger les données et garantir une expérience fluide.

### Sécurité
- **Chiffrement**  
  • TLS (HTTPS) pour toutes les communications  
  • AES-256 au repos dans Supabase Storage et Database  
- **Isolation multi-tenant**  
  • Chaque document et chaque requête sont automatiquement filtrés par l’`owner_id` du client  
  • Règles SQL (Row-Level Security) pour empêcher tout accès croisé
- **GDPR**  
  • Collecte minimale avec consentement éclairé  
  • Possibilité d’export ou de suppression de données à tout moment  
  • Suppression automatique des données 30 jours après résiliation de l’abonnement
- **Rôles et permissions**  
  • Administrateur global, utilisateur de compte, support technique  
  • Contrôle d’accès précis sur chaque section du dashboard

### Performance
- **Accusé de réception rapide**  
  • Réponse « OK, bien reçu » en < 1 seconde pour respecter le timeout de ManyChat  
- **Traitement asynchrone**  
  • Ingestion et génération des réponses en tâche de fond (3–8 secondes attendues)  
- **Optimisation de la recherche**  
  • Index pgvector dans Supabase pour extraire rapidement les passages pertinents  

> Résultat : pas de blocage côté WhatsApp, des réponses précises en quelques secondes et une sécurité solide pour vos documents et conversations.

## 6. Conclusion et Récapitulatif

Notre middleware intelligent combine des technologies modernes et éprouvées pour offrir :

- Une **interface web** claire et rapide (Next.js, React, TypeScript)  
- Un **moteur API** performant et asynchrone (FastAPI, Python)  
- Une **gestion de données unifiée** (Supabase Auth, PostgreSQL, Storage, pgvector)  
- Une **IA de pointe** (Google Gemini Pro 1.5)  
- Une **connexion fluide** à WhatsApp via ManyChat  
- Une **infrastructure scalable** et un **déploiement automatisé** (Vercel, Docker, GitHub Actions)  
- Des **standards de sécurité** robustes (TLS, chiffrement, isolation multi-tenant, GDPR)  

Cette combinaison vous garantit un service clé en main : rapide à déployer, simple à utiliser et sécurisé, parfaitement aligné avec vos besoins métier et vos obligations réglementaires.