package orichalcum

interface Action { val type: String }

typealias Reducer <A, S> = (A, S) -> S

typealias Middleware <A, S> = (A, S, Dispatch<A>) -> A

typealias Dispatch <A> = (A) -> Unit

typealias Listener <A, S> = (S, S, A) -> Unit

class Store <A, S> (
    val reducer: Reducer<A, S> = { _, s -> s },
    val middleware: Middleware<A, S> = { a, _, _ -> a },
    val initialState: S,
) {
    private val queue: MutableList<A> = mutableListOf()
    private val listeners: MutableMap<Int, Listener<A, S>> = mutableMapOf()
    private var listenersCreated = 0
    private var dispatchInProgress = false
    private var currentState: S = initialState

    private fun dispatchFromQueue() {
        if (!dispatchInProgress) {
            dispatchInProgress = true
            while (queue.size > 0) {
                val action = queue.removeAt(0)
                val nextAction = middleware(
                    action,
                    currentState,
                    ::dispatch,
                ) ?: action
                val prevState = currentState
                currentState = reducer(nextAction, currentState)
                listeners.values.forEach {
                    it(currentState, prevState, action)
                }
            }
            dispatchInProgress = false
        }
    }

    fun dispatch(action: A) {
        queue.add(action)
        dispatchFromQueue()
    }

    fun getState(): S = currentState

    fun listen(listener: Listener<A ,S>): () -> Unit {
        listenersCreated += 1
        val id = listenersCreated
        listeners.put(id, listener)
        return { listeners.remove(id, listener) }
    }
}
