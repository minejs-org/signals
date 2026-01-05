// src/types.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    /**
     * Represents a reactive signal that holds a value and notifies dependents when changed.
     * @template T - The type of value stored in the signal
     */
    export interface Signal<T> {
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
    export interface Computed<T> extends Signal<T> {
        /** Marks this signal as computed for type checking purposes */
        readonly isComputed: true;
    }

    /**
     * The return type of an effect function.
     * Can be void or a cleanup function that runs when the effect is disposed.
     */
    export type EffectCleanup = void | (() => void);

// ╚══════════════════════════════════════════════════════════════════════════════════════╝