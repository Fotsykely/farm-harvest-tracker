# farm-harvest-tracker

Suivi mensuel des récoltes d'une coopérative agricole. Pour chaque parcelle et chaque mois, on saisit les quantités récoltées (en **kg**) de trois cultures : **riz, maïs, manioc**. La page Résultat classe les parcelles d'un mois par total décroissant.

Parcelles (fixes) : Parcelle Nord, Parcelle Sud, Verger, Potager, Colline, Bas-fond.

Stack : **Next.js 16** (front) et **ASP.NET Core / .NET 10** (API), avec MySQL 8.4 (EF Core 9 + Pomelo). Projet construit à partir du template [next-dotnet-template](https://github.com/Fotsykely/next-dotnet-template) (branche `mysql`).

## Ce que fait l'application

| Page | URL | Rôle |
|---|---|---|
| **Parcelles** | `/` | Les six parcelles, avec le choix du mois et de l'année. Chaque parcelle propose **Saisir** (mois vide) ou **Modifier** (une saisie existe déjà). |
| **Saisie** | `/harvests/new?plotId=…&year=…&month=…` | Les trois quantités (riz, maïs, manioc) d'une parcelle pour le mois choisi. |
| **Saisies** | `/harvests` | La liste des saisies du mois, avec **modifier** et **supprimer** (après confirmation). |
| **Résultat** | `/results` | Par parcelle : riz, maïs, manioc et total, du plus grand total au plus petit. Une parcelle sans saisie apparaît avec des zéros, en fin de tableau. |

Le menu en haut de page donne accès aux trois sections. Le mois et l'année choisis voyagent dans l'URL (`?year=2026&month=3`) : une page peut être mise en favori ou partagée. Sans choix, on est sur le mois en cours.

## Lancer le projet

Prérequis : .NET SDK 10 (voir `global.json`), Node.js 20.9 ou plus, Docker.

Trois terminaux.

**1. Base de données** (à la racine) :

```bash
cp .env.example .env        # ajustez le mot de passe et le port si besoin
docker compose up -d
```

**2. API** :

```bash
cd backend/Api
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost;Port=3307;Database=farm;User=farm;Password=change-me"
dotnet run                  # http://localhost:5080
```

Au démarrage, l'API applique les migrations ; la première insère les six parcelles. La chaîne de connexion n'est jamais dans le code : elle vient des *user secrets* en développement, ou de la variable d'environnement `ConnectionStrings__Default` ailleurs. Le port et le mot de passe doivent correspondre à votre `.env`.

> Au tout premier démarrage, le journal affiche un `fail: … SELECT "MigrationId" … FROM "__EFMigrationsHistory"`. C'est normal : EF lit la table d'historique avant qu'elle existe, puis applique la migration.

**3. Front** :

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Documentation interactive de l'API (en développement) : <http://localhost:5080/scalar>.

## Tests

```bash
cd backend && dotnet test                  # Docker doit tourner : Testcontainers lance un MySQL jetable
cd frontend && npm run lint && npm test    # ESLint, puis Vitest (client d'API, période, lecture du formulaire)
cd frontend && npm run build               # API_BASE_URL doit être définie (voir .env.local)
```

Les tests de l'API utilisent un vrai MySQL et non SQLite ou le fournisseur en mémoire : les migrations sont propres à Pomelo. La base est partagée par tous les tests d'une exécution : chaque test utilise **sa propre année** (2031, 2032…, 2050 et suivantes pour le résultat) pour ne jamais croiser les saisies d'un autre test.

## Architecture

```
Navigateur ──► Next.js (:3000) ──► API ASP.NET Core (:5080) ──► MySQL (:3307)
```

Seul le serveur Next.js parle à l'API. Il n'y a donc **pas de CORS** à configurer, et l'URL de l'API (`API_BASE_URL`, sans préfixe `NEXT_PUBLIC_`) n'arrive jamais dans le navigateur.

```
backend/
  Api/                  contrôleurs, DTOs, entités, DbContext, migrations
  Api.Tests/            xUnit + WebApplicationFactory + Testcontainers
frontend/
  lib/api-client/       client HTTP (server-only), un fichier par ressource, types des DTOs
  lib/                  période (mois/année), lecture des formulaires, helpers de routes
  components/           composants d'interface (menu, choix de période, formulaire de saisie…)
  app/                  pages (/, /harvests, /results) et Server Actions
```

### Points d'entrée de l'API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/plots` | les six parcelles (lecture seule) |
| GET | `/api/harvests?year=&month=&plotId=` | liste des saisies ; les trois filtres sont facultatifs |
| GET | `/api/harvests/{id}` | détail (404 si inconnu) |
| POST | `/api/harvests` | création (400 si invalide, **409 si la parcelle a déjà une saisie ce mois-là**) |
| PUT | `/api/harvests/{id}` | modification des trois quantités |
| DELETE | `/api/harvests/{id}` | suppression (204, ou 404) |
| GET | `/api/results?year=&month=` | résultat du mois : les six parcelles, déjà triées (400 si l'année ou le mois manque ou est invalide) |
| GET | `/health` | santé de l'API et de la base |

Les erreurs non gérées et les statuts nus (404, 405…) répondent en `ProblemDetails` (JSON).

### Le client d'API (`frontend/lib/api-client`)

- `client.ts` est le **seul** endroit qui fait du `fetch`. Il traduit les statuts HTTP en erreurs typées : 404 → `ApiNotFoundError`, 400 → `ApiValidationError` (noms de champs en camelCase), 409 → `ApiConflictError` (avec le message de l'API), autre → `Error`. Délai maximum de 5 s.
- `plots.ts`, `harvests.ts` et `results.ts` exposent une fonction par endpoint. Les pages et les Server Actions n'appellent que ces fonctions.
- `types.ts` reproduit à la main les DTOs de l'API. Quand un DTO change côté .NET, mettez à jour le type correspondant.
- Les composants client ne font jamais de requête : ils reçoivent leurs données ou appellent une Server Action.

## Décisions

- **Une seule saisie par parcelle et par mois.** Garantie par un index unique `(PlotId, Year, Month)` en base. Une seconde création répond **409 Conflict** (et non 400 : la requête est valide, c'est la donnée qui existe déjà), avec un message écrit pour l'utilisateur. Le contrôleur teste d'abord l'existence pour renvoyer ce message ; l'index reste le garde-fou si deux requêtes arrivent en même temps. Pour corriger une saisie, on la **modifie** : la page Parcelles propose directement « Modifier » quand elle existe.
- **La parcelle et le mois d'une saisie ne changent jamais.** `PUT` ne prend que les trois quantités. Pour déplacer une saisie : la supprimer et en créer une autre.
- **Les six parcelles sont fixes.** Elles sont insérées par la migration avec des identifiants explicites (l'ordre de la liste ne dépend pas de l'ordre d'insertion). Pas d'écriture sur `/api/plots`.
- **Quantités : `DECIMAL(10,2)`, de 0 à 9 999 999,99 kg.** Zéro est une valeur valide (« rien récolté »), mais un champ vide est refusé : on ne confond pas « 0 » et « pas saisi ».
- **Le total est calculé par l'API**, jamais stocké ni recalculé par le front.
- **Le résultat est calculé dans l'API** (`ResultsController`), pas dans le front. C'est une règle métier (zéros pour une parcelle sans saisie, ordre des lignes) : elle est testée avec le reste de l'API et le front n'affiche que les lignes dans l'ordre reçu. Le calcul se fait en mémoire sur six parcelles, ce qui reste plus lisible qu'une jointure SQL.
- **Ordre du résultat** : total décroissant ; à total égal, une parcelle qui **a une saisie** passe avant une parcelle qui n'en a pas (une saisie à zéro n'est pas une absence de saisie) ; puis ordre de la liste des parcelles. Chaque ligne porte `hasEntry`, et la page écrit « Aucune saisie » sous le nom de la parcelle concernée.
- **Mois et année dans l'URL**, lus par `lib/period.ts`. Une valeur absente ou invalide retombe sur le mois en cours, sans erreur. Après une création, une modification ou une suppression, on revient sur la liste du mois concerné.
- **Saisie à la française** : « 12,5 » et « 12.5 » sont acceptés, les espaces sont ignorés. Un texte qui n'est pas un nombre (« abc ») est signalé par le front, car il ne peut pas être envoyé en JSON ; toutes les autres règles (obligatoire, 0 à 9 999 999,99) restent dans l'API, qui est la seule à valider.
- **Les parcelles ont toujours un nom unique** (index unique) et une longueur maximale partagée entre EF et la validation.
- Le code de l'exemple du template (`Item`) a été supprimé.

## Base de données et migrations

Depuis `backend/` :

```bash
dotnet tool restore
dotnet ef migrations add NomDeLaMigration --project Api
```

`dotnet ef` a besoin d'une chaîne de connexion pour construire l'application : exportez `ConnectionStrings__Default` si vous n'avez pas de *user secret*.

Branche `mysql` du template : le projet reste en `net10.0`, mais les paquets EF Core sont en `9.*` car Pomelo n'a pas de version pour EF Core 10. L'outil `dotnet-ef` est donc en 9.0.23 (avec `rollForward`), et `MySqlConnector` est épinglé en 2.6.2 (la 2.4.0 tirée par Pomelo a une vulnérabilité connue).

## Pièges Next.js 16 déjà rencontrés

`next.config.ts` active `cacheComponents` et `partialPrefetching`. Conséquences :

- **Toute lecture de l'API doit être sous une frontière `<Suspense>`.** Le `loading.tsx` racine couvre les pages de premier niveau, mais pas une navigation client vers une route imbriquée. Chaque page affiche donc son titre tout de suite et lit `searchParams` / `params` puis appelle l'API dans un composant enfant, dans son propre `<Suspense>`. Sans cela, `next dev` affiche *« encountered uncached data during prerendering or a navigation »*.
- **La date du jour se lit via `lib/today.ts`** (`await connection()` puis `new Date()`), jamais directement : en `next dev` comme en `next build`, `new Date()` dans le rendu d'une page échoue (« unstable value `new Date()` while prerendering »), même après `await searchParams`.
- **`usePathname()` (le menu) doit être sous `<Suspense>`** : `components/main-nav.tsx` affiche d'abord les liens sans section active, puis marque la section courante.
- `params` et `searchParams` sont des promesses : `await props.params`.
- `error.tsx` reçoit la prop `retry` (et non `reset`).
- `redirect()` fonctionne en levant une exception : appelez-le **hors** des `try/catch`.
- Une page « introuvable » répond en HTTP 200, car la page est streamée avant que l'API réponde. C'est une limite connue du streaming.
- `next build` appelle l'API pendant le rendu : `API_BASE_URL` doit être définie, sinon le build échoue avec « API_BASE_URL is not set ».
- Les types `PageProps` / `LayoutProps` sont générés : après un clone, lancez `npx next typegen` (ou `next dev` / `next build`) avant `tsc`.
- Le fichier `frontend/AGENTS.md` est généré par `next dev` : gardez-le versionné pour ne pas recréer une modification à chaque lancement.

## Limites

- Pas d'authentification, pas de CORS (inutile tant que seul le serveur Next appelle l'API).
- Pas de CI ni de Dockerfiles : Docker ne sert qu'à MySQL.
- Les types du front sont écrits à la main. Pour de gros projets, générez-les depuis `/openapi/v1.json`.
- La réponse de l'API est typée par un cast `as T` à un seul endroit (`client.ts`), sans validation à l'exécution.
- Le résultat est mensuel : il n'y a pas de cumul sur l'année ni de total de la coopérative.
- Conventions : identifiants et commentaires en anglais, textes affichés à l'utilisateur en français, commits en [Conventional Commits](https://www.conventionalcommits.org/).
