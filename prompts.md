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

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Quiero realizar una revisión de trazabilidad sobre un único requisito de este repositorio.
Trabaja únicamente sobre el requisito "Lo que cada tarea muestra de su responsable" de openspec/specs/tasks/spec.md.
Ya existe el archivo docs/verificacion/francisco-reyes.md. Conserva intacta la línea donde he escrito mi expectativa inicial de cobertura.
Quiero que analices los tests existentes del backend y actualices ese archivo con una matriz de trazabilidad del requisito.
Haz lo siguiente:
1. Identifica todos los scenarios que pertenecen exclusivamente a ese requisito.
2. Para cada scenario, busca si existe actualmente un test que lo cubra realmente.
3. No te fíes del nombre del test: abre el test y comprueba sus assertions.
4. Para cada scenario rellena en docs/verificacion/francisco-reyes.md:
   - Scenario, resumido en una sola línea.
   - Nombre exacto del test que lo cubre, si existe.
   - Estado: Cubierto, No cubierto o No lo sé.
   - Si el estado es No lo sé, explica brevemente qué falta para decidirlo, y profundiza hasta encontrar alguna evidencia de que está o no cubierto.
5. Actualiza también la cabecera:
   Scenarios en el requisito: N · Cubiertos: X
   donde N sea el número real de scenarios del requisito y X cuántos estaban cubiertos por tests existentes antes de escribir nuevos tests.
No escribas nuevos tests todavía.
No modifiques código de producción.
No modifiques la spec.
No analices otros requisitos de la capability tasks.
Al terminar, explícame brevemente qué archivos de test has revisado y por qué consideras cada scenario cubierto, no cubierto o dudoso.
```

**Qué salió:** 

- Confirmó que el requisito tiene 3 scenarios.
- Confirmó que actualmente hay 0 scenarios cubiertos.
- Revisó el único candidato razonable, initials.spec.ts, y justificó por qué no cuenta como cobertura: prueba data.user.initials en auth, no el assignee de una tarea.
- Un hallazgo que no he corregido, porque está fuera del alcance:
  - TaskTransformer serializa el assignee con UserTransformer, que incluye email, createdAt y updatedAt.
  - Eso afecta a la lista (GET /tasks), a POST /tasks y a PATCH .../status.
  - Solo el detalle usa TaskAssigneeTransformer.
  - Hoy el scenario «La tarea no filtra datos de cuenta» fallaría sobre la lista.
- No me agregó la última columna, se lo solicito en el siguiente prompt

---

## Prompt 2

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Vale pero no has incluido la cuarta columna, si no procede incluir nada en dicha columna rellena con `-`
```

**Qué salió:** 

Rellenó la nueva columna correspondiente, sin otro tipo de modificaciones

---

## Prompt 3

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Hemos terminado la matriz de trazabilidad del requisito "Lo que cada tarea muestra de su responsable" de openspec/specs/tasks/spec.md.
El análisis ha determinado que los 3 scenarios están actualmente No cubierto.
Quiero que implementes los tests funcionales que faltan, uno por cada scenario, exclusivamente dentro de: backend/tests/functional/tasks/
Los tres scenarios que deben quedar probados son:
1. Una tarea con responsable identificable muestra correctamente su nombre e iniciales.
2. El assignee de una tarea no filtra email ni otros datos de cuenta, tanto cuando se obtiene una tarea como cuando aparece en una lista si el scenario así lo exige.
3. Cuando el responsable no tiene nombre, la tarea devuelve el nombre como null pero sigue incluyendo sus iniciales.
Sigue el estilo y las convenciones de los tests funcionales existentes de backend/tests/functional/auth/, incluyendo la preparación y aislamiento de la base de datos.
Antes de implementar cada test, revisa la spec y utiliza únicamente lo que el scenario permite afirmar. Si algún detalle necesario para escribir el test no está determinado por la spec, no inventes silenciosamente una regla: toma la decisión mínima necesaria y explícame al final cuál fue.
No modifiques:
- código de producción
- controllers
- transformers
- models
- migrations
- frontend
- openspec/
- docs/verificacion/francisco-reyes.md
Si alguno de los nuevos tests falla debido al comportamiento actual de la aplicación, déjalo fallando. No cambies el código de producción ni relajes las assertions para hacerlo pasar.
Al terminar:
- Indícame qué test corresponde a cada scenario;
- Dime qué comando ejecutar para correr esos tests;
- Señala cualquier decisión que hayas tenido que tomar porque el scenario no la especificaba completamente.
```

**Qué salió:** 

Creó los 3 tests, y los tres tests están escritos en backend/tests/functional/tasks/assignee.spec.ts. Dos pasan y uno falla por un fallo real de la aplicación, que Claude ha dejado como está. No ha tocado producción, spec ni docs/. El typecheck y Prettier pasan.

Test de cada scenario
1. Responsable identificable: "el responsable llega con su nombre y sus iniciales". Pasa.
2. La tarea no filtra datos de cuenta: "el responsable no trae el email ni otros datos de acceso". Falla.
3. Responsable sin nombre: "un responsable sin nombre llega con nombre nulo e iniciales". Pasa.

Comando
cd backend && node ace test functional --files=assignee

Por qué falla el test 2
- GET /tasks, POST /tasks y PATCH .../status serializan el assignee con UserTransformer, que incluye el email. Es el hallazgo que ya anoté en la matriz.
- La tarea suelta (GET /tasks/:id) sí cumple.
- El error es expected { id: 2, …(5) } to not have nested property 'email'.
- Arreglarlo es cambiar TaskTransformer para que use TaskAssigneeTransformer, que está fuera de lo que me pediste tocar.

---

## Prompt 4

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Revisa ahora los tests que acabas de crear en backend/tests/functional/tasks/assignee.spec.ts contrastándolos exclusivamente contra el requisito «Lo que cada tarea muestra de su responsable» de openspec/specs/tasks/spec.md.
No modifiques ningún archivo todavía.
Quiero una revisión crítica scenario por scenario:
1. Comprueba que cada test verifica exactamente lo exigido por su scenario.
2. Señala cualquier assertion o endpoint que el test esté comprobando aunque el scenario no lo exija explícitamente.
3. Distingue entre:
   - algo exigido directamente por el scenario;
   - algo deducido del requirement general;
   - una decisión tomada al diseñar el test.
4. Comprueba especialmente si probar tanto GET /tasks/:id como GET /tasks en los scenarios 1 y 3 amplía el alcance más allá de lo requerido.
5. Comprueba si el test de «no filtra datos de cuenta» representa suficientemente la frase «ningún otro dato de esa cuenta» o si existe alguna ambigüedad que deba mencionarse en las conclusiones.
6. No propongas ni realices fixes de producción.
Al final, dime:
- si dejarías los tres tests tal como están;
- qué decisiones no estaban determinadas por la spec;
- qué hallazgo utilizarías para las líneas 2 y 3 de la Parte B.
No actualices todavía docs/verificacion/francisco-reyes.md.
```

**Qué salió:** 

La revisión confirmó que los tres tests son válidos y pueden mantenerse tal como están. También permitió distinguir entre lo exigido directamente por cada scenario, lo deducido del requirement general y las decisiones tomadas al diseñar los tests. El principal punto ambiguo está en el scenario de filtrado de datos: el email está claramente prohibido y el test detecta correctamente su exposición, pero la spec no delimita con precisión si otros campos de la cuenta como id, createdAt o updatedAt también deben considerarse filtraciones. Además, se identificó que el valor concreto de las iniciales no está determinado por la spec de tasks y tuvo que decidirse al escribir los tests.

---

## Prompt 5

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Actualiza docs/verificacion/francisco-reyes.md para cerrar el ejercicio.
Conserva intactos:
- mi expectativa inicial;
- Scenarios en el requisito: 3 · Cubiertos: 0;
- la matriz de trazabilidad original, porque representa la cobertura que existía antes de escribir los nuevos tests.
No generes una segunda matriz ni cambies las filas No cubierto a Cubierto.
Debajo de la matriz añade una sección breve ## Tests añadidos con:
- nombre exacto de cada nuevo test;
- scenario al que corresponde;
- resultado real de ejecución (Pasa o Falla);
- para el que falla, una frase explicando qué comportamiento observado contradice la spec.
Después añade ## Parte B con exactamente tres puntos, una línea cada uno:
1. Cuántos scenarios esperaba encontrar cubiertos antes del análisis y cuántos estaban realmente cubiertos.
2. El scenario en el que apareció una duda entre falta de test y falta de precisión de la regla/spec, explicando concretamente qué produjo la duda.
3. Una decisión concreta que hubo que tomar al escribir los tests porque el scenario no la determinaba.
Basa esas tres líneas únicamente en la investigación y en los tests que hemos realizado. No inventes nuevas conclusiones.
No modifiques los tests, la spec ni código de producción.
```

**Qué salió:** 

Rellenó los nuevos tests y las conclusiones