# Common Animation Recipes

Reusable animation patterns and recipes for Radix UI + Motion.

## Transition Presets

```tsx
// Snappy — Menus, tooltips, quick feedback
export const quick = { duration: 0.15, ease: "easeOut" }

// Smooth — Dialogs, popovers, standard transitions
export const smooth = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }

// Elegant — Premium feel, slower reveals
export const elegant = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }

// Springy — Playful UI, checkboxes, toggles
export const springy = { type: "spring", stiffness: 400, damping: 25 }

// Bouncy — Notifications, toasts, playful feedback
export const bouncy = { type: "spring", stiffness: 300, damping: 20 }

// Gentle — Subtle, background animations
export const gentle = { type: "spring", stiffness: 200, damping: 30 }

// Instant — For reduced motion / accessibility
export const instant = { duration: 0 }
```

## Animation Variants Library

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

export const pop = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
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

export const slideLeft = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
}

export const slideRight = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
}

export const slideInFromBottom = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
}

export const slideInFromTop = {
  initial: { opacity: 0, y: -50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
}

export const slideInFromLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

export const slideInFromRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
}

// With rotation
export const flip = {
  initial: { opacity: 0, rotateX: -15 },
  animate: { opacity: 1, rotateX: 0 },
  exit: { opacity: 0, rotateX: 15 },
}
```

## Stagger Patterns

```tsx
// Container with staggered children
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,    // Delay between each child
      delayChildren: 0.1,       // Delay before first child
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,     // Reverse stagger on exit
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// Usage in DropdownMenu items
<motion.div variants={staggerContainer} initial="initial" animate="animate" exit="exit">
  {items.map((item) => (
    <motion.button key={item} variants={staggerItem}>
      {item}
    </motion.button>
  ))}
</motion.div>
```

## Dialog/Modal Patterns

```tsx
// Centered modal with overlay
export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
}

// Bottom sheet (mobile-style)
export const bottomSheetVariants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

// Side drawer
export const drawerVariants = {
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
}
```

## Menu Patterns

```tsx
// Dropdown menu content
export const menuContentVariants = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: { duration: 0.1 },
  },
}

// Context menu (appears from cursor)
export const contextMenuVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.1, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.08 },
  },
}

// Submenu (nested)
export const submenuVariants = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 },
}
```

## Toast/Notification Patterns

```tsx
// Slide in from right
export const toastRightVariants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

// Slide in from bottom
export const toastBottomVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
}

// Stack behavior with layout
<motion.div
  layout                          // Auto-animate position when siblings change
  variants={toastRightVariants}
  initial="initial"
  animate="animate"
  exit="exit"
/>
```

## Tab Patterns

```tsx
// Content crossfade
export const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.1 } },
}

// Content slide
export const tabSlideVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
  }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
    transition: { duration: 0.15 },
  }),
}

// Usage with custom prop
const [tab, setTab] = useState(0)
const [direction, setDirection] = useState(0)

const handleTabChange = (newTab: string) => {
  const newIndex = tabs.indexOf(newTab)
  setDirection(newIndex > tab ? 1 : -1)
  setTab(newIndex)
}

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={tab}
    custom={direction}
    variants={tabSlideVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {content}
  </motion.div>
</AnimatePresence>
```

## Accordion Patterns

```tsx
// Height animation with opacity
export const accordionVariants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { height: { duration: 0.2 }, opacity: { duration: 0.15, delay: 0.05 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.2 }, opacity: { duration: 0.1 } },
  },
}

// Chevron rotation
export const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
}
```

## Form Feedback Patterns

```tsx
// Shake on error
export const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4 },
  },
}

// Pulse on success
export const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
}

// Usage
<motion.div
  animate={hasError ? "shake" : hasSuccess ? "pulse" : ""}
  variants={shakeVariants}
>
  <input />
</motion.div>
```

## Hover/Tap Patterns

```tsx
// Button press
export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
}

// Card lift
export const cardLift = {
  whileHover: { y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2 },
}

// Icon button
export const iconButton = {
  whileHover: { scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" },
  whileTap: { scale: 0.9 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
}

// Link underline
export const linkUnderline = {
  whileHover: { x: 4 },
  transition: { type: "spring", stiffness: 300, damping: 20 },
}
```

## Loading Patterns

```tsx
// Skeleton shimmer
export const shimmerVariants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// Spinner rotation
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" },
  },
}

// Dots bounce
export const dotsVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 0.6, repeat: Infinity },
  },
}
```

## Reduced Motion Wrapper

```tsx
import { useReducedMotion } from "motion/react"

export function createAccessibleVariants(activeVariants: object) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return {
      initial: {},
      animate: {},
      exit: {},
      transition: { duration: 0 },
    }
  }

  return activeVariants
}

// Usage
const variants = createAccessibleVariants({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
})
```

## Common Easing Functions

```tsx
// CSS named easings
"linear"      // Constant speed
"easeIn"      // Start slow, end fast
"easeOut"     // Start fast, end slow (most common for UI)
"easeInOut"   // Slow at both ends

// Cubic bezier curves
[0.4, 0, 0.2, 1]     // Material Design standard
[0.25, 0.46, 0.45, 0.94]  // Smooth deceleration
[0.55, 0.085, 0.68, 0.53] // Ease in quad
[0.25, 0.46, 0.45, 0.94]  // Ease out quad
[0.77, 0, 0.175, 1]       // Ease in out quart
```

## Easing Function Library

```tsx
export const easings = {
  // Material Design
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],

  // iOS-style
  ios: [0.32, 0.72, 0, 1],

  // Smooth
  smooth: [0.25, 0.46, 0.45, 0.94],
  smoother: [0.45, 0.05, 0.55, 0.95],

  // Bouncy
  bouncy: [0.68, -0.6, 0.32, 1.6],
  springy: [0.175, 0.885, 0.32, 1.275],
}
```
