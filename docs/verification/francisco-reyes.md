# Verificación — Lo que cada tarea muestra de su responsable

Expectativa inicial antes de revisar tests: 0 de 3 cubiertos, ya que la suite funcional existente está centrada en autenticación (auth) y contiene pruebas relacionadas con nombre e iniciales del usuario. Esas pruebas pueden validar comportamiento auxiliar reutilizado por el assignee, pero no verifican que una tarea exponga correctamente a su responsable, ni que no filtre datos de cuenta, ni el caso de un responsable sin nombre dentro de la respuesta de una tarea. Por eso, antes de hacer la trazabilidad detallada, mi expectativa es que ninguno de los tres scenarios esté cubierto específicamente.

Scenarios en el requisito: 3 · Cubiertos: 0

## Parte A — Matriz y tests que faltan

### A.1 Matriz de trazabilidad

| Scenario | Test que lo cubre | Estado | Qué falta para decidirlo (si No lo sé) |
|---|---|---|---|
| Responsable identificable: el `assignee` de una tarea de "Ada Lovelace" trae nombre e iniciales | — (ninguno) | No cubierto | - |
| La tarea no filtra datos de cuenta: el `assignee` no incluye email ni datos de acceso, en tarea suelta ni en lista | — (ninguno) | No cubierto | - |
| Responsable sin nombre: nombre nulo e iniciales presentes | — (ninguno) | No cubierto | - |

### Evidencia de la cobertura existente

- `backend/tests/` solo contiene `bootstrap.ts` y `functional/auth/` (`signup`, `login`, `session`, `initials`). No hay ningún test de `tasks` (`grep -i "task|assignee"` sobre `tests/` no devuelve nada) y no existe `tests/unit/`.
- `initials.spec.ts` es el único candidato por nombre («un nombre de dos palabras da la inicial de cada una», «sin nombre, las iniciales salen del email»), pero sus assertions comprueban `data.user.initials` de `POST /api/v1/auth/login`, es decir, el `UserTransformer` de la cuenta. Nunca crea una tarea ni lee un `assignee`. Cubre el requisito de auth «Iniciales de la cuenta», no este. Además, en la cuenta sin nombre espera `AE` (iniciales del email), mientras que este requisito exige nombre nulo en la tarea.
- Nota (sin corregir, fuera del alcance): `TaskTransformer` (`GET /tasks`, `POST /tasks`, `PATCH .../status`) serializa el `assignee` con `UserTransformer`, que incluye `email`, `createdAt` y `updatedAt`. Solo `TaskDetailTransformer` usa `TaskAssigneeTransformer` (`id`, `fullName`, `initials`). Un test del segundo scenario sobre la lista fallaría hoy.

### A.2 Tests añadidos

Fichero: `backend/tests/functional/tasks/assignee.spec.ts` (grupo «Tasks | responsable»).

| Test | Scenario | Resultado |
|---|---|---|
| el responsable llega con su nombre y sus iniciales | Responsable identificable | Pasa |
| el responsable no trae el email ni otros datos de acceso | La tarea no filtra datos de cuenta | Falla |
| un responsable sin nombre llega con nombre nulo e iniciales | Responsable sin nombre | Pasa |

El que falla contradice la spec porque `GET /api/v1/tasks` devuelve el `assignee` con el email de la cuenta (y sus fechas), mientras que el scenario exige que no incluya el email; solo la tarea suelta (`GET /tasks/:id`) lo respeta.

## Parte B - Conclusiones

1. Esperaba 0 de 3 scenarios cubiertos antes del análisis y se confirmó estaban 0 de 3 cubiertos.
2. En "La tarea no filtra datos de cuenta" dudé si faltaba un test o faltaba precisión en la propia regla: la spec prohíbe el email y habla de "ningún otro dato de esa cuenta", pero no deja claro si campos como id, createdAt o updatedAt también deben considerarse como filtros.
3. Al no fijar la spec el valor de las iniciales, asumí `AL` para «Ada Lovelace» (de la regla de auth) y para la cuenta sin nombre solo exigí un texto no vacío.
