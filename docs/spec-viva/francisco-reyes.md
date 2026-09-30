## Purpose

Permitir que una persona cree una cuenta en FlowSync, acceda con su email y contraseña, consulte su perfil y cierre sesión, garantizando que solo quien tiene una sesión válida accede a las zonas privadas, tanto en la API como en la interfaz web.

## Requirements

### Requirement: Registro de cuenta mediante la API

El sistema SHALL permitir crear una cuenta con `POST /api/v1/auth/signup` a partir de nombre completo (opcional, puede ser nulo), email, contraseña y confirmación de contraseña, y SHALL responder con los datos públicos del usuario y un token de acceso, de modo que el registro deja a la persona con sesión iniciada. La respuesta SHALL ir envuelta en `{ "data": { "user": ..., "token": ... } }`.

#### Scenario: Registro correcto
- **WHEN** se envía un registro con email no registrado, contraseña de entre 8 y 32 caracteres y una confirmación idéntica
- **THEN** se crea la cuenta y la respuesta contiene `data.user` (con id, nombre completo, email, iniciales, fecha de creación y de actualización) y `data.token`
- **AND** la respuesta no incluye la contraseña

#### Scenario: Registro sin nombre
- **WHEN** se envía el registro con `fullName` a `null`
- **THEN** la cuenta se crea y el nombre completo del usuario queda vacío

#### Scenario: El token del registro es utilizable
- **WHEN** se usa el token devuelto por el registro como credencial en una petición al perfil
- **THEN** la petición se acepta y devuelve los datos de la cuenta recién creada

### Requirement: Validación de los datos de registro en la API

El sistema SHALL rechazar con estado 422 y un cuerpo `{ "errors": [...] }` (cada error con mensaje, regla y campo) cualquier registro que incumpla las reglas: la clave `fullName` debe estar presente (texto o nulo); el email debe tener formato válido, no superar 254 caracteres y no estar ya registrado; la contraseña debe tener entre 8 y 32 caracteres; la confirmación debe cumplir la misma longitud y ser igual a la contraseña. El sistema MUST NOT crear la cuenta ni emitir token cuando el registro es rechazado.

#### Scenario: Email ya registrado
- **WHEN** se envía un registro con un email que ya pertenece a otra cuenta
- **THEN** la API responde 422 con un error sobre el campo `email` de regla de unicidad

#### Scenario: Contraseña demasiado corta o demasiado larga
- **WHEN** se envía una contraseña de menos de 8 o más de 32 caracteres
- **THEN** la API responde 422 con un error sobre el campo `password`

#### Scenario: Confirmación distinta
- **WHEN** la confirmación de contraseña no coincide con la contraseña
- **THEN** la API responde 422 con un error sobre el campo `passwordConfirmation`

#### Scenario: Email con formato inválido o campos ausentes
- **WHEN** el email no tiene formato de email, o falta algún campo obligatorio
- **THEN** la API responde 422 con un error por cada campo incumplido

### Requirement: Inicio de sesión mediante la API

El sistema SHALL permitir iniciar sesión con `POST /api/v1/auth/login` enviando email y contraseña, y SHALL responder con los datos públicos del usuario y un token de acceso nuevo, envueltos en `{ "data": { "user": ..., "token": ... } }`.

#### Scenario: Credenciales correctas
- **WHEN** se envía el email y la contraseña de una cuenta existente
- **THEN** la API responde con `data.user` y un `data.token` válido para acceder a las zonas privadas

#### Scenario: Varios inicios de sesión
- **WHEN** la misma cuenta inicia sesión más de una vez
- **THEN** cada inicio devuelve un token distinto y los tokens anteriores siguen siendo válidos

### Requirement: Rechazo de credenciales inválidas en el inicio de sesión

El sistema SHALL rechazar el inicio de sesión cuando las credenciales no corresponden a una cuenta, sin indicar si falló el email o la contraseña, y SHALL responder 422 cuando la petición no cumple el formato mínimo (email con formato válido de hasta 254 caracteres y contraseña presentes). El sistema MUST NOT emitir token en ningún caso de rechazo.

#### Scenario: Contraseña incorrecta
- **WHEN** se envía un email existente con una contraseña equivocada
- **THEN** la API responde 400 con un error de credenciales inválidas, sin campo asociado

#### Scenario: Email inexistente
- **WHEN** se envía un email que no pertenece a ninguna cuenta
- **THEN** la API responde 400 con el mismo error de credenciales inválidas que en el caso anterior

#### Scenario: Petición mal formada
- **WHEN** falta el email o la contraseña, o el email no tiene formato válido
- **THEN** la API responde 422 con un error por cada campo incumplido

### Requirement: Consulta del perfil mediante la API

El sistema SHALL devolver con `GET /api/v1/account/profile` los datos públicos de la persona autenticada (id, nombre completo o nulo, email, iniciales, fecha de creación y de actualización) envueltos en `{ "data": ... }`. El sistema MUST NOT exponer la contraseña. Las iniciales SHALL calcularse así: si hay nombre completo con al menos dos palabras, la inicial de las dos primeras en mayúsculas; si el nombre tiene una sola palabra, sus dos primeras letras en mayúsculas; si no hay nombre, las dos primeras letras de la parte del email anterior a la arroba, en mayúsculas.

#### Scenario: Perfil con sesión válida
- **WHEN** se solicita el perfil con un token válido en la cabecera `Authorization: Bearer <token>`
- **THEN** la API responde 200 con los datos de la cuenta dueña del token

#### Scenario: Iniciales de un nombre compuesto
- **WHEN** el perfil pertenece a una cuenta con nombre "Ada Lovelace"
- **THEN** las iniciales devueltas son "AL"

#### Scenario: Iniciales de un nombre de una palabra
- **WHEN** el perfil pertenece a una cuenta con nombre "Ada"
- **THEN** las iniciales devueltas son "AD"

#### Scenario: Iniciales de una cuenta sin nombre
- **WHEN** el perfil pertenece a una cuenta sin nombre y con email "tu@email.com"
- **THEN** las iniciales devueltas son "TU"

### Requirement: Cierre de sesión mediante la API

El sistema SHALL permitir cerrar sesión con `POST /api/v1/account/logout` usando un token válido, invalidando únicamente el token presentado, y SHALL responder 200 con el mensaje `Logged out successfully` (sin el envoltorio `data`). Un token invalidado MUST NOT volver a dar acceso.

#### Scenario: Cierre correcto
- **WHEN** se llama al cierre de sesión con un token válido
- **THEN** la API responde 200 con `{ "message": "Logged out successfully" }`

#### Scenario: El token deja de valer
- **WHEN** tras cerrar sesión se usa el mismo token para consultar el perfil
- **THEN** la API responde 401

#### Scenario: Otras sesiones de la misma cuenta
- **WHEN** una cuenta tiene dos tokens y se cierra sesión con uno de ellos
- **THEN** el otro token sigue permitiendo acceder al perfil

### Requirement: Protección de los recursos privados en la API

El sistema SHALL exigir un token de acceso válido para consultar el perfil y cerrar sesión, y SHALL responder 401 cuando falte, sea inválido o haya sido revocado. El registro y el inicio de sesión SHALL ser accesibles sin token. Las respuestas de error de la API SHALL devolverse siempre en JSON.

#### Scenario: Sin token
- **WHEN** se solicita el perfil o el cierre de sesión sin cabecera de autorización
- **THEN** la API responde 401

#### Scenario: Token inventado
- **WHEN** se solicita el perfil con un token que no corresponde a ninguna sesión
- **THEN** la API responde 401

#### Scenario: Registro y login sin credenciales previas
- **WHEN** se llama al registro o al inicio de sesión sin cabecera de autorización
- **THEN** la API procesa la petición con normalidad

### Requirement: Pantalla de registro

El sistema SHALL ofrecer en la ruta `/register` un formulario titulado "Crea tu cuenta" con los campos "Nombre completo" (marcado como opcional), "Email", "Contraseña" (con la indicación "Entre 8 y 32 caracteres.") y "Repite la contraseña", un botón "Crear cuenta" y un enlace "Inicia sesión" hacia `/login`. Al registrarse con éxito, el sistema SHALL iniciar sesión automáticamente y llevar a la persona a su perfil.

#### Scenario: Registro completo desde la interfaz
- **WHEN** una persona sin sesión rellena todos los campos con datos válidos y pulsa "Crear cuenta"
- **THEN** aparece la pantalla de perfil con los datos de la nueva cuenta, sin tener que iniciar sesión aparte

#### Scenario: Registro sin nombre
- **WHEN** la persona deja vacío el nombre (o solo espacios) y envía el formulario con datos válidos
- **THEN** la cuenta se crea sin nombre y el perfil muestra "Sin nombre"

#### Scenario: Envío en curso
- **WHEN** el formulario se está enviando
- **THEN** el botón está deshabilitado y muestra "Creando cuenta…"

#### Scenario: Enlace a inicio de sesión
- **WHEN** la persona pulsa "Inicia sesión" en la pantalla de registro
- **THEN** navega a la pantalla de inicio de sesión

### Requirement: Mensajes de error en el registro

El sistema SHALL mostrar los errores del registro en castellano, bajo el campo correspondiente cuando el error pertenece a un campo visible, y en un aviso general en la parte superior del formulario en los demás casos. El sistema SHALL comprobar en la propia pantalla, antes de llamar a la API, que contraseña y confirmación coinciden, y los avisos del navegador por validación nativa MUST NOT bloquear el envío.

#### Scenario: Contraseñas distintas
- **WHEN** la persona envía el formulario con la contraseña y su repetición diferentes
- **THEN** bajo "Repite la contraseña" aparece "Las contraseñas no coinciden." y no se realiza ninguna llamada a la API

#### Scenario: Email ya registrado
- **WHEN** la persona se registra con un email que ya existe
- **THEN** bajo el campo "Email" aparece "Ese email ya está registrado. Inicia sesión en su lugar."

#### Scenario: Email con formato inválido
- **WHEN** la persona envía un email sin formato válido
- **THEN** bajo el campo "Email" aparece "Introduce una dirección de email válida."

#### Scenario: Contraseña fuera de longitud
- **WHEN** la persona envía una contraseña de menos de 8 caracteres
- **THEN** bajo el campo de contraseña aparece un mensaje indicando que debe tener al menos 8 caracteres

#### Scenario: Campo obligatorio vacío
- **WHEN** la persona deja vacío el email o la contraseña y envía el formulario
- **THEN** bajo el campo vacío aparece un mensaje de que falta rellenarlo

#### Scenario: Reintento
- **WHEN** la persona vuelve a enviar el formulario tras un error
- **THEN** los errores anteriores desaparecen mientras se procesa el nuevo envío

### Requirement: Pantalla de inicio de sesión

El sistema SHALL ofrecer en la ruta `/login` un formulario titulado "Inicia sesión" con los campos "Email" y "Contraseña", un botón "Entrar" y un enlace "Crea una" hacia `/register`. Al iniciar sesión con éxito, el sistema SHALL llevar a la persona a su perfil.

#### Scenario: Acceso correcto
- **WHEN** una persona sin sesión introduce credenciales válidas y pulsa "Entrar"
- **THEN** aparece la pantalla de perfil con sus datos

#### Scenario: Envío en curso
- **WHEN** el formulario se está enviando
- **THEN** el botón está deshabilitado y muestra "Entrando…"

#### Scenario: Enlace a registro
- **WHEN** la persona pulsa "Crea una"
- **THEN** navega a la pantalla de registro

### Requirement: Mensajes de error en el inicio de sesión

El sistema SHALL informar en castellano de los fallos de inicio de sesión mediante un aviso en la parte superior del formulario o bajo el campo afectado, y MUST NOT iniciar sesión cuando las credenciales son rechazadas.

#### Scenario: Credenciales incorrectas
- **WHEN** la persona introduce un email o una contraseña que no corresponden a una cuenta
- **THEN** aparece el aviso "El email o la contraseña no son correctos." y permanece en la pantalla de inicio de sesión

#### Scenario: Campos vacíos o email inválido
- **WHEN** la persona envía el formulario con un campo vacío o un email sin formato válido
- **THEN** el mensaje correspondiente aparece bajo el campo afectado, en castellano

### Requirement: Persistencia y restauración de la sesión en el navegador

El sistema SHALL conservar la sesión en el navegador tras iniciar sesión o registrarse, de modo que sobreviva a recargar la página o cerrar y reabrir la pestaña, y SHALL validar la sesión guardada contra la API al arrancar. Mientras se valida, el sistema SHALL mostrar un indicador de carga a pantalla completa ("Cargando…" para lectores de pantalla) y MUST NOT redirigir.

#### Scenario: Recarga con sesión válida
- **WHEN** una persona con sesión iniciada recarga la página del perfil
- **THEN** ve brevemente el indicador de carga y después su perfil, sin pasar por el inicio de sesión

#### Scenario: Abrir la aplicación con sesión guardada
- **WHEN** una persona con sesión guardada abre `/login` o `/register`
- **THEN** tras el indicador de carga es llevada a su perfil

#### Scenario: Sin sesión guardada
- **WHEN** una persona sin sesión guardada abre la aplicación
- **THEN** no se realiza validación alguna y se muestra directamente la pantalla que corresponde a su ruta sin sesión

### Requirement: Pérdida de sesión explicada al usuario

El sistema SHALL tratar como sesión perdida la que la API no puede restaurar al arrancar, llevar a la persona al inicio de sesión y explicarle el motivo en un aviso sobre el formulario. Cuando la API rechaza el token, el sistema SHALL eliminar la sesión guardada; cuando la API no responde o falla con un error de servidor, el sistema SHALL conservarla para poder recuperarla al recargar.

#### Scenario: Token caducado o revocado
- **WHEN** la persona abre la aplicación con un token guardado que la API rechaza con 401
- **THEN** es llevada a `/login`, ve el aviso "Tu sesión ha caducado. Vuelve a iniciar sesión." y la sesión guardada se elimina

#### Scenario: API no disponible al arrancar
- **WHEN** la persona abre la aplicación con un token guardado y la API no responde
- **THEN** es llevada a `/login`, ve el aviso "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." y la sesión guardada se conserva

#### Scenario: Recuperación tras el corte
- **WHEN** la API vuelve a estar disponible y la persona recarga la página con la sesión conservada
- **THEN** accede a su perfil sin volver a introducir credenciales

#### Scenario: El aviso desaparece al iniciar sesión
- **WHEN** la persona inicia sesión correctamente tras ver el aviso de sesión perdida
- **THEN** el aviso deja de mostrarse

### Requirement: Pantalla de perfil

El sistema SHALL mostrar en la ruta `/profile`, a quien tiene sesión válida, una tarjeta con sus iniciales en un avatar, su nombre completo (o "Sin nombre" si no tiene), su email, la fecha de alta como "Miembro desde" en formato largo en castellano (por ejemplo, "30 de septiembre de 2026") y un botón "Cerrar sesión".

#### Scenario: Perfil con nombre
- **WHEN** una persona con nombre "Ada Lovelace" y email "ada@example.com" abre su perfil
- **THEN** ve las iniciales "AL", el nombre "Ada Lovelace", el email y su fecha de alta

#### Scenario: Perfil sin nombre
- **WHEN** una persona sin nombre abre su perfil
- **THEN** ve "Sin nombre" como título, su email debajo y las iniciales derivadas del email

### Requirement: Cierre de sesión desde la interfaz

El sistema SHALL cerrar la sesión al pulsar "Cerrar sesión", eliminar la sesión guardada en el navegador, invalidar el token en la API y llevar a la persona a `/login`. El cierre SHALL completarse en el navegador aunque la API falle o ya no reconozca el token.

#### Scenario: Cierre correcto
- **WHEN** la persona pulsa "Cerrar sesión" en su perfil
- **THEN** el botón se deshabilita y muestra "Cerrando sesión…", y acto seguido aparece la pantalla de inicio de sesión sin avisos de error

#### Scenario: La API falla durante el cierre
- **WHEN** la persona pulsa "Cerrar sesión" y la API no responde o devuelve un error
- **THEN** la sesión local se cierra igualmente y la persona llega al inicio de sesión sin ver ningún error

#### Scenario: Volver atrás tras cerrar sesión
- **WHEN** tras cerrar sesión la persona intenta volver a `/profile`
- **THEN** es redirigida de nuevo a `/login`

### Requirement: Protección de las pantallas privadas

El sistema SHALL permitir acceder a `/profile` solo con sesión válida; sin sesión, SHALL redirigir a `/login` sustituyendo la entrada del historial, y MUST NOT mostrar contenido privado antes de redirigir.

#### Scenario: Acceso directo sin sesión
- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Acceso con sesión
- **WHEN** una persona con sesión válida abre `/profile`
- **THEN** ve su perfil

### Requirement: Pantallas públicas solo para quien no tiene sesión

El sistema SHALL mostrar `/login` y `/register` únicamente a quien no tiene sesión; con sesión válida, SHALL redirigir a `/profile`.

#### Scenario: Login con sesión activa
- **WHEN** una persona con sesión válida abre `/login`
- **THEN** es redirigida a `/profile`

#### Scenario: Registro con sesión activa
- **WHEN** una persona con sesión válida abre `/register`
- **THEN** es redirigida a `/profile`

### Requirement: Rutas desconocidas

El sistema SHALL redirigir cualquier ruta de la interfaz que no sea `/login`, `/register` o `/profile` (incluida la raíz `/`) a `/profile`, de modo que quien no tenga sesión termine en `/login`.

#### Scenario: Ruta inexistente con sesión
- **WHEN** una persona con sesión válida abre una ruta desconocida
- **THEN** termina en su perfil

#### Scenario: Raíz sin sesión
- **WHEN** una persona sin sesión abre `/`
- **THEN** termina en la pantalla de inicio de sesión

### Requirement: Errores de conexión y de servidor en las pantallas de acceso

El sistema SHALL mostrar en castellano, en el aviso superior del formulario, un mensaje genérico cuando una operación de acceso falla por causas ajenas a los datos introducidos, sin mostrar detalles técnicos.

#### Scenario: API inalcanzable
- **WHEN** la persona envía el formulario de registro o de inicio de sesión y la API no responde
- **THEN** ve el aviso "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." y permanece en el formulario con el botón de nuevo habilitado

#### Scenario: Error interno de la API
- **WHEN** la API responde con un error de servidor
- **THEN** la persona ve el aviso "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento." y permanece en el formulario con el botón de nuevo habilitado


---

## Tres listas

### Requisitos escritos y comprobados

- Requisitos escritos por el agente: **19**
- Requisitos que comprobé abriendo el código: **3**

### Incoherencias encontradas

- **Nombre opcional frente a responsable visible por nombre:** el sistema actual de cuentas permite usuarios sin `fullName` y el perfil los representa como "Sin nombre", pero E2-3 espera que una tarea nazca con el nombre de su creador como responsable y E3-1 exige mostrar el responsable por nombre, no por email ni identificador. Además, la API acepta `fullName: null`, pero no permite omitir la propiedad (Si marcamos el campo en el validador como `optional()` permite tanto null como undefined); no está claro si esa diferencia forma parte deliberada del contrato o es una consecuencia de la validación actual. Falta decidir qué ocurre con las tareas de una cuenta sin nombre.
- **El frontend habla de sesión "caducada" ante cualquier 401 aunque el backend no configura caducidad de los tokens, por lo que un error 401 se presenta siempre como sesión caducada:** el frontend traduce cualquier 401 a "Tu sesión ha caducado", mientras que el backend también usa 401 para tokens inválidos o revocados. Aunque el modelo de tokens dispone de `expiresAt`, no se ha confirmado que exista una política de expiración configurada ni que todos los 401 correspondan a una expiración. El mensaje visible atribuye una causa más concreta de la que el sistema puede asegurar.

### No supe decidir si era un bug o el contrato

- **Sesiones simultáneas:** el código permite iniciar sesión varias veces, conservar todos los tokens y cerrar únicamente la sesión asociada al token presentado. No pude decidir si FlowSync quiere soportar de forma deliberada varias sesiones simultáneas o si es simplemente el comportamiento por defecto del mecanismo de tokens.
- **Forma de la respuesta de logout:** registro, login y perfil usan respuestas envueltas en `data`, pero logout devuelve directamente un `message`. No pude decidir si esa excepción forma parte del contrato de la API o si es una inconsistencia accidental del controlador.
- **Nombre ausente en la API:** desde producto el nombre es opcional, pero la API distingue entre enviar `fullName: null` y no enviar la clave. No pude decidir si esa distinción debe formar parte del contrato o es una consecuencia accidental de la validación actual.