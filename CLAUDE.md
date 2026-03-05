# Claude Code Instructions

## Project

React Native / Expo app (TypeScript) — fog-of-war explorer using location tracking.

Stack: Expo, React Native, Zustand, MMKV, Skia, react-native-maps.

## Code Style

- **TypeScript strict mode** — no `any`, no type assertions unless unavoidable.
- Prefer `const` over `let`. Never use `var`.
- Named exports only. No default exports.
- Small, focused functions — one responsibility per function.
- Descriptive names: `calculateExploredArea` not `calc`, `userLocation` not `ul`.
- No magic numbers or strings — extract to named constants in `src/utils/constants.ts`.

## Clean Architecture

Layers (inner layers must not depend on outer):

```
Types / Domain Models  (src/types/)
        |
    Services           (src/services/)   — pure business logic, no UI
        |
    Stores             (src/stores/)     — Zustand state, calls services
        |
  Components / UI      (src/components/) — reads stores, calls store actions
```

- **Services** are pure: no React imports, no Zustand, no side effects beyond their contract.
- **Stores** orchestrate: call services, hold state, expose actions.
- **Components** are dumb: no direct service calls, no raw storage access.
- **Utils** (`src/utils/`) are stateless pure helpers with no dependencies on the above layers.

## SOLID Principles

- **SRP**: each file/class/function has one reason to change.
- **OCP**: extend behaviour via new functions/modules, not by modifying stable ones.
- **LSP**: honour contracts — if a function accepts a `LocationCoords` type, it must work with any valid instance.
- **ISP**: small, focused interfaces/types. Split a fat type into composable ones.
- **DIP**: depend on abstractions (TypeScript interfaces/types), not concrete implementations. Pass dependencies in rather than importing them directly when it aids testability.

## React & React Native

- Functional components only — no class components.
- Custom hooks for reusable stateful logic (`src/hooks/`).
- Keep components small: extract sub-components before a file exceeds ~150 lines.
- Avoid inline styles for anything reused — extract to a `styles` object at the bottom of the file using `StyleSheet.create`.
- Memoize expensive computations with `useMemo`; stabilise callbacks passed to children with `useCallback`.
- Do not call hooks conditionally.

## State Management (Zustand)

- One store per domain concept (e.g., `explorationStore`, `locationStore`).
- Keep store state minimal — derive values with selectors rather than storing computed state.
- Actions live inside the store; components never mutate state directly.
- Avoid subscribing to the entire store — use fine-grained selectors to limit re-renders.

## Error Handling

- Handle errors at the boundary closest to the user (components / hooks), not deep in services.
- Services throw typed errors or return `Result`-style objects — never swallow errors silently.
- Always handle the error case of async operations; never leave a `catch` block empty.

## Testing

- Co-locate unit tests with the file they test: `geoUtils.test.ts` beside `geoUtils.ts`.
- Test behaviour, not implementation details.
- Services and utils should be fully unit-testable without mocks.

## What to Avoid

- No business logic in components.
- No direct storage (`MMKV`) access outside `src/services/storageService.ts`.
- No direct location API calls outside `src/services/locationService.ts`.
- No `console.log` left in committed code.
- No commented-out code — delete it.
- No premature abstractions — only abstract when there are at least two concrete use cases.
