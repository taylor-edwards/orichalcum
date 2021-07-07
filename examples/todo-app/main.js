import {
  combineMiddleware,
  combineReducers,
  createStore,
  genID,
} from '../../src/store.js'
import {
  assoc,
  compose,
  curry,
  filter,
  keys,
  lensPath,
  lensProp,
  mergeDeepLeft,
  omit,
  over,
  pick,
  view,
} from 'ramda'

const appInitialState = {
  todoList: {},
}

const todoInitialState = {
  id: undefined,
  message: '',
  completed: false,
}

const todoListLens = lensProp('todoList')

const todoLens = id => lensPath(['todoList', id])

const setTodo = curry((id, todo, state) =>
  over(
    todoLens(id),
    (prevTodo = todoInitialState) =>
      mergeDeepLeft(
        compose(
          assoc('id', id),
          filter(propValue => typeof propValue !== 'undefined'),
          pick(keys(todoInitialState)),
        )(todo),
        prevTodo,
      ),
    state,
  ),
)

const deleteTodo = curry((id, state) => over(todoListLens, omit([id]), state))

const actions = {
  ADD_TODO: 'ADD_TODO',
  REMOVE_TODO: 'REMOVE_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
}

const appReducer = (action, state = appInitialState) => {
  switch (action.type) {
    case actions.ADD_TODO:
    case actions.UPDATE_TODO:
      return setTodo(action.id, action.todo, state)

    case actions.REMOVE_TODO:
      return deleteTodo(action.id, state)

    default:
      return state
  }
}

const idMiddleware = (action, state, dispatch) => {
  switch (action.type) {
    case actions.ADD_TODO:
      action.id = genID()
      break
  }
  return action
}

const loggerMiddleware = (action, state, dispatch) => {
  // console.log('consuming action:', action)
  return action
}

export const todoStore = createStore(
  appReducer,
  combineMiddleware(idMiddleware, loggerMiddleware),
  appInitialState,
)

export const selectTodoList = view(todoListLens)

export const selectTodoIDList = compose(keys, selectTodoList)

export const selectTodo = curry((id, state) => view(todoLens(id), state))

export const addTodo = (message, completed = false) => ({
  todo: {
    message,
    completed,
  },
  type: actions.ADD_TODO,
})

export const updateTodo = (id, todo) => ({
  id,
  todo,
  type: actions.UPDATE_TODO,
})

export const removeTodo = id => ({
  id,
  type: actions.REMOVE_TODO,
})

