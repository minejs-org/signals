/* eslint-disable @typescript-eslint/no-explicit-any */
// src/index.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Signal, EffectCleanup, Computed } from './types';
    export type * from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    let currentEffect       : (() => void)   | null = null;
    let currentRoot         : (() => void)[] | null = null;
    let batchDepth          : number                = 0;
    const batchedEffects    : Set<() => void>       = new Set<() => void>();
    const flushedEffects    : Set<() => void>       = new Set<() => void>();

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

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
    export function signal<T>(initialValue: T): Signal<T> {
        let value           = initialValue;
        const subscribers   = new Set<() => void>();

        function read(): T {
            // Track dependency if inside effect
            if (currentEffect) {
                subscribers.add(currentEffect);
            }
            return value;
        }

        function write(newValue: T): void {
            // Only update if value actually changed
            if (Object.is(value, newValue)) return;

            value = newValue;

            // Notify all subscribers
            if (batchDepth > 0) {
                // Batch mode: collect effects
                subscribers.forEach(fn => batchedEffects.add(fn));
            } else {
                // Immediate mode: run effects now
                subscribers.forEach(fn => fn());
            }
        }

        function update(fn: (prev: T) => T): void {
            write(fn(value));
        }

        function peek(): T {
            // Read without tracking
            return value;
        }

        function subscribe(fn: () => void): () => void {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        }

        // Create signal function with methods
        const sig = read as Signal<T>;
        sig.set = write;
        sig.update = update;
        sig.peek = peek;
        sig.subscribe = subscribe;

        return sig;
    }

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
    export function effect(fn: () => EffectCleanup): () => void {
        let cleanup: (() => void) | undefined;
        let isDisposed = false;

        const execute = () => {
            if (isDisposed) return;

            // Run cleanup from previous execution
            if (cleanup) {
                cleanup();
                cleanup = undefined;
            }

            // Set as current effect for dependency tracking
            const prevEffect = currentEffect;
            currentEffect = execute;

            try {
                // Run the effect function
                const result = fn();

                // Store cleanup if returned
                if (typeof result === 'function') {
                    cleanup = result;
                }
            } finally {
                // Restore previous effect
                currentEffect = prevEffect;
            }
        };

        // Run immediately
        execute();

        // Create dispose function
        const disposer = () => {
            if (isDisposed) return;
            isDisposed = true;
            if (cleanup) cleanup();
        };

        // Register with current root if one exists
        if (currentRoot) {
            currentRoot.push(disposer);
        }

        // Return dispose function
        return disposer;
    }

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
    export function computed<T>(fn: () => T): Computed<T> {
        const sig = signal<T>(undefined as T);

        // Create effect that updates the signal
        effect(() => {
            sig.set(fn());
        });

        // Mark as computed
        const computed = sig as Computed<T>;
        Object.defineProperty(computed, 'isComputed', {
            value: true,
            writable: false
        });

        return computed;
    }

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
    export function batch<T>(fn: () => T): T {
        batchDepth++;

        try {
            return fn();
        } finally {
            batchDepth--;

            // If we're back at depth 0, flush batched effects
            if (batchDepth === 0) {
                // Keep batch mode active while flushing to prevent cascading effects
                batchDepth++;
                flushedEffects.clear();
                try {
                    // Keep running effects until no more are queued
                    while (batchedEffects.size > 0) {
                        const effects = Array.from(batchedEffects);
                        batchedEffects.clear();
                        effects.forEach(fn => {
                            // Only run if we haven't run it in this batch
                            if (!flushedEffects.has(fn)) {
                                flushedEffects.add(fn);
                                fn();
                            }
                        });
                    }
                } finally {
                    batchDepth--;
                    flushedEffects.clear();
                }
            }
        }
    }

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
    export function untrack<T>(fn: () => T): T {
        const prevEffect = currentEffect;
        currentEffect = null;

        try {
            return fn();
        } finally {
            currentEffect = prevEffect;
        }
    }

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
    export function on<T>(
        sig: Signal<T>,
        fn: (value: T, prevValue: T) => EffectCleanup
    ): () => void {
        let prevValue = sig.peek();

        return effect(() => {
            // Read the signal to create dependency
            const value = sig();

            // Run callback without tracking new dependencies
            const cleanup = untrack(() => fn(value, prevValue));
            prevValue = value;
            return cleanup;
        });
    }

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
    export function store<T extends Record<string, any>>(
        initialState: T
    ): { [K in keyof T]: Signal<T[K]> } {
        const store = {} as any;

        for (const key in initialState) {
            store[key] = signal(initialState[key]);
        }

        return store;
    }

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
    export function memo<T>(fn: () => T): () => T {
        let cachedValue: T | undefined;
        let hasCachedValue = false;

        return () => {
            if (hasCachedValue) {
                return cachedValue as T;
            }

            // Compute the value
            const value = fn();

            // Cache it
            cachedValue = value;
            hasCachedValue = true;

            return value;
        };
    }

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
    export function root<T>(fn: (dispose: () => void) => T): T {
        const disposers: (() => void)[] = [];
        const prevRoot = currentRoot;
        currentRoot = disposers;

        try {
            const dispose = () => {
                disposers.forEach(d => d());
                disposers.length = 0;
                currentRoot = prevRoot;
            };

            return fn(dispose);
        } finally {
            currentRoot = prevRoot;
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    /**
     * Development utilities for debugging signal reactivity
     */
    export const dev = {
        /**
         * Returns the currently executing effect, or null if no effect is running
         * @returns {(() => void) | null} The current effect function or null
         */
        getCurrentEffect(): (() => void) | null {
            return currentEffect;
        },

        /**
         * Returns the current batch depth (for debugging nested batch calls)
         * @returns {number} The current batch nesting level
         */
        getBatchDepth(): number {
            return batchDepth;
        },

        /**
         * Returns the count of effects currently pending in the batch queue
         * @returns {number} The number of batched effects waiting to run
         */
        getBatchedEffectsCount(): number {
            return batchedEffects.size;
        }
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
    export function isSignal<T>(value: any): value is Signal<T> {
        return (
            typeof value === 'function' &&
            'set' in value &&
            'update' in value &&
            'peek' in value
        );
    }

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
    export function isComputed<T>(value: any): value is Computed<T> {
        return isSignal(value) && 'isComputed' in value;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    export default {
        signal,
        effect,
        computed,
        batch,
        untrack,
        on,
        store,
        memo,
        root,
        isSignal,
        isComputed,
        dev
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
