import {
  addTodo,
  removeTodo,
  selectTodoList,
  selectTodoIDList,
  todoStore,
  updateTodo,
} from './main.js'

export const testTodoStore = ({ assert }) =>
  new Promise((resolve, reject) => {
    // this test actually runs synchronously (verifiable in the middleware),
    // so any timeout value is sufficient
    const timeout = setTimeout(() => {
      cancelListener()
      reject(new Error('Expected different final state'))
    }, 100)
    const cancelListener = todoStore.listen((state, prevState) => {
      const todoList = Object.values(selectTodoList(state))
      // expected end state after all actions have been consumed
      if (
        todoList.length === 1 &&
        todoList[0].message === 'Get groceries' &&
        todoList[0].completed === false
      ) {
        clearTimeout(timeout)
        cancelListener()
        resolve()
      }
    })

    todoStore.dispatch(
      addTodo('clown portrait'),
      addTodo('banana cream pie', true),
    )
    const ids = selectTodoIDList(todoStore.getState())
    todoStore.dispatch(
      updateTodo(ids[0], { message: 'Get groceries' }),
      updateTodo(ids[1], { completed: true }),
    )
    todoStore.dispatch(removeTodo(ids[1]))
  })
