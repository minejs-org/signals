<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.5-black"/>
    <img src="https://img.shields.io/badge/🔥-@minejs-black"/>
    <img src="https://img.shields.io/badge/zero-dependencies-black" alt="Test Coverage" />
    <br>
    <img src="https://img.shields.io/badge/coverage-99.14%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs-org/signals?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs-org/signals?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > **_A lightweight, zero-dependency signals library for reactive JavaScript applications._**

    - ### Setup

        > install [`hmm`](https://github.com/minejs/hmm) first.

        ```bash
        hmm i @minejs/signals
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Usage

        ```ts
        import { signal, effect, computed, batch } from '@minejs/signals'
        ```

        - ### 1. Basic Signal

            ```typescript
            // Create a signal
            const count = signal(0)

            // Read value
            console.log(count()) // 0

            // Update value
            count.set(5)
            console.log(count()) // 5

            // Update with function
            count.update(n => n + 1)
            console.log(count()) // 6
            ```

        - ### 2. Effects (Auto-run on changes)

            ```typescript
            const name = signal('John')

            // Effect runs automatically when dependencies change
            effect(() => {
                console.log('Hello,', name())
            })
            // Logs: "Hello, John"

            name.set('Jane')
            // Logs: "Hello, Jane"
            ```

        - ### 3. Computed Values (Derived state)

            ```typescript
            const firstName = signal('John')
            const lastName  = signal('Doe')

            // Computed value updates automatically
            const fullName = computed(() => {
                return `${firstName()} ${lastName()}`
            })

            console.log(fullName()) // "John Doe"

            firstName.set('Jane')
            console.log(fullName()) // "Jane Doe"
            ```

        - ### 4. Batch Updates (Optimize performance)

            ```typescript
            const a = signal(0)
            const b = signal(0)

            effect(() => {
                console.log('Sum:', a() + b())
            })
            // Logs: "Sum: 0"

            // Without batch: effect runs twice
            a.set(1) // Logs: "Sum: 1"
            b.set(2) // Logs: "Sum: 3"

            // With batch: effect runs once
            batch(() => {
                a.set(10)
                b.set(20)
            })
            // Logs: "Sum: 30" (only once!)
            ```


    <br>

- ## API Reference 🔥

    - #### `signal<T>(value: T): Signal<T>`
        > Create a reactive signal.

        ```typescript
        const count = signal(0)

        count()                   // Read: 0
        count.set(5)              // Write: 5
        count.update(n => n + 1)  // Update: 6
        count.peek()              // Read without tracking: 6
        ```

    - #### `effect(fn: () => void | (() => void)): () => void`

        > Run code automatically when dependencies change.

        ```typescript
        const count = signal(0)

        // Effect with cleanup
        const dispose = effect(() => {
            console.log('Count:', count())

            // Optional cleanup function
            return () => {
                console.log('Cleaning up...')
            }
        })

        // Stop the effect
        dispose()
        ```

    - #### `computed<T>(fn: () => T): Signal<T>`

        > Create a derived signal (memoized).

        ```typescript
        const count   = signal(0)
        const doubled = computed(() => count() * 2)

        console.log(doubled()) // 0
        count.set(5)
        console.log(doubled()) // 10
        ```

    - #### `batch<T>(fn: () => T): T`

        > Batch multiple updates into one.

        ```typescript
        const a = signal(0)
        const b = signal(0)

        batch(() => {
            a.set(1)
            b.set(2)
            // Effects run only once here
        })
        ```

    - #### `untrack<T>(fn: () => T): T`

        > Read signals without tracking dependencies.

        ```typescript
        const count = signal(0)

        effect(() => {
            const value = untrack(() => count())
            // count() is read but NOT tracked
            console.log(value)
        })

        count.set(1) // Effect does NOT run
        ```

    - #### `on<T>(signal: Signal<T>, fn: (value: T, prev: T) => void): () => void`

        > Run effect only when specific signal changes.

        ```typescript
        const count = signal(0)
        const other = signal('hello')

        on(count, (value, prevValue) => {
            console.log(`Changed from ${prevValue} to ${value}`)
            other() // Can read but won't track
        })

        other.set('world') // Does NOT trigger
        count.set(1)       // DOES trigger
        ```

    - #### `store<T>(obj: T): { [K in keyof T]: Signal<T[K]> }`

        > Create an object of signals.

        ```typescript
        const state = store({
            count : 0,
            name  : 'John'
        })

        state.count()      // 0
        state.name()       // 'John'

        state.count.set(5)
        state.name.set('Jane')
        ```

    - #### `root<T>(fn: (dispose: () => void) => T): T`

        > Create a disposal scope for effects.

        ```typescript
        root((dispose) => {
            effect(() => {
                // ... effects ...
            })

            // Clean up all effects at once
            dispose()
        })
        ```

    - #### `memo<T>(fn: () => T): () => T`

        > Memoize expensive computations.

        ```typescript
        const expensiveComputation = memo(() => {
            // This computation runs only once and returns cached value
            return Math.sqrt(16)
        })

        const result1 = expensiveComputation() // Computes
        const result2 = expensiveComputation() // Returns cached value
        ```

    - #### `Signal.subscribe(fn: () => void): () => void`

        > Subscribe to signal changes manually.

        ```typescript
        const count = signal(0)

        const unsubscribe = count.subscribe(() => {
            console.log('Signal changed!')
        })

        count.set(1) // Logs: "Signal changed!"

        unsubscribe() // Stop listening
        ```

    <br>


- ## Real-World Examples

  - #### Counter Component

    ```typescript
    import { signal, effect } from '@minejs/signals'

    function Counter() {
      const count = signal(0)

      const button = document.createElement('button')

      effect(() => {
        button.textContent = `Count: ${count()}`
      })

      button.onclick = () => count.update(n => n + 1)

      return button
    }
    ```

  - #### Todo App

    ```typescript
    import { signal, computed } from '@minejs/signals'

    interface Todo {
      id    : number
      text  : string
      done  : boolean
    }

    const todos   = signal<Todo[]>([])
    const filter  = signal<'all' | 'active' | 'completed'>('all')

    const filteredTodos = computed(() => {
      const f = filter()
      const t = todos()

      if (f === 'active') return t.filter(todo => !todo.done)
      if (f === 'completed') return t.filter(todo => todo.done)
      return t
    })

    const activeTodoCount = computed(() => {
      return todos().filter(t => !t.done).length
    })

    // Actions
    function addTodo(text: string) {
      todos.update(list => [
        ...list,
        { id: Date.now(), text, done: false }
      ])
    }

    function toggleTodo(id: number) {
      todos.update(list =>
        list.map(todo =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      )
    }
    ```

  - #### Form with Validation

    ```typescript
    import { signal, computed } from '@crux/signals'

    const email = signal('')
    const password = signal('')

    const isEmailValid = computed(() => {
      return email().includes('@') && email().length > 3
    })

    const isPasswordValid = computed(() => {
      return password().length >= 8
    })

    const canSubmit = computed(() => {
      return isEmailValid() && isPasswordValid()
    })

    effect(() => {
      const button    = document.querySelector('#submit')
      button.disabled = !canSubmit()
    })
    ```

  - #### Data Fetching

    ```typescript
    import { signal, effect } from '@minejs/signals'

    const userId    = signal<number | null>(null)
    const userData  = signal<any>(null)
    const loading   = signal(false)

    effect(async () => {
      const id = userId()

      if (!id) return

      loading.set(true)

      try {
        const response = await fetch(`/api/users/${id}`)
        const data     = await response.json()
        userData.set(data)
      } finally {
        loading.set(false)
      }
    })

    // Fetch user when ID changes
    userId.set(123)
    ```


<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->