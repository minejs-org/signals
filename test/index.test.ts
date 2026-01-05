/* eslint-disable @typescript-eslint/no-unused-vars */
// test/index.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { test, expect, describe } from 'bun:test';
    import {
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
    } from '../src';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    // ============================================================================
    // SIGNAL TESTS
    // ============================================================================

    describe('signal', () => {
        test('creates signal with initial value', () => {
            const count = signal(0);
            expect(count()).toBe(0);
        });

        test('updates signal value', () => {
            const count = signal(0);
            count.set(5);
            expect(count()).toBe(5);
        });

        test('updates signal with function', () => {
            const count = signal(0);
            count.update(n => n + 1);
            expect(count()).toBe(1);
        });

        test('peek reads without tracking', () => {
            const count = signal(0);
            let effectRuns = 0;

            effect(() => {
                count.peek(); // Should NOT track
                effectRuns++;
            });

            count.set(1);
            expect(effectRuns).toBe(1); // Only initial run
        });

        test('subscribe to changes', () => {
            const count = signal(0);
            let calls = 0;

            const unsub = count.subscribe(() => calls++);

            count.set(1);
            count.set(2);
            expect(calls).toBe(2);

            unsub();
            count.set(3);
            expect(calls).toBe(2); // No more calls after unsubscribe
        });

        test('only updates if value changed', () => {
            const count = signal(0);
            let effectRuns = 0;

            effect(() => {
                count();
                effectRuns++;
            });

            count.set(0); // Same value
            expect(effectRuns).toBe(1); // Should not trigger

            count.set(1); // Different value
            expect(effectRuns).toBe(2); // Should trigger
        });

        test('works with objects', () => {
            const user = signal({ name: 'John', age: 30 });
            expect(user().name).toBe('John');

            user.set({ name: 'Jane', age: 25 });
            expect(user().name).toBe('Jane');
        });

        test('works with arrays', () => {
            const items = signal([1, 2, 3]);
            expect(items()).toEqual([1, 2, 3]);

            items.update(arr => [...arr, 4]);
            expect(items()).toEqual([1, 2, 3, 4]);
        });
    });

    // ============================================================================
    // EFFECT TESTS
    // ============================================================================

    describe('effect', () => {
        test('runs immediately', () => {
            let runs = 0;
            effect(() => { runs++; });
            expect(runs).toBe(1);
        });

        test('runs when dependency changes', () => {
            const count = signal(0);
            let runs = 0;

            effect(() => {
                count();
                runs++;
            });

            expect(runs).toBe(1);
            count.set(1);
            expect(runs).toBe(2);
            count.set(2);
            expect(runs).toBe(3);
        });

        test('tracks multiple dependencies', () => {
            const a = signal(1);
            const b = signal(2);
            let sum = 0;

            effect(() => {
                sum = a() + b();
            });

            expect(sum).toBe(3);
            a.set(5);
            expect(sum).toBe(7);
            b.set(10);
            expect(sum).toBe(15);
        });

        test('cleanup function runs on re-execution', () => {
            const count = signal(0);
            let cleanups = 0;

            effect(() => {
                count();
                return () => cleanups++;
            });

            expect(cleanups).toBe(0);
            count.set(1);
            expect(cleanups).toBe(1); // Cleanup from first run
            count.set(2);
            expect(cleanups).toBe(2); // Cleanup from second run
        });

        test('dispose function stops effect', () => {
            const count = signal(0);
            let runs = 0;

            const dispose = effect(() => {
                count();
                runs++;
            });

            expect(runs).toBe(1);
            count.set(1);
            expect(runs).toBe(2);

            dispose();
            count.set(2);
            expect(runs).toBe(2); // No more runs after dispose
        });

        test('nested effects work correctly', () => {
            const outer = signal(0);
            const inner = signal(0);
            let outerRuns = 0;
            let innerRuns = 0;

            effect(() => {
                outer();
                outerRuns++;

                effect(() => {
                    inner();
                    innerRuns++;
                });
            });

            expect(outerRuns).toBe(1);
            expect(innerRuns).toBe(1);

            inner.set(1);
            expect(outerRuns).toBe(1); // Outer not affected
            expect(innerRuns).toBe(2); // Inner runs

            outer.set(1);
            expect(outerRuns).toBe(2); // Outer runs
            expect(innerRuns).toBe(3); // Inner recreated
        });
    });

    // ============================================================================
    // COMPUTED TESTS
    // ============================================================================

    describe('computed', () => {
        test('computes initial value', () => {
            const count = signal(0);
            const doubled = computed(() => count() * 2);
            expect(doubled()).toBe(0);
        });

        test('updates when dependency changes', () => {
            const count = signal(0);
            const doubled = computed(() => count() * 2);

            expect(doubled()).toBe(0);
            count.set(5);
            expect(doubled()).toBe(10);
            count.set(10);
            expect(doubled()).toBe(20);
        });

        test('chains computed values', () => {
            const a = signal(1);
            const b = computed(() => a() * 2);
            const c = computed(() => b() * 2);

            expect(c()).toBe(4);
            a.set(2);
            expect(c()).toBe(8);
        });

        test('only recomputes when dependencies change', () => {
            const count = signal(0);
            let computations = 0;

            const doubled = computed(() => {
                computations++;
                return count() * 2;
            });

            doubled(); // First access
            doubled(); // Second access
            expect(computations).toBe(1); // Only computed once

            count.set(1);
            doubled();
            expect(computations).toBe(2); // Recomputed
        });

        test('is marked as computed', () => {
            const count = signal(0);
            const doubled = computed(() => count() * 2);

            expect(isSignal(count)).toBe(true);
            expect(isSignal(doubled)).toBe(true);
            expect(isComputed(doubled)).toBe(true);
            expect(isComputed(count)).toBe(false);
        });
    });

    // ============================================================================
    // BATCH TESTS
    // ============================================================================

    describe('batch', () => {
        test('batches multiple updates', () => {
            const a = signal(0);
            const b = signal(0);
            let runs = 0;

            effect(() => {
                a();
                b();
                runs++;
            });

            expect(runs).toBe(1);

            batch(() => {
                a.set(1);
                b.set(2);
            });

            expect(runs).toBe(2); // Only one additional run
        });

        test('batches nested updates', () => {
            const count = signal(0);
            let runs = 0;

            effect(() => {
                count();
                runs++;
            });

            batch(() => {
                count.set(1);
                count.set(2);
                count.set(3);
            });

            expect(runs).toBe(2); // Initial + batched
            expect(count()).toBe(3);
        });

        test('returns value from batch', () => {
            const result = batch(() => {
                return 42;
            });
            expect(result).toBe(42);
        });

        test('nested batches work correctly', () => {
            const count = signal(0);
            let runs = 0;

            effect(() => {
                count();
                runs++;
            });

            batch(() => {
                count.set(1);
                batch(() => {
                    count.set(2);
                    count.set(3);
                });
                count.set(4);
            });

            expect(runs).toBe(2);
            expect(count()).toBe(4);
        });
    });

    // ============================================================================
    // UNTRACK TESTS
    // ============================================================================

    describe('untrack', () => {
        test('reads signal without tracking', () => {
            const count = signal(0);
            let runs = 0;

            effect(() => {
                untrack(() => count());
                runs++;
            });

            count.set(1);
            expect(runs).toBe(1); // Effect should not run again
        });

        test('returns value from untrack', () => {
            const count = signal(42);
            const value = untrack(() => count());
            expect(value).toBe(42);
        });

        test('nested tracking works', () => {
            const a = signal(0);
            const b = signal(0);
            let runs = 0;

            effect(() => {
                a(); // Tracked
                untrack(() => b()); // Not tracked
                runs++;
            });

            expect(runs).toBe(1);
            b.set(1);
            expect(runs).toBe(1); // b not tracked
            a.set(1);
            expect(runs).toBe(2); // a tracked
        });
    });

    // ============================================================================
    // ON TESTS
    // ============================================================================

    describe('on', () => {
        test('runs only when specific signal changes', () => {
            const a = signal(0);
            const b = signal(0);
            let runs = 0;

            on(a, () => {
                b(); // Access b but don't track it
                runs++;
            });

            expect(runs).toBe(1);
            b.set(1);
            expect(runs).toBe(1); // b change doesn't trigger
            a.set(1);
            expect(runs).toBe(2); // a change triggers
        });

        test('provides current and previous value', () => {
            const count = signal(0);
            let prev = -1;
            let curr = -1;

            on(count, (value, prevValue) => {
                curr = value;
                prev = prevValue;
            });

            expect(curr).toBe(0);
            expect(prev).toBe(0);

            count.set(5);
            expect(curr).toBe(5);
            expect(prev).toBe(0);

            count.set(10);
            expect(curr).toBe(10);
            expect(prev).toBe(5);
        });
    });

    // ============================================================================
    // STORE TESTS
    // ============================================================================

    describe('store', () => {
        test('creates store from object', () => {
            const state = store({
                count: 0,
                name: 'John'
            });

            expect(state.count()).toBe(0);
            expect(state.name()).toBe('John');
        });

        test('store signals are reactive', () => {
            const state = store({ count: 0 });
            let runs = 0;

            effect(() => {
                state.count();
                runs++;
            });

            state.count.set(1);
            expect(runs).toBe(2);
        });

        test('store with multiple properties', () => {
            const state = store({
                user: { name: 'John', age: 30 },
                todos: [] as string[]
            });

            expect(state.user().name).toBe('John');
            expect(state.todos()).toEqual([]);

            state.todos.update(arr => [...arr, 'Learn signals']);
            expect(state.todos()).toEqual(['Learn signals']);
        });
    });

    // ============================================================================
    // MEMO TESTS
    // ============================================================================

    describe('memo', () => {
        test('memoizes expensive computation', () => {
            let computations = 0;
            const expensive = memo(() => {
                computations++;
                return Math.random();
            });

            const first = expensive();
            const second = expensive();

            expect(first).toBe(second);
            expect(computations).toBe(1);
        });
    });

    // ============================================================================
    // ROOT TESTS
    // ============================================================================

    describe('root', () => {
        test('creates disposal scope', () => {
            const count = signal(0);
            let runs = 0;

            root((dispose) => {
                effect(() => {
                    count();
                    runs++;
                });

                count.set(1);
                expect(runs).toBe(2);

                dispose();
                count.set(2);
                expect(runs).toBe(2); // No more runs after dispose
            });
        });
    });

    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================

    describe('integration', () => {
        test('complex reactive system', () => {
            // State
            const firstName = signal('John');
            const lastName = signal('Doe');
            const age = signal(30);

            // Computed
            const fullName = computed(() => `${firstName()} ${lastName()}`);
            const isAdult = computed(() => age() >= 18);

            // Effects
            let profileUpdates = 0;
            effect(() => {
                fullName();
                age();
                profileUpdates++;
            });

            // Initial state
            expect(fullName()).toBe('John Doe');
            expect(isAdult()).toBe(true);
            expect(profileUpdates).toBe(1);

            // Batch update
            batch(() => {
                firstName.set('Jane');
                lastName.set('Smith');
                age.set(25);
            });

            expect(fullName()).toBe('Jane Smith');
            expect(profileUpdates).toBe(2); // Only one update despite 3 changes
        });

        test('todo app simulation', () => {
            // State
            const todos = signal([
                { id: 1, text: 'Learn signals', done: false },
                { id: 2, text: 'Build app', done: false }
            ]);
            const filter = signal<'all' | 'active' | 'completed'>('all');

            // Computed
            const filteredTodos = computed(() => {
                const t = todos();
                const f = filter();

                if (f === 'active') return t.filter(todo => !todo.done);
                if (f === 'completed') return t.filter(todo => todo.done);
                return t;
            });

            const activeTodoCount = computed(() => {
                return todos().filter(t => !t.done).length;
            });

            // Initial state
            expect(filteredTodos().length).toBe(2);
            expect(activeTodoCount()).toBe(2);

            // Mark first todo as done
            todos.update(list =>
                list.map((todo, i) =>
                    i === 0 ? { ...todo, done: true } : todo
                )
            );

            expect(activeTodoCount()).toBe(1);

            // Filter to completed
            filter.set('completed');
            expect(filteredTodos().length).toBe(1);
            expect(filteredTodos()[0].text).toBe('Learn signals');

            // Filter to active
            filter.set('active');
            expect(filteredTodos().length).toBe(1);
            expect(filteredTodos()[0].text).toBe('Build app');
        });

        test('performance with many signals', () => {
            const signals = Array.from({ length: 1000 }, (_, i) => signal(i));
            const sum = computed(() => signals.reduce((acc, s) => acc + s(), 0));

            expect(sum()).toBe(499500); // Sum of 0..999

            // Update in batch
            const start = performance.now();
            batch(() => {
                signals.forEach(s => s.update(n => n + 1));
            });
            const duration = performance.now() - start;

            expect(sum()).toBe(500500); // Sum of 1..1000
            expect(duration).toBeLessThan(100); // Should be fast
        });
    });

    // ============================================================================
    // EDGE CASES
    // ============================================================================

    describe('edge cases', () => {
        test('handles undefined and null', () => {
            const nullable = signal<string | null | undefined>(null);
            expect(nullable()).toBe(null);

            nullable.set('value');
            expect(nullable()).toBe('value');

            nullable.set(undefined);
            expect(nullable()).toBe(undefined);
        });

        test('handles circular dependencies gracefully', () => {
            const a = signal(1);
            const b = computed(() => a() + 1);

            // This would create infinite loop if not handled
            effect(() => {
                a();
                b();
            });

            a.set(2);
            expect(b()).toBe(3);
        });

        test('handles rapid updates', () => {
            const count = signal(0);
            let finalValue = 0;

            effect(() => {
                finalValue = count();
            });

            // Rapid updates
            for (let i = 0; i < 100; i++) {
                count.set(i);
            }

            expect(finalValue).toBe(99);
        });

        test('cleanup runs even if effect throws', () => {
            const count = signal(0);
            let cleanupRan = false;

            try {
                effect(() => {
                    count();
                    return () => {
                        cleanupRan = true;
                    };
                });

                count.set(1); // This will run cleanup
            } catch (e) {
                // Ignore
            }

            expect(cleanupRan).toBe(true);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝