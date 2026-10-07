import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: responsable identificable, la tarea que no
 * filtra datos de cuenta y el responsable sin nombre.
 *
 * Cada scenario se comprueba en las dos lecturas que devuelven un `assignee`:
 * la tarea suelta (`GET /tasks/:id`) y la lista (`GET /tasks`).
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * El día de referencia es obligatorio en la tarea suelta, pero ningún
   * scenario depende de él: cualquier día válido sirve.
   */
  const HOY = '2026-01-01'

  /**
   * Una tarea a nombre de `fullName`, vista por otra cuenta distinta, para que
   * el responsable no sea quien mira. Devuelve las dos lecturas de esa tarea.
   */
  async function leer(client: any, fullName: string | null, email = 'ada@example.com') {
    const responsable = await User.create({ fullName, email, password: 'secreto123' })
    await User.create({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'secreto123',
    })
    const task = await Task.create({ title: 'Revisar el informe', assigneeId: responsable.id })

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'grace@example.com', password: 'secreto123' })
    const token = login.body().data.token as string

    const suelta = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    const enLista = lista.body().data.find((fila: any) => fila.id === task.id)

    return { email, assignees: { suelta: suelta.body().data.assignee, lista: enLista.assignee } }
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const { assignees } = await leer(client, 'Ada Lovelace')

    for (const assignee of Object.values<any>(assignees)) {
      assert.equal(assignee.fullName, 'Ada Lovelace')
      assert.equal(assignee.initials, 'AL')
    }
  })

  test('el responsable no trae el email ni otros datos de acceso', async ({ client, assert }) => {
    const { email, assignees } = await leer(client, 'Ada Lovelace')

    for (const assignee of Object.values<any>(assignees)) {
      assert.notProperty(assignee, 'email')
      assert.notProperty(assignee, 'password')
      assert.notInclude(JSON.stringify(assignee), email)
    }
  })

  test('un responsable sin nombre llega con nombre nulo e iniciales', async ({
    client,
    assert,
  }) => {
    const { assignees } = await leer(client, null)

    for (const assignee of Object.values<any>(assignees)) {
      assert.isNull(assignee.fullName)
      assert.isString(assignee.initials)
      assert.isNotEmpty(assignee.initials)
    }
  })
})
