# Orichalcum

Orichalcum provides a Redux-inspired store designed around discrete state
transitions initiated with message passing.

## Usage

Install Orichalcum in any [Node](https://nodejs.org/en/) project with NPM:

```sh
npm install -S orichalcum
```

The main function exported from Orichalcum is called `createStore`. If you've
used Redux before, this might look familiar to you:

```javascript
import { createStore } from 'orichalcum'

const store = createStore(rootReducer, combinedMiddleware, initialState)
```

The signature for `createStore`, for our understanding, looks like this:

```javascript
createStore = (
  reducer,     // combineReducers(...reducers)
  middleware,  // combineMiddleware(...middlewares)
  initialState,
) => ({
  dispatch: fn action => {},
  getState: () => state,
  listen: (fn listener) => fn removeListener,
})
```

The first argument, `reducer`, is a function that takes an `action` and the
current app `state`, then returns that state or modified copy. Multiple
reducers can be joined by using `combineReducers` for top level reducers or
by calling one reducer from the other for some nested data structures.

This is a reducer that doesn't do anything, so it just returns the original
state input:

```javascript
const identityReducer = (action, state) => state
```

The second argument, `middleware`, is a function that can intercept and
modify actions. Middleware is also exposed to the store's dispatch function
which is handy for spawning subsequent actions and handling delays.

Here's a middleware function that doesn't do anything, but shows all inputs
and returns the action unmodified. The `dispatch()` function here is the same
as the externally-facing `store.dispatch()` method.

```javascript
const identityMiddleware = (action, state, dispatch) => action
```

The last argument, `initialState`, is usually an object but can be anything.
Here's what a simple example looks like that we'll start expanding on below:

```javascript
const initialState = {
  x: 1,
  loading: false,
  lastRequestURL: null,
  requestData: null,
  requestError: null,
}
```

In this case `initialState` is an object with one property named `x` and a
bunch more related to some HTTP fetching we'll implement for fun later.
However, your application's internal state can be represented by any variable
you can pass to it. For extensibility purposes, it's recommended to use
serializable data types for state and actions as much as possible.

So how do we enact these "actions" in our reducer? First we'll look at how
`dispatch()` works then come back to writing an example.

```javascript
store.dispatch({
  type: 'MULTIPLY',
  x: 2,
})
```

When we call `dispatch()` we pass it an "action," which is any object with
a `type: String` property. This example wrote an object literal but its common
practice to use a function as an "action creator," which could look something
like this:

```javascript
const createMultiply = x => ({
  x,
  type: 'MULTIPLY',
})
store.dispatch(createMultiply(2))
```

When the store recieves this action object, it first passes it through the
middleware function we passed when calling `createStore()`. The middleware can
make changes to the action and make asynchronous calls to `dispatch()`, but
can't update state. Then the store passes the potentially modified action to
our root reducer which computes the next state.

Now let's take a look at implementing the reducers that codify our app's state
transitions:

```javascript
import { combineReducers } from 'orichalcum'

const multiplyReducer = (action, state) => {
  if (action.type === 'MULTIPLY') {
    return {
      ...state,
      x: state.x * action.x,
    }
  }
  return state
}

const loaderReducer = (action, state) => {
  switch(action.type) {
    case 'LOAD':
      // Middleware can set this property which indicates if the
      // fetch request was started or ignored due to a pending request
      if (action.didStart) {
        return {
          ...state,
          loading: true,
          lastRequestURL: action.url,
        }
      }
      // We could use this return to store unstarted URLs in a queue,
      // but for this example we'll just drop it because we're only
      // interested in loading one thing at a time.
      return state

    case 'LOADED':
      return {
        ...state,
       loading: false,
       requestData: action.data,
      }

    case 'ERROR_LOADING':
      return {
        ...state,
        loading: false,
        requestError: action.message,
      }

    default:
      return state
  }
}

const rootReducer = combineReducers(multiplyReducer, loaderReducer)
```

Above we created two reducers, but we could have consolidated them into one by
extending the `switch` statement. Combining and nesting reducers can improve
code re-usability and remove a lot of repetitive coding when making larger
state machines, so plan your state tree according to your project's needs.

Finally, a more practical look at middleware includes this logger and basic
HTTP fetch request handler:

```javascript
import { combineMiddleware } from 'orichalcum'

const loggerMiddleware = (action, state, dispatch) => {
  console.log({ action, state })
  return action
}

const httpFetchMiddleware = (action, state, dispatch) => {
  if (action.type === 'LOAD' && !state.loading) {
    // modify our action to pass this information to our reducer,
    // will decide what to do partly based on this
    action.didStart = true

    // fetch JSON and await the result, then dispatch a loaded or error action
    fetch(action.url)
      .then(res => res.json())
      .then(data => dispatch({ type: 'LOADED', data }))
      .catch(err => dispatch({ type: 'ERROR_LOADING', message: err.message }))
  }
  return action
}

const combinedMiddleware = combineMiddleware(loggerMiddleware, httpFetchMiddleware)
```

For each action that is dispatched to the store, all attached listeners will
be alerted regardless of whether there was a change. The return value for
calling `listen` is a canceler function that will detach that listener from
the store when called.

```javascript
// attach our listener and store its canceler function:
const removeLogger = store.listen(
  (state, prevState, action) => console.log('Received event!', { action }),
)

// the logger will run once for each action we pass to dispatch:
store.dispatch(
  { type: 'MULTIPLY', x: 3 },
  { type: 'MULTIPLY', x: 4 },
)
store.dispatch({ type: 'MULTIPLY', x: 5 })
// logs three lines:
//     Received event! { action: { type: 'MULTIPLY', x: 3 } }
//     Received event! { action: { type: 'MULTIPLY', x: 4 } }
//     Received event! { action: { type: 'MULTIPLY', x: 5 } }

// call the canceler function when we want to stop logging events:
removeLogger()

store.dispatch({ type: 'MULTIPLY', x: 6 })
// no longer logs anything
```

---

## Example: Todo List

Below is a basic example of creating a "todo" app using Orichalcum. You can
check the [examples/todo-app directory](./examples/todo-app) for an extended
version of this example. We'll go over creating the app while keeping the
focus on how to use Orichalcum effectively.

### Todo List: Initial state

The initial state should be a minimal representation of your app as it needs
to be set at startup time. This could be anything from a JSON object to a
Boolean or any supplied variable.

A common usage is to provide a serializable object (you can test for this with
`JSON.stringify`). Our state for now just needs to have a list for us to store
"todos" in, so this should work and allows us to add more properties later:

```javascript
const initialState = {
  todoList: [],
}
```

### Todo List: Reducers

Reducers are used to make structured updates to your app's state. They take
the current application state and return a copy of it with any changes applied.
This example reducer uses [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to include any other properties of state,
then overrides the copied object's `todoList` property with an updated value:

```javascript
const reducer = (_, state) => {
  // the first time this runs, `state` is the same as `initialState`
  // state === { todoList: [] }

  const myTodo = {
    name: 'Buy milk',
    completed: false,
  }

  // return updated state
  return {
    ...state,
    todoList: state.todoList.concat([myTodo]),
  }
}
```

The problem with the above example (or maybe you already noticed!) is that
everytime this reducer is run, it'll add another todo. We should use actions
to add that functionality.

**Side note**: In addition to making testing easier, it's generally recommended
to avoid using non-deterministic functions like `Math.random` or to read from
external sources in reducers. This includes calls to `new Date()` and
`Date.now()`, too. Instead, we can pass data like this or anything else to our
reducers by passing them as properties of actions.

### Todo List: Actions

The above example works, but it relies on hardcoded variables. In order to pass
data to the reducers, we'll use an `action`. Any object with a `type: String`
property can be considered an action, so here we'll rewrite the above example
but we'll pass the newly created "todo" as a variable instead of hardcoding it:

```javascript
const action = {
  type: 'CREATE_TODO',
  todo: {
    name: 'Buy milk',
    completed: false,
  },
}

const reducer = (action, state) => {
  if (action.type === 'CREATE_TODO') {
    return {
      ...state,
      todoList: state.todoList.concat([action.todo]),
    }
  }
}
```

Great, that's one way to separate our state transitions from our inputs, but
where does `state` come from when a reducer gets called? Let's look at how we
can pass actions to our store using the `dispatch` method.

### Todo List: Dispatch

In order to initiate a state transition, we'll dispatch an action to our store.
Using the `reducer` and `initialState` examples just above, we can write:

```javascript
// We're passing `undefined` because our store doesn't have middleware yet
const store = createStore(reducer, undefined, initialState)

store.dispatch({
  type: 'CREATE_TODO',
  todo: {
    name: 'Buy milk',
    completed: false,
  },
})

// check that our new "todo" was added to the list:
store.getState(state => {
  // state = {
  //   todoList: [
  //     { name: 'Buy milk', completed: false },
  //   ],
  // }
  console.assert(state.todoList[0].name === 'Buy milk') // true
})
```

So what happened? When we called `store.dispatch(action)` Orichalcum first
passed our `action` object through our middleware (if any) and then forwarded
it to our application's "root" reducer, which returned the updated todo list.
We used `store.getState()` to fetch our updated state, which worked here
because Orichalcum guarantees synchronous action dispatching.
Asynchronous functions -- like network fetch requests or anything that returns
a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
-- can be integrated with the help of middleware.

### Todo List: Middleware

We can integrate external APIs consistently through the use of "middleware."
This can help us manage asynchronous function calls like making a network
request and updating a value when it resolves, or modifying `action` objects
before they are passed to reducers.

Co-locating all of your third-party integration into middleware also means
components that call `store.dispatch()` don't have to know which (if any) APIs
are involved in a given feature and can restrict their concerns to only passing
the correct data to the store (structured as an action!)

In this example, we'll make a variant on the "todo" store from above and
pretend we have to sync our list with a server. We can extend this with
the reducers from above to enable adding, editing and removing todos, but
we would need to make sure to add the corresponding API calls to the
middleware layer as well.

It's generally helpful to use two or more actions when working with
asynchronous functions. In this example, we'll create three actions: one for
whether a request is already in progress, another for the actual result that
eventually loads, and a third action to track errors. Doing this makes it
easier to display loading states and keep track of what's in-flight at any
given moment.

```javascript
const initialState = {
  todoList: [],
  loading: false,
  lastLoadedTimestamp: null,
  err: null,
}

const reducer = (action, state) => {
  switch (action.type) {
    case 'FETCH_TODOS':
      return {
        ...state,
        loading: true,
        err: null,
      }

    case 'SET_TODOS':
      return {
        ...state,
        loading: false,
        todoList: action.todoList,
        lastLoadedTimestamp: action.timestamp,
      }

    case 'TODOS_ERROR':
      return {
        ...state,
        loading: false,
        err: action.err,
      }

    default:
      return state
  }
}

const middleware = (action, state, dispatch) => {
  if (action.type === 'FETCH_TODOS' && !state.loading) {
    // some HTTP request that returns a JSON list of "todos"
    fetchTodos()
      .then(todoList => dispatch({
        todoList,
        timestamp: Date.now(),
        type: 'SET_TODOS',
      })
      .catch(err => dispatch({
        err: err.message,
        type: 'TODOS_ERROR',
      }))
  }
  return action
}

const asyncTodoStore = createStore(reducer, middleware, initialState)
asyncTodoStore.dispatch({ type: 'FETCH_TODOS' })
// synchronously updates state to set `loading: true` while kicking off a
// network request in the middleware that will eventually set the todo list
// value or set an error message
```

## Additional recommendations

Here are some great companion libraries to day-to-day users:

* [Immutable](https://immutable-js.com/) for defining `initialState` and
    creating reducers
* [Immer](https://immerjs.github.io/immer/) for creating reducers
* [Reselect](https://github.com/reduxjs/reselect) for querying state with selectors
* [Ramda](https://ramdajs.com/) and specifically its [lens related](https://ramdajs.com/docs/#lens)
    functions for creating reducers and selectors
