# PENMA Overlay

Overlay colaborativo para OBS: viewers invitados suben y mueven imágenes en tiempo real sobre tu stream.

## Roles

| Persona | Qué hace |
|---------|----------|
| **Dev** (vos) | Subís cambios al repo de GitHub |
| **PENMA** (streamer) | Clona el repo, hace `git pull` cuando hay updates, corre el overlay en directo |

## PENMA — primera vez

Ver **[INSTRUCCIONES.md](./INSTRUCCIONES.md)** (guía completa en Windows).

Resumen:

```powershell
git clone https://github.com/LennyPortillo/StreamTools.git
cd StreamTools
npm install
copy config.ejemplo.bat config.bat
# Editá config.bat con tu ADMIN_SECRET
```

## PENMA — antes de cada directo (si hubo cambios)

```powershell
cd StreamTools
git pull
npm install
```

Luego seguí la guía: servidor → túnel → OBS → admin.

## Dev — subir cambios

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Avisale a PENMA que haga `git pull` antes del próximo directo.

## URLs locales

| Página | URL |
|--------|-----|
| Admin | http://localhost:3847/admin.html |
| Overlay (OBS) | http://localhost:3847/overlay.html |
| Editor | `.../editor.html?token=XXX` (generado en admin) |

## Stack

Node.js · Express · Socket.io · Multer
