# Component Animation Patterns

Complete animation examples for Radix primitives with Motion.

All examples use **only free Motion APIs**. No Motion+ features.

## Dialog / AlertDialog

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Dialog from "@radix-ui/react-dialog"

export function AnimatedDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button>Open Dialog</button>
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
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Dialog.Title className="text-lg font-semibold">Dialog Title</Dialog.Title>
                <Dialog.Description className="mt-2 text-gray-600">
                  Dialog description goes here.
                </Dialog.Description>
                <Dialog.Close asChild>
                  <button className="mt-4">Close</button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
```

### AlertDialog variant (with focus trap)

AlertDialog is identical to Dialog in animation pattern. The only difference is Radix's built-in focus behavior (focuses the first focusable element by default). No animation changes needed.

## DropdownMenu

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

export function AnimatedDropdownMenu() {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button>Options</button>
      </DropdownMenu.Trigger>
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content asChild sideOffset={8} align="start">
              <motion.div
                className="min-w-[200px] rounded-md bg-white p-1 shadow-lg"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <DropdownMenu.Item asChild>
                  <motion.button
                    className="w-full rounded px-2 py-1.5 text-left text-sm outline-none hover:bg-gray-100"
                    whileHover={{ x: 2 }}
                  >
                    Cut
                  </motion.button>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <motion.button
                    className="w-full rounded px-2 py-1.5 text-left text-sm outline-none hover:bg-gray-100"
                    whileHover={{ x: 2 }}
                  >
                    Copy
                  </motion.button>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
                <DropdownMenu.Item asChild>
                  <motion.button
                    className="w-full rounded px-2 py-1.5 text-left text-sm outline-none hover:bg-gray-100"
                    whileHover={{ x: 2 }}
                  >
                    Paste
                  </motion.button>
                </DropdownMenu.Item>
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  )
}
```

### With staggered items

```tsx
const menuVariants = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, staggerChildren: 0.03 },
  },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1 } },
}

const itemVariants = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 },
}

// Use: <motion.div variants={menuVariants} ...>
//      <motion.button variants={itemVariants} ...> inside
```

## ContextMenu

Identical to DropdownMenu pattern. The trigger is right-click instead of button click.

```tsx
<DropdownMenu.Root open={open} onOpenChange={setOpen}>
  <DropdownMenu.Trigger asChild>
    <div className="h-40 rounded border border-dashed border-gray-300 flex items-center justify-center">
      Right click here
    </div>
  </DropdownMenu.Trigger>
  {/* Portal + Content same as DropdownMenu */}
</DropdownMenu.Root>
```

## Tooltip

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Tooltip from "@radix-ui/react-tooltip"

export function AnimatedTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Tooltip.Provider>
      <Tooltip.Root open={open} onOpenChange={setOpen} delayDuration={100}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <AnimatePresence>
          {open && (
            <Tooltip.Portal forceMount>
              <Tooltip.Content asChild sideOffset={6} side="top">
                <motion.div
                  className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {content}
                  <Tooltip.Arrow className="fill-gray-900" />
                </motion.div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </AnimatePresence>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

## HoverCard

Same pattern as Tooltip, typically with slightly longer duration and more content:

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as HoverCard from "@radix-ui/react-hover-card"

export function AnimatedHoverCard() {
  const [open, setOpen] = useState(false)

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={100} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <a href="#">Hover me</a>
      </HoverCard.Trigger>
      <AnimatePresence>
        {open && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content asChild sideOffset={8}>
              <motion.div
                className="w-64 rounded-lg bg-white p-4 shadow-lg"
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <HoverCard.Arrow className="fill-white" />
                <p>Hover card content</p>
              </motion.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  )
}
```

## Popover

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Popover from "@radix-ui/react-popover"

export function AnimatedPopover() {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button>Open Popover</button>
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content asChild sideOffset={8} align="start">
              <motion.div
                className="w-72 rounded-lg bg-white p-4 shadow-lg"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Popover.Close asChild>
                  <button aria-label="Close">x</button>
                </Popover.Close>
                <p>Popover content</p>
                <Popover.Arrow className="fill-white" />
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}
```

## Toast

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Toast from "@radix-ui/react-toast"

export function ToastDemo() {
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([])

  const addToast = () => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message: `Toast ${id.slice(0, 4)}` }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  return (
    <Toast.Provider swipeDirection="right">
      <button onClick={addToast}>Add Toast</button>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast.Root key={toast.id} asChild open forceMount>
            <motion.div
              className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg"
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              layout
            >
              <Toast.Title className="text-sm font-medium">{toast.message}</Toast.Title>
              <Toast.Close asChild>
                <button aria-label="Close" className="text-gray-400 hover:text-white">
                  x
                </button>
              </Toast.Close>
            </motion.div>
          </Toast.Root>
        ))}
      </AnimatePresence>
      <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2" />
    </Toast.Provider>
  )
}
```

**Note:** For Toast, `layout` on each toast enables automatic reordering animation when toasts are removed.

## Tabs

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Tabs from "@radix-ui/react-tabs"

export function AnimatedTabs() {
  const [tab, setTab] = useState("account")

  return (
    <Tabs.Root value={tab} onValueChange={setTab}>
      <Tabs.List className="relative flex gap-1 border-b">
        <Tabs.Trigger value="account" className="relative px-4 py-2 text-sm">
          Account
        </Tabs.Trigger>
        <Tabs.Trigger value="password" className="relative px-4 py-2 text-sm">
          Password
        </Tabs.Trigger>
        {/* Animated underline indicator */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-blue-500"
          layoutId="activeTab"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            width: tab === "account" ? 68 : 76,
            left: tab === "account" ? 0 : 68,
          }}
        />
      </Tabs.List>
      <AnimatePresence mode="wait">
        <Tabs.Content key={tab} value={tab} asChild forceMount>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "account" ? <p>Account settings</p> : <p>Password settings</p>}
          </motion.div>
        </Tabs.Content>
      </AnimatePresence>
    </Tabs.Root>
  )
}
```

### Tabs with animated background pill (more polished)

```tsx
// Instead of underline, use a background pill that slides between tabs
function TabPill({ tabs, activeTab }: { tabs: string[]; activeTab: string }) {
  return (
    <Tabs.List className="relative inline-flex rounded-lg bg-gray-100 p-1">
      {tabs.map((tab) => (
        <Tabs.Trigger key={tab} value={tab} className="relative z-10 px-4 py-1.5 text-sm capitalize">
          {tab}
        </Tabs.Trigger>
      ))}
      <motion.div
        className="absolute inset-y-1 rounded-md bg-white shadow-sm"
        layoutId="tabPill"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          width: `calc(${100 / tabs.length}% - 8px)`,
          left: `calc(${(tabs.indexOf(activeTab) * 100) / tabs.length}% + 4px)`,
        }}
      />
    </Tabs.List>
  )
}
```

## Accordion

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Accordion from "@radix-ui/react-accordion"

export function AnimatedAccordion() {
  const [value, setValue] = useState<string[]>([])

  return (
    <Accordion.Root type="multiple" value={value} onValueChange={setValue}>
      <Accordion.Item value="item-1" className="border-b">
        <Accordion.Trigger asChild>
          <motion.button
            className="flex w-full items-center justify-between py-3 text-left"
            whileTap={{ scale: 0.99 }}
          >
            <span>Is it accessible?</span>
            <motion.span
              animate={{ rotate: value.includes("item-1") ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              v
            </motion.span>
          </motion.button>
        </Accordion.Trigger>
        <AnimatePresence initial={false}>
          {value.includes("item-1") && (
            <Accordion.Content asChild forceMount>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pb-3 text-gray-600">
                  Yes. It adheres to the WAI-ARIA design pattern.
                </div>
              </motion.div>
            </Accordion.Content>
          )}
        </AnimatePresence>
      </Accordion.Item>
    </Accordion.Root>
  )
}
```

### Single type Accordion

For `type="single"`, the state is a string instead of an array:

```tsx
const [value, setValue] = useState("")
// Check: value === "item-1" instead of value.includes("item-1")
```

## Select

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Select from "@radix-ui/react-select"

export function AnimatedSelect() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)

  return (
    <Select.Root value={value} onValueChange={setValue} open={open} onOpenChange={setOpen}>
      <Select.Trigger asChild>
        <button className="flex items-center justify-between gap-2 rounded border px-3 py-2">
          <Select.Value placeholder="Select an option" />
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            v
          </motion.span>
        </button>
      </Select.Trigger>
      <AnimatePresence>
        {open && (
          <Select.Portal forceMount>
            <Select.Content asChild position="popper" sideOffset={4}>
              <motion.div
                className="min-w-[200px] rounded-lg bg-white p-1 shadow-lg"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Select.Viewport>
                  {["Apple", "Banana", "Cherry"].map((item) => (
                    <Select.Item key={item} value={item.toLowerCase()} asChild>
                      <motion.div
                        className="cursor-pointer rounded px-2 py-1.5 text-sm outline-none hover:bg-gray-100"
                        whileHover={{ x: 2 }}
                      >
                        <Select.ItemText>{item}</Select.ItemText>
                      </motion.div>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </motion.div>
            </Select.Content>
          </Select.Portal>
        )}
      </AnimatePresence>
    </Select.Root>
  )
}
```

## Collapsible

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Collapsible from "@radix-ui/react-collapsible"

export function AnimatedCollapsible() {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <motion.button
          className="flex items-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }}>▶</motion.span>
          Toggle
        </motion.button>
      </Collapsible.Trigger>
      <AnimatePresence initial={false}>
        {open && (
          <Collapsible.Content asChild forceMount>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="py-2">Collapsible content</div>
            </motion.div>
          </Collapsible.Content>
        )}
      </AnimatePresence>
    </Collapsible.Root>
  )
}
```

## Checkbox

```tsx
import { motion } from "motion/react"
import * as Checkbox from "@radix-ui/react-checkbox"

export function AnimatedCheckbox() {
  return (
    <Checkbox.Root asChild>
      <motion.button
        className="flex h-5 w-5 items-center justify-center rounded border"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        <Checkbox.Indicator asChild>
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.svg>
        </Checkbox.Indicator>
      </motion.button>
    </Checkbox.Root>
  )
}
```

## Switch

```tsx
import { motion } from "motion/react"
import * as Switch from "@radix-ui/react-switch"

export function AnimatedSwitch() {
  return (
    <Switch.Root asChild>
      <motion.button
        className="relative h-6 w-11 rounded-full bg-gray-300 data-[state=checked]:bg-blue-500"
        whileTap={{ scale: 0.95 }}
      >
        <Switch.Thumb asChild>
          <motion.span
            className="block h-5 w-5 rounded-full bg-white shadow-sm"
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              translateX: "var(--radix-switch-thumb-translate-x)",
            }}
          />
        </Switch.Thumb>
      </motion.button>
    </Switch.Root>
  )
}
```

## Slider

```tsx
import { motion } from "motion/react"
import * as Slider from "@radix-ui/react-slider"

export function AnimatedSlider() {
  return (
    <Slider.Root defaultValue={[50]} max={100} step={1} className="relative flex h-5 w-64 touch-none items-center">
      <Slider.Track className="relative h-1.5 w-full rounded-full bg-gray-200">
        <Slider.Range className="absolute h-full rounded-full bg-blue-500" />
      </Slider.Track>
      <Slider.Thumb asChild>
        <motion.button
          className="block h-5 w-5 rounded-full bg-white shadow-md"
          whileHover={{ scale: 1.2 }}
          whileDrag={{ scale: 1.1 }}
        />
      </Slider.Thumb>
    </Slider.Root>
  )
}
```

## RadioGroup

```tsx
import { motion } from "motion/react"
import * as RadioGroup from "@radix-ui/react-radio-group"

export function AnimatedRadioGroup() {
  return (
    <RadioGroup.Root defaultValue="one" className="flex flex-col gap-2">
      {["one", "two", "three"].map((value) => (
        <label key={value} className="flex items-center gap-2">
          <RadioGroup.Item value={value} asChild>
            <motion.button
              className="relative flex h-5 w-5 items-center justify-center rounded-full border"
              whileTap={{ scale: 0.9 }}
            >
              <RadioGroup.Indicator asChild forceMount>
                <motion.div
                  className="h-2.5 w-2.5 rounded-full bg-blue-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </RadioGroup.Indicator>
            </motion.button>
          </RadioGroup.Item>
          <span className="capitalize">{value}</span>
        </label>
      ))}
    </RadioGroup.Root>
  )
}
```

## Toggle / ToggleGroup

```tsx
import { motion } from "motion/react"
import * as Toggle from "@radix-ui/react-toggle"

export function AnimatedToggle() {
  return (
    <Toggle.Root asChild>
      <motion.button
        className="rounded px-3 py-1.5 text-sm data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        Bold
      </motion.button>
    </Toggle.Root>
  )
}
```

## Progress

```tsx
import { motion } from "motion/react"
import * as Progress from "@radix-ui/react-progress"

export function AnimatedProgress({ value }: { value: number }) {
  return (
    <Progress.Root value={value} className="relative h-2 w-64 overflow-hidden rounded-full bg-gray-200">
      <Progress.Indicator asChild>
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </Progress.Indicator>
    </Progress.Root>
  )
}
```

## NavigationMenu

```tsx
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"

export function AnimatedNavigationMenu() {
  const [value, setValue] = useState("")

  return (
    <NavigationMenu.Root value={value} onValueChange={setValue}>
      <NavigationMenu.List className="flex gap-1">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger asChild>
            <motion.button className="px-3 py-2" whileHover={{ y: -1 }}>
              Products
            </motion.button>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content asChild>
            <motion.div
              className="absolute mt-2 rounded-lg bg-white p-4 shadow-lg"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <a href="#">Product 1</a>
              <a href="#">Product 2</a>
            </motion.div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport asChild>
        <motion.div layout className="absolute" />
      </NavigationMenu.Viewport>
    </NavigationMenu.Root>
  )
}
```

## Menubar

Identical pattern to NavigationMenu for each menu item. Use `AnimatePresence` per submenu with state hoisting.

## ScrollArea

ScrollArea is mainly for custom scrollbars. Minimal animation needed:

```tsx
import { motion } from "motion/react"
import * as ScrollArea from "@radix-ui/react-scroll-area"

export function AnimatedScrollArea() {
  return (
    <ScrollArea.Root className="h-64 w-64 overflow-hidden rounded border">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="p-4">Long content here...</div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" className="w-2">
        <ScrollArea.Thumb asChild>
          <motion.div
            className="rounded-full bg-gray-400"
            whileHover={{ backgroundColor: "#6b7280" }}
          />
        </ScrollArea.Thumb>
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
```
