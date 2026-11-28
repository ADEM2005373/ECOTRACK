# Livrables EcoTrack V2

Ce dossier regroupe les livrables académiques et liens de démonstration du projet **EcoTrack V2**.

## 1. Documents Officiels
- **Rapport du projet** : [`project_report_ECOTRACK.pdf`](./project_report_ECOTRACK.pdf)
- **Cahier des charges** : [`cahier_de_charge_ecotrack.pdf`](./cahier_de_charge_ecotrack.pdf)

## 2. Application Mobile (APK Android) & Web
- **Téléchargement direct APK Android (EAS Build)** :  
  https://expo.dev/artifacts/eas/vbhVFWECLzqKnyACagN6L_cM8H91sTb0tynBf81pWzk.apk
- **Console Web déployée (Vercel)** :  
  https://ecotrack-seven-liard.vercel.app

## 3. Vidéos de Démonstration Mobile
Les vidéos de démonstration mobile sont à placer dans le sous-dossier `livrable/demos/` :
- `livrable/demos/demo-citoyen.mp4` *(Parcours Citoyen : création de signalement, photo + GPS + suivi)*
- `livrable/demos/demo-chef-ouvrier.mp4` *(Parcours Chef Ouvrier : prise en charge, alerte renfort/panne, clôture avec preuve photo)*

## 4. Démarrage Complet du Serveur par le Professeur (PC local ou Déploiement)
1. Copier les fichiers d'environnement :
   - Racine : `Copy-Item .env.example .env` (renseigner `NGROK_AUTHTOKEN` et `NGROK_STATIC_DOMAIN` si tunnel Ngrok utilisé)
   - Web local : `Copy-Item apps/web-react/.env.example apps/web-react/.env.local` (avec `API_PROXY_TARGET=http://localhost:8090`)
   - Web production : `apps/web-react/.env.production.example`
   - Mobile local : `Copy-Item apps/mobile/.env.example apps/mobile/.env`
   - Mobile production : `apps/mobile/.env.production.example`
2. Installer les dépendances : `npm install`
3. Lancer l'infrastructure Docker + tous les microservices (`identity-api`, `report-api`, `workflow-api`, `audit-api`, `ai-vision`) + vérifier le tunnel :
   ```powershell
   npm run deploy:start
   npm run deploy:check
   ```
4. Optionnel (données de démonstration) : `npx ts-node scripts/seed_zarzouna_live.ts`
