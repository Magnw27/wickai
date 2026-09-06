# WickAI Design Context

## Product
WickAI is a focused AI chat workspace. The primary job is to let a user start a conversation, choose a model, read a streaming response, and continue without visual or interaction friction.

## Visual direction

- Dark, solid-surface workspace; no glassmorphism and no ambient wallpaper gradients.
- Quiet graphite palette with cool near-white controls and restrained borders.
- DM Sans is the primary interface typeface; monospace is reserved for code.
- Content hierarchy follows the conversation, not decorative chrome.
- User messages are compact right-aligned bubbles. Assistant messages are content-first and do not show visible role labels.
- Motion is tactile and short: hover lift, press compression, menu pop, message reveal, and modal entry.

## Runtime tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--wk-bg` | `#0b0d10` | Application background |
| `--wk-panel` | `#111419` | Primary panel surface |
| `--wk-panel-2` | `#171b21` | Secondary surface |
| `--wk-panel-3` | `#1d2229` | Active/raised surface |
| `--wk-line` | `#292f37` | Default border |
| `--wk-line-2` | `#363d47` | Hover/strong border |
| `--wk-text` | `#f4f6f8` | Primary text |
| `--wk-muted` | `#8b939f` | Secondary text |
| `--wk-dim` | `#626a75` | Tertiary text |

Runtime values live in `app/wick.css`. Durable visual decisions belong here first and should be updated together with runtime tokens when the system changes.

## Interaction contract

- Every actionable button has hover, press, focus-visible, and disabled/busy behavior.
- Press feedback uses a small scale-down rather than large motion.
- Menus and modals enter with short, restrained motion and do not move surrounding layout.
- The model selector is an app-owned button/listbox, never a browser-native `<select>`.
- Streaming keeps the viewport pinned only while the reader is already near the bottom. Manual scrolling upward pauses auto-follow until the user returns to the bottom.
- Auto-follow uses `ResizeObserver` plus `requestAnimationFrame` and instant scroll during streaming to avoid a queue of overlapping smooth-scroll animations.
- UI message updates are throttled to 50ms through the AI SDK React hook to reduce render pressure while preserving responsive streaming.
- User and assistant role labels are not rendered in the conversation body.
- Reduced-motion preferences disable non-essential transforms, transitions, and animations.

## Responsive rules

- Desktop navigation is a fixed left rail; mobile navigation becomes an opaque drawer with an opaque backdrop.
- The conversation remains content-first at narrow widths.
- Composer geometry stays stable while streaming and when text grows.
- Model selector remains keyboard reachable and constrained to the viewport on small screens.

## Signature

The signature interaction is **quiet tactile feedback**: every command acknowledges the click with a subtle physical response while the rest of the interface stays visually calm.
