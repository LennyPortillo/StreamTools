# PENMA Overlay — Guía para el directo (Windows)

Esta guía es para **PENMA**. Vos arrancás el servidor, abrís el túnel, configurás OBS y le pasás enlaces solo a la gente que quieras.

El proyecto vive en **GitHub**. Cuando el dev sube cambios, vos solo hacés **actualizar** — no te pasan archivos a mano.

---

## Primera vez — bajar el proyecto desde GitHub

### 1. Instalar Git (Windows)

1. Entrá a https://git-scm.com/download/win
2. Instalá con las opciones por defecto
3. Verificá en CMD o PowerShell:

```powershell
git --version
```

> **Alternativa más visual:** [GitHub Desktop](https://desktop.github.com) — clonás el repo con clicks y actualizás con "Fetch origin" → "Pull origin".

### 2. Clonar el repo

**Si todavía NO tenés la carpeta:**

```powershell
cd C:\Users\Penma
git clone https://github.com/LennyPortillo/StreamTools.git
cd StreamTools
```

**Si ya tenés `StreamTools` (error "already exists"):**

```powershell
cd C:\Users\Penma\StreamTools
git pull
```

No hace falta clonar de nuevo. `git pull` baja la versión nueva.

### 2b. Instalar Node.js (si `npm` no se reconoce)

Si ves *"npm no se reconoce como comando"*:

1. Entrá a https://nodejs.org
2. Descargá la versión **LTS**
3. Instalá (Next → Next, dejá todo por defecto)
4. **Cerrá CMD y abrí una ventana nueva**
5. Verificá:

```powershell
node -v
npm -v
```

Si ves números de versión, recién ahí corré `npm install`.

### 3. Configurar tu clave (solo una vez)

**Primero** asegurate de tener la última versión (`git pull`).

```powershell
copy config.ejemplo.bat config.bat
notepad config.bat
```

Si `config.ejemplo.bat` no existe, hacé `git pull` primero.  
Si igual no aparece, crealo a mano con Notepad — archivo `config.bat` en la carpeta StreamTools:

```bat
set ADMIN_SECRET=tu-clave-secreta-aqui
set CLOUDFLARED=C:\cloudflared\cloudflared.exe
```

Editá `ADMIN_SECRET` con una clave que solo vos sepas. Guardá.

`config.bat` **no se sube a GitHub** — es tuyo y privado.

### 4. Instalar dependencias

```powershell
npm install
```

---

## Cuando el dev sube cambios

Antes del directo (o cuando te avisen que hubo update):

**Opción A — doble click:** `actualizar.bat`

**Opción B — terminal:**

```powershell
cd C:\ruta\a\StreamTools
git pull
npm install
```

Eso baja la última versión. No perdés tu `config.bat` ni tus tokens viejos (están en `data.json`, que tampoco va al repo).

---

## Archivos .bat (atajos en Windows)

| Archivo | Qué hace |
|---------|----------|
| `actualizar.bat` | `git pull` + `npm install` |
| `iniciar-servidor.bat` | Arranca el servidor local |
| `iniciar-tunel.bat` | Abre cloudflared (URL pública) |
| `iniciar-servidor-publico.bat` | Servidor con la URL del túnel ya pegada |

---

## Qué hace esto

- **Vos** tenés OBS con un overlay transparente 1920×1080.
- **Viewers invitados** abren un enlace, suben imágenes/memes y las mueven en pantalla.
- Lo que ellos ponen **aparece al instante** en tu OBS y en el directo.

Vos controlás quién puede editar: sin enlace con token, nadie puede tocar nada.

---

## Antes del directo (solo una vez)

### 1. Instalar Node.js

1. Entrá a [https://nodejs.org](https://nodejs.org)
2. Descargá la versión **LTS**
3. Instalá con Next → Next (dejá todo por defecto)
4. Abrí **PowerShell** o **CMD** y verificá:

```powershell
node -v
npm -v
```

Si ves números de versión, está bien.

### 2. Instalar cloudflared

1. Entrá a [https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Descargá **Windows 64-bit**
3. Descomprimí `cloudflared.exe` en una carpeta fija, por ejemplo:
  `C:\cloudflared\cloudflared.exe`
4. (Opcional) Agregá esa carpeta al PATH para usar `cloudflared` desde cualquier terminal.

### 3. Instalar dependencias del proyecto

Abrí PowerShell en la carpeta del proyecto (donde está `package.json`):

```powershell
cd RUTA\A\PENMA
npm install
```

Solo hace falta la primera vez (o si se actualiza el proyecto).

### 4. Elegir tu clave de admin

Pensá una contraseña que solo vos sepas. Ejemplo: `mi-clave-secreta-2026`

La vas a usar cada vez que arranques el servidor. **No se la des a nadie.**

---

## Cada vez que vayas a streamear

Necesitás **3 cosas abiertas** al mismo tiempo:


| #   | Qué           | Para qué                                       |
| --- | ------------- | ---------------------------------------------- |
| 1   | Servidor Node | Guarda imágenes y sincroniza todo              |
| 2   | cloudflared   | Expone el servidor a internet para los viewers |
| 3   | OBS           | Muestra el overlay en el directo               |


---

### Paso 1 — Arrancar el servidor

Abrí **PowerShell** o **CMD**:

```powershell
cd RUTA\A\PENMA
set ADMIN_SECRET=mi-clave-secreta-2026
npm start
```

Dejá esta ventana **abierta**. Deberías ver algo como:

```
PENMA Overlay → http://localhost:3847
OBS Browser Source → http://localhost:3847/overlay.html
Admin → http://localhost:3847/admin.html
```

> **PowerShell moderno** también acepta:
> `$env:ADMIN_SECRET="mi-clave-secreta-2026"; npm start`

---

### Paso 2 — Abrir el túnel (internet para viewers)

Abrí **otra** ventana de PowerShell/CMD:

```powershell
C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3847
```

(o `cloudflared tunnel --url http://localhost:3847` si lo tenés en el PATH)

Esperá unos segundos. Vas a ver una línea como:

```
https://algo-random.trycloudflare.com
```

**Copiá esa URL.** Es la dirección pública del overlay.

Dejá esta ventana **abierta** durante todo el directo. Si la cerrás, los viewers pierden acceso.

---

### Paso 3 — Reiniciar el servidor con la URL pública

Volvé a la **primera** ventana (servidor), apretá **Ctrl+C** para pararlo, y arrancalo de nuevo **con la URL del túnel**:

**CMD:**

```cmd
set PUBLIC_URL=https://TU-URL.trycloudflare.com
set ADMIN_SECRET=mi-clave-secreta-2026
npm start
```

**PowerShell:**

```powershell
$env:PUBLIC_URL="https://TU-URL.trycloudflare.com"
$env:ADMIN_SECRET="mi-clave-secreta-2026"
npm start
```

Reemplazá `TU-URL.trycloudflare.com` por la URL que te dio cloudflared.

Así los enlaces que generes para viewers ya salen con la dirección correcta.

---

### Paso 4 — Configurar OBS (una vez; después queda guardado)

1. Abrí **OBS Studio**
2. En **Fuentes** → **+** → **Navegador** (Browser)
3. Nombre: `PENMA Overlay`
4. Configuración:
  - **URL:** `http://localhost:3847/overlay.html`
  - **Ancho:** `1920`
  - **Alto:** `1080`
  - Marcá **"Personalizar frame rate del navegador"** → 30 fps (opcional)
5. Abrí **Propiedades** de la fuente → activá **CSS personalizado** y pegá:

```css
body { background-color: rgba(0,0,0,0); }
```

1. Aceptá. La fuente debe quedar **arriba** de tu gameplay/cámara en el orden de fuentes.

> OBS usa `localhost` porque el servidor corre en **tu** PC. Los viewers usan la URL del túnel; OBS no necesita internet para el overlay.

---

### Paso 5 — Panel de admin (vos)

Abrí en el navegador:

```
http://localhost:3847/admin.html
```

(o `https://TU-URL.trycloudflare.com/admin.html`)

1. Meté tu **ADMIN_SECRET** (`mi-clave-secreta-2026`)
2. Click en **Entrar**
3. Click en **Generar enlace de editor**
4. **Copiá el enlace** y mandalo por Discord, Twitter DM, etc. **solo a quien quieras**

Cada click genera un enlace distinto. Podés dar uno por persona.

---

### Paso 6 — Qué hacen los viewers

1. Abren el enlace que les mandaste (desde el celular o PC)
2. Ponen su nombre (opcional)
3. **Subir imagen** → eligen meme/foto
4. Arrastran para mover · esquina inferior derecha para agrandar · Supr para borrar

Vos deberías ver la imagen al instante en OBS.

---

## Resumen rápido (checklist)

- Terminal 1: `npm start` con `ADMIN_SECRET`
- Terminal 2: `cloudflared tunnel --url http://localhost:3847`
- Copiar URL del túnel → reiniciar servidor con `PUBLIC_URL`
- OBS: Browser Source → `http://localhost:3847/overlay.html` (1920×1080, fondo transparente)
- Admin → generar enlaces → mandar a viewers
- Probar: subir una imagen desde el celu y ver que aparece en OBS

---

## Problemas frecuentes

### "destination path already exists"

Ya clonaste antes. Entrá a la carpeta y actualizá:

```powershell
cd C:\Users\Penma\StreamTools
git pull
```

### "npm no se reconoce"

Node.js no está instalado o hay que abrir CMD de nuevo después de instalarlo. Ver sección **2b** arriba.

### "No se encuentra config.ejemplo.bat"

Tu carpeta es vieja. En la carpeta StreamTools:

```powershell
git pull
copy config.ejemplo.bat config.bat
```

### "address already in use :::3847"

El servidor ya está corriendo en otra ventana. **No es error del túnel.**

**Opción A:** Usá la ventana que ya está abierta y solo abrí `iniciar-tunel.bat` en otra.

**Opción B:** Para reiniciar con URL pública, usá `iniciar-servidor-publico.bat` (cierra el anterior solo).

**Opción C — manual:**

```powershell
netstat -ano | findstr :3847
taskkill /PID NUMERO /F
```

### "cloudflared no se reconoce" / túnel no arranca

No confundir con el error del puerto 3847. Falta instalar cloudflared:

1. https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Extraer `cloudflared.exe` a `C:\cloudflared\`
3. En `config.bat`: `set CLOUDFLARED=C:\cloudflared\cloudflared.exe`
4. Correr `iniciar-tunel.bat` de nuevo

El **servidor** (`iniciar-servidor.bat`) y el **túnel** (`iniciar-tunel.bat`) son **2 ventanas distintas**.

### "Cannot GET /" o página en blanco

Entrá directo a:

- Admin: `http://localhost:3847/admin.html`
- Overlay (OBS): `http://localhost:3847/overlay.html`

### Los viewers no ven / no pueden subir

- ¿Está abierta la ventana de **cloudflared**?
- ¿Reiniciaste el servidor con **PUBLIC_URL** después de copiar la URL del túnel?
- ¿Les mandaste el enlace **completo** con `?token=...`?

### OBS muestra fondo blanco o negro

Revisá el CSS personalizado en la fuente Browser:

```css
body { background-color: rgba(0,0,0,0); }
```

Clic derecho en la fuente → **Actualizar** si hace falta.

### La URL del túnel cambió

Con Quick Tunnel (`trycloudflare.com`) la URL **cambia cada vez** que reiniciás cloudflared. Tenés que:

1. Copiar la URL nueva
2. Reiniciar el servidor con el `PUBLIC_URL` nuevo
3. Generar enlaces de editor otra vez en admin

---

## Seguridad

- **ADMIN_SECRET:** solo vos. Sirve para el panel admin.
- **Enlaces con token:** solo quien tiene el enlace puede subir/mover imágenes.
- No publiques el enlace de admin ni tu secret en el chat del directo.

---

## URLs de referencia


| Quién            | URL                                                       |
| ---------------- | --------------------------------------------------------- |
| Vos — Admin      | `http://localhost:3847/admin.html`                        |
| Vos — OBS        | `http://localhost:3847/overlay.html`                      |
| Viewers — Editor | `https://TU-URL.trycloudflare.com/editor.html?token=XXXX` |


---

¿Dudas durante el directo? Revisá que las **2 terminales** sigan abiertas y probá subir vos mismo una imagen desde el celular con un enlace de editor.