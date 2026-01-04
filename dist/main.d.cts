// src/types.d.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    interface Signal<T> {
                    ()                      : T                 // Read value
        set         (value: T)              : void              // Set value
        update      (fn: (prev: T) => T)    : void              // Update with function
        peek        ()                      : T                 // Read without tracking
        subscribe   (fn: () => void)        : () => void        // Subscribe to changes
    }

    interface Computed<T> extends Signal<T> {
        readonly isComputed: true
    }

    type EffectCleanup = void | (() => void);

declare function signal<T>(initialValue: T): Signal<T>;
declare function effect(fn: () => EffectCleanup): () => void;
declare function computed<T>(fn: () => T): Computed<T>;
declare function batch<T>(fn: () => T): T;
declare function untrack<T>(fn: () => T): T;
declare function on<T>(sig: Signal<T>, fn: (value: T, prevValue: T) => EffectCleanup): () => void;
declare function store<T extends Record<string, any>>(initialState: T): {
    [K in keyof T]: Signal<T[K]>;
};
declare function memo<T>(fn: () => T): () => T;
declare function root<T>(fn: (dispose: () => void) => T): T;
declare const dev: {
    getCurrentEffect(): (() => void) | null;
    getBatchDepth(): number;
    getBatchedEffectsCount(): number;
};
declare function isSignal<T>(value: any): value is Signal<T>;
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
        getCurrentEffect(): (() => void) | null;
        getBatchDepth(): number;
        getBatchedEffectsCount(): number;
    };
};

export { type Computed, type EffectCleanup, type Signal, batch, computed, _default as default, dev, effect, isComputed, isSignal, memo, on, root, signal, store, untrack };
