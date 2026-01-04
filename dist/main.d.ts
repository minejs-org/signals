// src/types.d.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    /**
     * Represents a reactive signal that holds a value and notifies dependents when changed.
     * @template T - The type of value stored in the signal
     */
    interface Signal<T> {
        /**
         * Reads the current signal value and establishes a dependency if inside an effect.
         * @returns {T} The current value
         */
        (): T;

        /**
         * Sets the signal to a new value and notifies all subscribers.
         * @param {T} value - The new value to set
         */

        set(value: T): void;
        /**
         * Updates the signal by applying a function to its current value.
         * @param {(prev: T) => T} fn - Function that receives current value and returns new value
         */

        update(fn: (prev: T) => T): void;
        /**
         * Reads the signal value without creating a dependency relationship.
         * @returns {T} The current value
         */

        peek(): T;
        /**
         * Subscribes to signal changes.
         * @param {() => void} fn - Callback function to execute when signal changes
         * @returns {() => void} Unsubscribe function
         */
        subscribe(fn: () => void): () => void;
    }

    /**
     * Represents a computed (memoized) signal derived from other signals.
     * Automatically updates when dependencies change and is read-only.
     * @template T - The type of value computed
     */
    interface Computed<T> extends Signal<T> {
        /** Marks this signal as computed for type checking purposes */
        readonly isComputed: true;
    }

    /**
     * The return type of an effect function.
     * Can be void or a cleanup function that runs when the effect is disposed.
     */
    type EffectCleanup = void | (() => void);

/**
 * Creates a reactive signal that can be read, written, and subscribed to.
 * @template T - The type of value stored in the signal
 * @param {T} initialValue - The initial value of the signal
 * @returns {Signal<T>} A signal object with read, set, update, peek, and subscribe methods
 * @example
 * const count = signal(0);
 * console.log(count()); // 0
 * count.set(5); // Update value
 */
declare function signal<T>(initialValue: T): Signal<T>;
/**
 * Automatically runs a function when its signal dependencies change.
 * @param {() => EffectCleanup} fn - The effect function to run. Can optionally return a cleanup function.
 * @returns {() => void} A dispose function to stop the effect and clean up
 * @example
 * const count = signal(0);
 * effect(() => {
 *   console.log('Count:', count());
 *   return () => console.log('Cleaning up');
 * });
 */
declare function effect(fn: () => EffectCleanup): () => void;
/**
 * Creates a computed signal that automatically updates when its dependencies change.
 * The computation result is cached and only recomputed when dependencies change.
 * @template T - The type of value computed
 * @param {() => T} fn - The computation function
 * @returns {Computed<T>} A read-only computed signal
 * @example
 * const count = signal(5);
 * const doubled = computed(() => count() * 2);
 * console.log(doubled()); // 10
 */
declare function computed<T>(fn: () => T): Computed<T>;
/**
 * Groups multiple signal updates together, deferring effect execution until all updates complete.
 * This improves performance by preventing cascading effect runs.
 * @template T - The return type of the function
 * @param {() => T} fn - A function that performs multiple signal updates
 * @returns {T} The return value of the function
 * @example
 * const a = signal(1);
 * const b = signal(2);
 * batch(() => {
 *   a.set(10);
 *   b.set(20);
 * }); // Effects only run once
 */
declare function batch<T>(fn: () => T): T;
/**
 * Reads signals without creating dependencies on them.
 * Useful for accessing signal values without triggering effect re-runs.
 * @template T - The return type of the function
 * @param {() => T} fn - A function that accesses signals
 * @returns {T} The return value of the function
 * @example
 * const count = signal(0);
 * effect(() => {
 *   const value = untrack(() => count()); // Won't trigger re-run
 *   console.log(value);
 * });
 */
declare function untrack<T>(fn: () => T): T;
/**
 * Runs an effect only when a specific signal changes, providing both new and previous values.
 * @template T - The type of the signal
 * @param {Signal<T>} sig - The signal to watch
 * @param {(value: T, prevValue: T) => EffectCleanup} fn - Effect function called with new and previous values
 * @returns {() => void} A dispose function to stop watching
 * @example
 * const count = signal(0);
 * on(count, (newVal, oldVal) => {
 *   console.log(`Changed from ${oldVal} to ${newVal}`);
 * });
 */
declare function on<T>(sig: Signal<T>, fn: (value: T, prevValue: T) => EffectCleanup): () => void;
/**
 * Creates a store object where each property is a signal.
 * Provides a convenient way to manage multiple related reactive values.
 * @template T - The type of the initial state object
 * @param {T} initialState - An object with initial values
 * @returns {{ [K in keyof T]: Signal<T[K]> }} An object with signals for each property
 * @example
 * const state = store({ count: 0, name: 'John' });
 * console.log(state.count()); // 0
 * state.name.set('Jane');
 */
declare function store<T extends Record<string, any>>(initialState: T): {
    [K in keyof T]: Signal<T[K]>;
};
/**
 * Memoizes the result of an expensive computation, caching it indefinitely.
 * Unlike computed, this doesn't depend on reactive signals.
 * @template T - The type of the memoized value
 * @param {() => T} fn - A function that performs the computation
 * @returns {() => T} A function that returns the cached result
 * @example
 * const expensiveCalc = memo(() => {
 *   return Array.from({ length: 1000 }).map(expensiveOp);
 * });
 * const result = expensiveCalc(); // Computed only once
 */
declare function memo<T>(fn: () => T): () => T;
/**
 * Creates a root scope for managing effect and computed signal lifecycles.
 * All effects and disposers created within the function are collected and can be cleaned up together.
 * @template T - The return type of the function
 * @param {(dispose: () => void) => T} fn - A function that receives a dispose function
 * @returns {T} The return value of the function
 * @example
 * const dispose = root((dispose) => {
 *   effect(() => console.log('Running'));
 *   return 42;
 * });
 * dispose(); // Cleans up all effects created in the root
 */
declare function root<T>(fn: (dispose: () => void) => T): T;
/**
 * Development utilities for debugging signal reactivity
 */
declare const dev: {
    /**
     * Returns the currently executing effect, or null if no effect is running
     * @returns {(() => void) | null} The current effect function or null
     */
    getCurrentEffect(): (() => void) | null;
    /**
     * Returns the current batch depth (for debugging nested batch calls)
     * @returns {number} The current batch nesting level
     */
    getBatchDepth(): number;
    /**
     * Returns the count of effects currently pending in the batch queue
     * @returns {number} The number of batched effects waiting to run
     */
    getBatchedEffectsCount(): number;
};
/**
 * Type guard to check if a value is a signal
 * @template T - The type of value the signal contains
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a signal
 * @example
 * if (isSignal(myValue)) {
 *   console.log(myValue());
 * }
 */
declare function isSignal<T>(value: any): value is Signal<T>;
/**
 * Type guard to check if a value is a computed signal
 * @template T - The type of value the computed signal contains
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a computed signal
 * @example
 * if (isComputed(myValue)) {
 *   console.log('This is a computed signal');
 * }
 */
declare function isComputed<T>(value: any): value is Computed<T>;
declare const _default: {
    signal: typeof signal;
    effect: typeof effect;
    computed: typeof computed;
    batch: typeof batch;
    untrack: typeof untrack;
    on: typeof on;
    store: typeof store;
    memo: typeof memo;
    root: typeof root;
    isSignal: typeof isSignal;
    isComputed: typeof isComputed;
    dev: {
        /**
         * Returns the currently executing effect, or null if no effect is running
         * @returns {(() => void) | null} The current effect function or null
         */
        getCurrentEffect(): (() => void) | null;
        /**
         * Returns the current batch depth (for debugging nested batch calls)
         * @returns {number} The current batch nesting level
         */
        getBatchDepth(): number;
        /**
         * Returns the count of effects currently pending in the batch queue
         * @returns {number} The number of batched effects waiting to run
         */
        getBatchedEffectsCount(): number;
    };
};

export { type Computed, type EffectCleanup, type Signal, batch, computed, _default as default, dev, effect, isComputed, isSignal, memo, on, root, signal, store, untrack };
