# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Sonnet
**Herramienta:** Claude Code

```
Analiza el vertical existente de cuentas y acceso de FlowSync y escribe una spec viva de su comportamiento actual.

Limita el análisis exclusivamente a:
- registro;
- inicio de sesión;
- sesión/autenticación;
- perfil;
- cierre de sesión;
- protección de acceso/rutas.

Debes inspeccionar el comportamiento completo en las dos capas:
- lo que expone y responde la API;
- lo que una persona puede ver y hacer en el frontend.

No propongas funcionalidades nuevas.
No modifiques código.
No corrijas comportamientos aunque parezcan inconsistentes.
No documentes tareas ni ninguna otra capability fuera de cuentas y acceso.

Escribe el resultado en `docs/spec-viva/francisco-reyes.md`.

El documento debe describir exclusivamente comportamiento observable desde fuera y usar este formato:

## Purpose

Una o dos frases que expliquen para qué existe esta capability.

## Requirements

### Requirement: <nombre>

El sistema SHALL ...

#### Scenario: <nombre>
- **WHEN** ...
- **THEN** ...

Cada requisito debe tener al menos un Scenario.

Escribe en castellano, salvo las palabras normativas SHALL/MUST/SHOULD y WHEN/THEN.

No uses secciones ADDED, MODIFIED ni REMOVED: esto no es un delta sino la descripción del comportamiento actual.

En la spec no incluyas nombres de archivos, clases, funciones ni rutas internas de código.

Antes de terminar, indica en el chat cuántos requisitos has escrito. No modifiques ningún archivo aparte de `docs/spec-viva/francisco-reyes.md`.
```

**Qué salió:**:

Resultado ejecución:

```
- API (7): registro, validación del registro, inicio de sesión, rechazo de credenciales, perfil, cierre de sesión y protección de recursos privados.
- Frontend (12):
  - pantalla y errores de registro;
  - pantalla y errores de inicio de sesión;
  - persistencia y restauración de la sesión;
  - pérdida de sesión explicada;
  - pantalla de perfil;
  - cierre de sesión;
  - rutas privadas;
  - rutas públicas;
  - rutas desconocidas;
  - errores de conexión y de servidor.
- Verificación: la spec sale de leer el código de ambas capas. No arranqué la aplicación para no escribir en la base de datos local, así que nada se ha comprobado ejecutándolo.
- Fuera de alcance: no describí comportamientos que el código no deja claros, como si el email distingue mayúsculas de minúsculas o si el token caduca.
- Commit y PR: no he hecho commit ni PR, aunque el CLAUDE.md los pide al cerrar una tarea. Tu instrucción era no tocar nada más que el fichero de la spec. Si quieres, lo hago después con /commit, gh pr create y el revisor adversarial.
```
