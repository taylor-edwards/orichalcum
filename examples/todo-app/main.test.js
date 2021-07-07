import {
  addTodo,
  removeTodo,
  selectTodoList,
  selectTodoIDList,
  todoStore,
  updateTodo,
} from './main.js'
import { once } from '../../src/store.js'

export const testTodoStore = ({ assert }) =>
  new Promise((resolve, reject) => {
    // wait for expected end state after all actions have been consumed
    const [promise] = once(state => {
      const todoList = Object.values(selectTodoList(state))
      return (
        todoList.length === 1 &&
        todoList[0].message === 'Get groceries' &&
        todoList[0].completed === false
      )
    }, todoStore)
    promise.then(() => resolve(), err => reject(err))

    // dispatch some actions, make sure to set it to the above state
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
