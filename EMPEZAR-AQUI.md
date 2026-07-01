# EMPEZAR AQUÍ — PENMA

Guía corta. Solo 3 pasos después de la instalación inicial.

---

## Instalación (una sola vez)

```cmd
cd C:\Users\Penma\StreamTools
git pull
npm install
copy config.ejemplo.bat config.bat
notepad config.bat
```

En `config.bat` poné tu clave en `ADMIN_SECRET=`.

Cloudflared tiene que estar en `C:\cloudflared\cloudflared.exe`.

---

## Cada directo — 3 pasos

### PASO 1 — Doble click en `arrancar-todo.bat`

Se abren 2 ventanas. **No las cierres.**

- **StreamTools SERVIDOR**
- **StreamTools TUNEL**

En la ventana **TUNEL** buscá y copiá la URL:

```
https://algo-random.trycloudflare.com
```

---

### PASO 2 — Doble click en `paso-final.bat`

Pegá la URL que copiaste. Enter.

Se reinicia el servidor con la URL correcta.

---

### PASO 3 — Admin y OBS

1. Chrome → **http://localhost:3847/admin.html**
2. Tu clave → **Entrar** → **Generar link** → **Copiar**
3. El link tiene que empezar con **https://....trycloudflare.com**
4. Mandalo por DM

**OBS** (una vez): Browser Source → `http://localhost:3847/overlay.html` → 1920×1080 → CSS transparente.

---

## Regla de oro

| Para qué | URL |
|----------|-----|
| Vos — admin | `http://localhost:3847/admin.html` |
| Vos — OBS | `http://localhost:3847/overlay.html` |
| Viewers — mandar por DM | `https://....trycloudflare.com/editor.html?token=...` |

**Nunca mandes links con `localhost` a otra persona.**

---

## Si algo falla

- **"localhost rechazó la conexión"** → el servidor no está corriendo. Volvé al PASO 1.
- **Links salen con localhost** → no hiciste PASO 2. Corré `paso-final.bat` y recargá admin.
- **Puerto ocupado** → cerrá ventanas viejas de StreamTools o reiniciá la PC.

Dudas → Lenny.
