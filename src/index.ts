import produce from "immer"

interface Parent {
    getter: any
    root: any
}

interface Root {
    rootState: any
    callbacks?: []
}

class RabbitStore<S, T> {
    callbacks = []
    rootState: T
    getter:(s: S) => T
    root: Root
    parent: Parent
    constructor(parent: Parent, getter: (s: S) => T, rootState?: T) {
        this.parent = parent
        this.root = (parent && parent.root) || this
        !parent ? this.rootState = rootState : null
        this.getter = (s: S) => getter(parent ? parent.getter(s) : s)
    }

    private getState = () => this.getter(this.root.rootState)
    get state() {
        return this.getState()
    }
    update = (updater: ((e: T) => void) | Partial<T>) => {
        const updaterFn = (updater instanceof Function) ? updater : e => Object.assign(e, updater)
        const oldState = this.root.rootState
        this.root.rootState = produce(this.root.rootState, s => updaterFn(this.getter(s)))
        if(this.root.rootState !== oldState) {
            this.root.callbacks.forEach((callback: any) => callback())
        }
    }
    storeFor = <X>(getter: (s: T) => X) => new RabbitStore(this, getter)
    updaterFor = <X>(getter: (s: T) => X) => this.storeFor(getter).update
    subscribe = (callback: never) => {
        this.root.callbacks.push(callback)
        return () => this.root.callbacks.splice(this.root.callbacks.indexOf(callback), 1)
    }
}

export default <S>(state: S) => (new RabbitStore(null, (s: S) => s, state))