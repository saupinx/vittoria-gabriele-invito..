# Vittoria & Gabriele — invito al matrimonio

Sito statico, mobile-first (larghezza massima 430px). Data: 10 giugno 2027.

## GitHub Pages

1. Su GitHub crea un repository **pubblico** (ad esempio `vittoria-gabriele-invito`), senza inizializzarlo con altri file.
2. Carica **il contenuto di questa cartella** nella directory principale del repository: `index.html`, `assets/`, `.nojekyll`, ecc. (non caricare il file ZIP come unico file).
3. Apri **Settings → Pages → Build and deployment → Deploy from a branch**, scegli `main` e `/ (root)`, quindi **Save**.
4. Attendi che GitHub Pages pubblichi il sito. L'URL standard sarà `https://<USERNAME>.github.io/<REPO>/`.

Oppure usa Git da PowerShell dopo aver creato il repository:

```powershell
git init
git add .
git commit -m "Wedding invitation initial release"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## Funzionalità

- Animazione di apertura busta in MP4, con passaggio al sito.
- Sito in italiano con foto, calendario, programma, dress code, luogo e conto alla rovescia.
- RSVP via WhatsApp: apre un messaggio precompilato; l'invitato deve inviarlo manualmente. Non è presente un database.
- Per modificare testi o contatti: `index.html` e `assets/js/app.js`.
- Per cambiare lo sfondo: `assets/images/terrace-static-bg.webp`.

**Nota sulla privacy:** in un repository pubblico diventano accessibili anche i dati bancari e le fotografie presenti nell'invito. Verificare il consenso dei titolari prima della pubblicazione.
