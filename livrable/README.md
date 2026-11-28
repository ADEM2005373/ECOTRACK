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

## 3. Vidéos de Démonstration
Les vidéos de démonstration enregistrées sont disponibles dans `livrable/demos/` :
- [`livrable/demos/mobile_phone_framed.mp4`](./demos/mobile_phone_framed.mp4) *(Démo mobile complète encadrée téléphone — Citoyen & Chef Ouvrier)*
- [`livrable/demos/web_pc_framed.mp4`](./demos/web_pc_framed.mp4) *(Démo console web complète encadrée PC)*
- [`livrable/demos/demo_mobile_citoyen.mp4`](./demos/demo_mobile_citoyen.mp4) *(Parcours Citoyen mobile)*
- [`livrable/demos/demo_mobile_chef_ouvrier.mp4`](./demos/demo_mobile_chef_ouvrier.mp4) *(Parcours Chef Ouvrier mobile)*

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
