# Homepage Vision for Daybook

## Overall Philosophy
The homepage should feel like a natural extension of the product itself - using the same typography, visual language, and minimal aesthetic. It should communicate "keyboard-first productivity" not just through words, but through the design itself.

## Layout Structure

### Hero Section (Above Fold)
```
┌─────────────────────────────────────────────────────────┐
│  [Nav: Daybook]                    [About] [Blog]       │
│                                                          │
│                                                          │
│                    Daybook                               │
│         Plan your day in plain text                      │
│                                                          │
│              [⌘K to get started]                         │
│                                                          │
│         Already have an account? Sign in                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Replace "Fast, keyboard-first productivity" with "Plan your day in plain text"
  - More concrete, speaks to the actual use case
  - "Plain text" hints at the keyboard-first nature without being abstract

- Primary CTA becomes `⌘K to get started` styled like a keyboard shortcut
  - Immediately communicates keyboard-first
  - Interactive - clicking it could open a command palette demo or sign-up flow
  - Visual interest without clutter

- Typography:
  - "Daybook" title: Lora serif, large (text-6xl)
  - "Plan your day in plain text": Lora serif, medium (text-xl)
  - Keyboard shortcut: Mono font in a subtle border/background
  - "Already have an account? Sign in": Smaller, gray, mono font

### Feature Trio (Second Section)
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   Timeline            Inventory           Command       │
│                                                          │
│   Schedule deep       Track goals,        Type, don't   │
│   work blocks.        projects, and       click. Every  │
│   Time-block your     routines in one     action is a   │
│   day with visual     organized view.     keystroke     │
│   clarity.            Review weekly.      away.         │
│                                                          │
│   [small screenshot]  [small screenshot]  [⌘K graphic]  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Three columns showing the three core concepts
- Each has a 2-3 line description in Lora serif
- Small screenshots or graphics below (actual product visuals)
- Mono font for headings (Timeline, Inventory, Command)

### Visual Product Demo (Third Section)
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              Your day, your way                          │
│                                                          │
│     [Large screenshot of Timeline view with:             │
│      - Morning deep work block                           │
│      - Scheduled tasks                                   │
│      - Chat modal visible with AI interaction]           │
│                                                          │
│              Everything surfaces when you need it        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Full-width screenshot showing actual product
- Shows the timeline with deep work blocks
- Shows chat modal integration (AI aspect)
- Caption in Lora serif emphasizing contextual nature

### Keyboard Shortcuts Showcase (Fourth Section)
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│           Built for speed                                │
│                                                          │
│     ⌘K          Open command palette                     │
│     N           New task                                 │
│     /           Search anywhere                          │
│     ⌘Enter      Deep work block                          │
│     ?           Show all shortcuts                       │
│                                                          │
│           No credit card required • Free to start        │
│                                                          │
│              [Get started] [Sign in]                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Showcase keyboard shortcuts as product feature
- Each shortcut shown in mono font with key visual (⌘K, N, etc.)
- Descriptions in Lora serif
- Reinforces "keyboard-first" promise
- CTAs at bottom after they understand the product

## Typography System

**Headings:**
- Main hero title: Lora serif, text-6xl or text-7xl
- Section headings: Inter mono, text-sm uppercase tracking-wide
- Feature headings: Inter mono, text-base

**Body Text:**
- All descriptions: Lora serif, text-lg
- All metadata: Inter mono, text-sm

**Interactive Elements:**
- Keyboard shortcuts: Inter mono, border, subtle background
- Links: Underline on hover, Lora serif
- Buttons: Mono font, minimal borders

## Color Palette
- Background: White or very light gray (bg-gray-50)
- Text: Dark gray (text-gray-900 for headers, text-gray-700 for body)
- Accents: Minimal - perhaps subtle border for keyboard shortcuts
- Screenshots: Full color showing actual product

## Unique Touches

1. **Command Palette Easter Egg**: The `⌘K to get started` button could actually trigger a demo command palette that shows example commands, then leads to sign-up

2. **Animated Typing**: The tagline or a demo section could show text being typed out, emphasizing the "plain text" nature

3. **Context Awareness**: Could show different examples based on time of day:
   - Morning: "Good morning. Ready to plan your day?"
   - Afternoon: "Back to review your progress?"
   - Evening: "Time to wrap up and plan tomorrow?"

4. **No Stock Photos**: Only actual product screenshots. No generic productivity imagery.

## Key Differentiators from Current Design

| Current | Vision |
|---------|--------|
| Generic SaaS feel | Product-specific aesthetic |
| No product visuals | Multiple screenshots |
| Abstract tagline | Concrete value prop |
| Standard auth buttons | Keyboard shortcut CTA |
| No feature explanation | Clear feature breakdown |
| Generic typography | Matches app typography |
| Tells keyboard-first | Shows keyboard-first |

## Implementation Notes

- Should use same Tailwind classes as the rest of the app
- Should load Lora and Inter fonts just like inventory/timeline
- Screenshots should be actual product (can be staged with good data)
- Responsive design: stack vertically on mobile
- Keyboard shortcut visuals could be reusable components (also useful in-app for help/tooltips)

## Tone

The copy should be:
- **Confident but not boastful**: "Plan your day in plain text" not "Revolutionary productivity"
- **Concrete not abstract**: "Schedule deep work blocks" not "Maximize productivity"
- **Inviting not pushy**: "⌘K to get started" not "SIGN UP NOW"
- **Clear not clever**: Direct language about what it does

## Bottom Line

The homepage should make someone think: "Oh, this is different. I can see exactly what I'd be using and how I'd use it." It should feel like looking through a window into the product, not like a sales page.
