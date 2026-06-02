---
name: radix-motion
description: "Animate Radix UI primitives with Motion (formerly Framer Motion). Activate when: (1) adding animations to Radix components (Dialog, DropdownMenu, Tooltip, Popover, Toast, Tabs, Accordion, etc.), (2) integrating motion components with Radix asChild pattern, (3) implementing exit/enter animations with AnimatePresence and forceMount, (4) creating layout animations for Radix tabs/accordion, (5) building gesture interactions (hover, tap, focus) on Radix components. Covers: asChild composition, AnimatePresence patterns, forceMount setup, state hoisting, layout animations, and pre-built animation variants for all Radix primitives. Uses only free Motion APIs — no Motion+ features."
metadata:
  author: yuexiaoliang
  version: "1.0.0"
---

# Radix UI + Motion

Animate Radix UI primitives with Motion. Radix provides accessible, unstyled components. Motion provides the animation layer.

**Only free Motion APIs are used.** No Motion+ features (AnimateNumber, Carousel, Cursor, ScrambleText, Ticker, Typewriter).

## Installation

```bash
npm install motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu
# ... install other Radix primitives as needed
```

```tsx
import { motion, AnimatePresence, LayoutGroup } from "motion/react"
import * as Dialog from "@radix-ui/react-dialog"
```

## Core Integration Patterns

### 1. asChild — Compose Motion with Radix

Radix components accept `asChild` to delegate DOM rendering to a child element. Pass a `motion` component to animate it.

```tsx
<Dialog.Trigger asChild>
  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    Open Dialog
  </motion.button>
</Dialog.Trigger>
```

For content elements that need `initial`/`animate`/`exit`:

```tsx
<Dialog.Content asChild>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    Dialog content here
  </motion.div>
</Dialog.Content>
```

### 2. AnimatePresence + forceMount — Exit Animations

Radix controls mount/unmount internally. To animate exit, hoist state and use `AnimatePresence` with `forceMount` on the Portal.

```tsx
const [open, setOpen] = useState(false)

return (
  <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>
      <button>Open</button>
    </Dialog.Trigger>
    <AnimatePresence>
      {open && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Description>Description</Dialog.Description>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </AnimatePresence>
  </Dialog.Root>
)
```

**Key rules:**
- Always set `forceMount` on the Portal (or component with portal behavior)
- Hoist state with `open` + `onOpenChange`
- Wrap conditionally-rendered content in `AnimatePresence`
- Add `exit` prop to motion components inside

### 3. Layout Animations — Tabs, Accordion, etc.

For components that change layout (tab indicator, accordion height), hoist state and use `layout` prop.

```tsx
const [tab, setTab] = useState("account")

return (
  <Tabs.Root value={tab} onValueChange={setTab}>
    <Tabs.List>
      <Tabs.Trigger value="account">Account</Tabs.Trigger>
      <Tabs.Trigger value="password">Password</Tabs.Trigger>
      {/* Animated indicator */}
      <motion.div
        className="absolute bottom-0 h-0.5 bg-blue-500"
        layoutId="activeTab"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </Tabs.List>
    <AnimatePresence mode="wait">
      <Tabs.Content key={tab} value={tab} asChild>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Tab content */}
        </motion.div>
      </Tabs.Content>
    </AnimatePresence>
  </Tabs.Root>
)
```

Use `layoutDependency` when the layout change is driven by external state:

```tsx
<motion.div layout layoutDependency={tab} />
```

## Reusable Animation Variants

Define variants once, reuse across components:

```tsx
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const slideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
}

export const pop = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

// Usage
<motion.div
  variants={scale}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.2, ease: "easeOut" }}
/>
```

## Component Quick Reference

| Radix Component | Animation Pattern | Key Props |
|----------------|-------------------|-----------|
| Dialog / AlertDialog | Overlay fade + Content scale | `AnimatePresence`, `forceMount` |
| DropdownMenu | Scale + fade from trigger | `sideOffset`, `align` |
| ContextMenu | Scale + fade from cursor | `sideOffset` |
| Tooltip | Fade + slight translate | `side`, `sideOffset` |
| HoverCard | Fade + scale | `sideOffset` |
| Popover | Scale + fade from trigger | `sideOffset`, `align` |
| Toast | Slide in from edge + fade | `AnimatePresence`, `forceMount` |
| Tabs | Content crossfade / slide | `layoutId`, `mode="wait"` |
| Accordion | Height animation | `animate={{ height: "auto" }}` |
| Select | List scale + fade | `sideOffset`, `position="popper"` |
| Collapsible | Height animation | `animate={{ height }}` |
| Checkbox / Switch | Scale bounce | `whileTap={{ scale: 0.9 }}` |
| Slider | Thumb scale on hover | `whileHover`, `whileDrag` |
| Toolbar | Button hover/tap | `whileHover`, `whileTap` |
| Menubar | Menu scale + fade | Same as DropdownMenu |
| NavigationMenu | Viewport scale + fade | `layoutId` for indicator |
| RadioGroup | Dot scale | `layoutId` for indicator |
| Toggle / ToggleGroup | Press effect | `whileTap` |
| ScrollArea | Thumb fade | `whileHover` |
| Separator | — | Usually static |
| AspectRatio | — | Usually static |
| Avatar | Image fade in | `initial={{ opacity: 0 }}` |
| Label | — | Usually static |
| Progress | Width animation | `animate={{ width }}` |
| Skeleton | Shimmer pulse | `animate` with repeat |

## Accessibility

### Reduced Motion

Always respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from "motion/react"

function AnimatedDialog({ open, onOpenChange, children }) {
  const shouldReduceMotion = useReducedMotion()

  const variants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50"
                variants={fade}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div variants={variants} initial="initial" animate="animate" exit="exit">
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
```

### Focus Management

Radix handles focus trapping and restoration. Motion animations should not interfere:
- Keep `Dialog.Content` focusable elements inside the motion wrapper
- Avoid animating `transform` on elements that need immediate focus
- Use `duration: 0` for reduced motion, not `display: none`

## Common Transition Presets

```tsx
// Quick, snappy (menus, tooltips)
const quick = { duration: 0.15, ease: "easeOut" }

// Smooth, standard (dialogs, popovers)
const smooth = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }

// Springy (checkboxes, toggles, playful UI)
const springy = { type: "spring", stiffness: 400, damping: 25 }

// Bouncy (toasts, notifications)
const bouncy = { type: "spring", stiffness: 300, damping: 20 }

// Stagger children (lists, menus)
const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
}
```

## Tips

- **Always use `asChild`** on the Radix component, not `as={motion.div}` — `asChild` preserves Radix's accessibility and event handling while delegating rendering.
- **`forceMount` goes on the Portal**, not the Content or Overlay directly.
- **Hoist state for exit animations** — Radix's internal state management conflicts with `AnimatePresence`'s mount/unmount tracking.
- **Use `mode="wait"` on `AnimatePresence`** for tab content switches to prevent overlapping animations.
- **`layoutId` for shared layout** — Use the same `layoutId` string across components to create shared element transitions (e.g., tab indicator).
- **Portal elements animate independently** — Overlay and Content can have independent animations since they are separate portal children.

## Official Documentation

**Motion (React):**

| Topic | URL |
|-------|-----|
| React Animation Overview | https://motion.dev/docs/react-animation |
| Radix Integration Guide | https://motion.dev/docs/radix |
| AnimatePresence | https://motion.dev/docs/react-animate-presence |
| Layout Animations | https://motion.dev/docs/react-layout-animations |
| Motion Component | https://motion.dev/docs/react-motion-component |
| Gestures Overview | https://motion.dev/docs/react-gestures |
| useAnimate Hook | https://motion.dev/docs/react-use-animate |
| Transitions | https://motion.dev/docs/react-transitions |

**Radix UI Primitives:**

| Topic | URL |
|-------|-----|
| Primitives Docs | https://www.radix-ui.com/primitives/docs |
| Composition Guide (asChild) | https://www.radix-ui.com/primitives/docs/guides/composition |

## Reference Docs

- [Component Patterns](references/component-patterns.md) — Complete animation examples for each Radix primitive
- [Motion API Reference](references/motion-api.md) — Free Motion APIs quick reference
- [Common Recipes](references/common-recipes.md) — Reusable animation recipes and patterns
