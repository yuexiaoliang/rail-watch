# Motion Free API Reference

Quick reference for free Motion APIs usable with Radix UI. **No Motion+ features** (AnimateNumber, Carousel, Cursor, ScrambleText, Ticker, Typewriter).

## Components

### `motion`

Create animated versions of HTML elements and custom components.

```tsx
import { motion } from "motion/react"

// HTML elements
<motion.div />
<motion.span />
<motion.button />
<motion.input />
<motion.svg><motion.path /></motion.svg>

// Custom components (must forward ref)
const MotionComponent = motion(CustomComponent)
```

### `AnimatePresence`

Enables exit animations when components are removed from React tree.

```tsx
import { AnimatePresence } from "motion/react"

<AnimatePresence>
  {isVisible && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `"sync" \| "wait" \| "popLayout"` | How to handle entering/exiting children. `wait` = one at a time |
| `initial` | `boolean` | `false` to disable initial animations on first render |
| `onExitComplete` | `() => void` | Callback when all exits have finished |

### `LayoutGroup`

Groups layout animations so shared `layoutId` elements can animate between different components.

```tsx
import { LayoutGroup } from "motion/react"

<LayoutGroup>
  <ComponentA />
  <ComponentB />
</LayoutGroup>
```

### `LazyMotion`

Lazy-load animation features to reduce bundle size.

```tsx
import { LazyMotion, domAnimation } from "motion/react"

<LazyMotion features={domAnimation}>
  <motion.div animate={{ x: 100 }} />
</LazyMotion>
```

### `MotionConfig`

Set default transition properties for all children.

```tsx
import { MotionConfig } from "motion/react"

<MotionConfig transition={{ duration: 0.5 }}>
  <motion.div animate={{ x: 100 }} />  {/* Uses duration: 0.5 */}
</MotionConfig>
```

### `Reorder`

Draggable reorderable lists.

```tsx
import { Reorder } from "motion/react"

<Reorder.Group axis="y" values={items} onReorder={setItems}>
  {items.map((item) => (
    <Reorder.Item key={item} value={item}>
      {item}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

## Animation Props

### Core Props

| Prop | Type | Description |
|------|------|-------------|
| `initial` | `Target` | Initial animation state |
| `animate` | `Target \| VariantLabels` | Target animation state |
| `exit` | `Target` | Exit animation state (requires `AnimatePresence`) |
| `transition` | `Transition` | Animation configuration |

```tsx
<motion.div
  initial={{ opacity: 0, x: -100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 100 }}
  transition={{ duration: 0.5 }}
/>
```

### Gesture Props

| Prop | Type | Description |
|------|------|-------------|
| `whileHover` | `Target` | Animation while hovering |
| `whileTap` | `Target` | Animation while tapping/pressing |
| `whileFocus` | `Target` | Animation while focused |
| `whileDrag` | `Target` | Animation while dragging |
| `drag` | `boolean \| "x" \| "y"` | Enable dragging |
| `dragConstraints` | `RefObject \| Constraints` | Limit drag area |
| `dragElastic` | `number` | Drag elasticity (0-1) |
| `dragSnapToOrigin` | `boolean` | Return to origin on release |

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ scale: 1.02 }}
  whileDrag={{ scale: 1.1 }}
  drag
  dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
/>
```

### Layout Props

| Prop | Type | Description |
|------|------|-------------|
| `layout` | `boolean \| "position" \| "size"` | Animate layout changes |
| `layoutId` | `string` | Shared element transition ID |
| `layoutDependency` | `any` | Force layout recalculation when value changes |
| `layoutScroll` | `boolean` | Consider scroll position in layout |

```tsx
// Auto-animate position/size changes
<motion.div layout />

// Shared element transition
<LayoutGroup>
  {isA && <motion.div layoutId="box" />}
  {isB && <motion.div layoutId="box" />}
</LayoutGroup>
```

### Variants

```tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,     // Stagger child animations
      delayChildren: 0.2,       // Delay before children start
    },
  },
  exit: { opacity: 0, y: -20 },
}

<motion.div
  variants={variants}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

## Transition Configuration

### Timing

```tsx
// Duration and easing
const transition = {
  duration: 0.3,                    // seconds
  ease: "easeOut",                  // "linear" | "easeIn" | "easeOut" | "easeInOut"
  ease: [0.25, 0.46, 0.45, 0.94],  // Cubic bezier [x1, y1, x2, y2]
  delay: 0.2,                       // Delay before animation starts
  repeat: 2,                        // Number of repeats (Infinity for infinite)
  repeatType: "reverse",            // "loop" | "reverse" | "mirror"
  repeatDelay: 0.5,                 // Delay between repeats
}
```

### Spring Physics

```tsx
const springTransition = {
  type: "spring",
  stiffness: 400,      // Spring stiffness (higher = snappier)
  damping: 25,         // Friction (higher = less bounce)
  mass: 1,             // Mass of the object
  bounce: 0.2,         // Bounciness (0-1)
  restDelta: 0.01,     // Threshold to consider animation complete
  restSpeed: 0.01,     // Speed threshold to consider animation complete
}
```

### Tween (default)

```tsx
const tweenTransition = {
  type: "tween",       // Default type
  duration: 0.3,
  ease: "easeOut",
}
```

### Inertia

```tsx
const inertiaTransition = {
  type: "inertia",
  velocity: 100,       // Initial velocity
  power: 0.8,          // Power of deceleration
  timeConstant: 700,   // Time to decelerate (ms)
  min: 0,              // Minimum value
  max: 100,            // Maximum value
}
```

## Animation Values

### Single Values

```tsx
<motion.div animate={{ x: 100, y: 50, rotate: 90 }} />
```

### Arrays (Keyframes)

```tsx
<motion.div
  animate={{
    x: [0, 100, 0],           // Keyframe animation
    rotate: [0, 180, 360],
  }}
  transition={{ duration: 2 }}
/>
```

### Target Properties

```tsx
<motion.div
  animate={{
    // Transforms
    x, y, z,
    rotate, rotateX, rotateY, rotateZ,
    scale, scaleX, scaleY,
    skewX, skewY,

    // CSS properties
    opacity,
    backgroundColor: "#ff0000",
    color: "#fff",
    width: "100%",
    height: "auto",
    borderRadius: "50%",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",

    // Filters
    filter: "blur(10px)",

    // SVG
    pathLength: 1,            // Animate SVG stroke
    pathOffset: 0,
    fill: "#ff0000",
    stroke: "#000",
    strokeWidth: 2,
  }}
/>
```

## Hooks

### `useAnimate`

Imperative animation control.

```tsx
import { useAnimate } from "motion/react"

function Component() {
  const [scope, animate] = useAnimate()

  const handleClick = async () => {
    await animate(scope.current, { x: 100 }, { duration: 0.5 })
    await animate(scope.current, { rotate: 90 }, { duration: 0.3 })
  }

  return <div ref={scope} onClick={handleClick}>Click me</div>
}
```

### `useReducedMotion`

Detect user's motion preference.

```tsx
import { useReducedMotion } from "motion/react"

function Component() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { scale: 1.1 }}
    />
  )
}
```

### `useInView`

Detect when element enters viewport.

```tsx
import { useInView } from "motion/react"
import { useRef } from "react"

function Component() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
    />
  )
}
```

### `useAnimationFrame`

Run callback on every animation frame.

```tsx
import { useAnimationFrame } from "motion/react"

function Component() {
  useAnimationFrame((time) => {
    // time in milliseconds
    console.log(time)
  })
}
```

### `useScroll`

Track scroll progress.

```tsx
import { useScroll, useTransform } from "motion/react"
import { useRef } from "react"

function Component() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div ref={containerRef}>
      <motion.div style={{ opacity }} />
    </div>
  )
}
```

### `useSpring`

Create a spring-driven motion value.

```tsx
import { useSpring, useMotionValue } from "motion/react"

function Component() {
  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })

  return <motion.div style={{ x: springX }} />
}
```

### `useTransform`

Transform one motion value into another.

```tsx
import { useMotionValue, useTransform } from "motion/react"

function Component() {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0])
  const rotate = useTransform(x, [-100, 100], [-45, 45])

  return <motion.div style={{ x, opacity, rotate }} />
}
```

### `useMotionValue`

Create a reactive value for animation.

```tsx
import { useMotionValue } from "motion/react"

function Component() {
  const x = useMotionValue(0)

  return (
    <motion.div
      drag
      style={{ x }}
      onDrag={(event, info) => {
        x.set(info.point.x)
      }}
    />
  )
}
```

### `useMotionTemplate`

Build CSS string templates from motion values.

```tsx
import { useMotionTemplate, useMotionValue } from "motion/react"

function Component() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, #fff, #000)`

  return <motion.div style={{ background }} />
}
```

### `useMotionValueEvent`

Subscribe to motion value changes.

```tsx
import { useMotionValueEvent, useMotionValue } from "motion/react"

function Component() {
  const x = useMotionValue(0)

  useMotionValueEvent(x, "change", (latest) => {
    console.log(latest)
  })

  return <motion.div drag style={{ x }} />
}
```

### `useVelocity`

Get velocity of a motion value.

```tsx
import { useVelocity, useMotionValue } from "motion/react"

function Component() {
  const x = useMotionValue(0)
  const velocityX = useVelocity(x)

  return <motion.div drag style={{ x }} />
}
```

### `useDragControls`

Programmatically control drag.

```tsx
import { useDragControls } from "motion/react"

function Component() {
  const dragControls = useDragControls()

  return (
    <>
      <div
        onPointerDown={(e) => dragControls.start(e)}  // Drag handle
        style={{ cursor: "grab" }}
      >
        Drag handle
      </div>
      <motion.div drag="x" dragControls={dragControls} />
    </>
  )
}
```

## Not Included (Motion+)

These APIs require Motion+ subscription and are **not** covered by this skill:

| Component/API | Purpose |
|--------------|---------|
| `AnimateNumber` | Animated number counting |
| `Carousel` | Carousel/slider component |
| `Cursor` | Custom cursor effects |
| `ScrambleText` | Text scramble animation |
| `Ticker` | Marquee/ticker animation |
| `Typewriter` | Typewriter text effect |
