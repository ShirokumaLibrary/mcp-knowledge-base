---
description: Visual-driven development from mockups or screenshots
argument-hint: "'component description' | from-image <path>"
allowed-tools: Read, Write, Edit, MultiEdit, TodoWrite
---

# /kuma:vibe:visual - Visual-Driven Development

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Implements UI components and layouts from visual references like mockups, screenshots, or design specifications. Iterates until visual match is achieved.

## Usage

```bash
/kuma:vibe:visual "create login form"           # From description
/kuma:vibe:visual from-image ./mockup.png      # From image
/kuma:vibe:visual iterate ./screenshot.png     # Iterate on existing
```

## Visual Development Process

### 1. Visual Analysis
- Parse visual requirements
- Identify components needed
- Detect design patterns

### 2. Component Generation
- Create HTML structure
- Add CSS styling
- Implement interactions

### 3. Screenshot Comparison
- Take screenshot of implementation
- Compare with target
- Identify differences

### 4. Iteration
- Adjust styling
- Fix layout issues
- Refine details

### 5. Finalization
- Optimize code
- Add responsiveness
- Ensure accessibility

## Component Patterns

### HTML Structure (Framework Agnostic)
```html
<!-- Generated structure from visual -->
<div class="login-container">
  <form class="login-form">
    <h2 class="login-title">Sign In</h2>
    
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        class="form-input"
        placeholder="Enter your email"
      />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        class="form-input"
        placeholder="Enter your password"
      />
    </div>
    
    <button type="submit" class="submit-button">
      Sign In
    </button>
  </form>
</div>
```

### Styling
```css
/* Extracted from visual */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-button:hover {
  background: #5a67d8;
}
```

## Design System Integration

### Framework Adaptation
The generated HTML/CSS can be adapted to any framework:

- **React/Vue/Angular**: Convert to components
- **Web Components**: Create custom elements
- **Server-side**: Use with template engines
- **Static Sites**: Direct HTML usage

### Using Existing Design Systems
```html
<!-- Example: Adapt to existing component library -->
<!-- Bootstrap -->
<div class="card">
  <div class="card-body">
    <h2 class="card-title">Sign In</h2>
    <form>
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email">
      </div>
      <button type="submit" class="btn btn-primary w-100">Sign In</button>
    </form>
  </div>
</div>

<!-- Material Design -->
<md-card>
  <md-card-content>
    <h2>Sign In</h2>
    <md-text-field label="Email" type="email"></md-text-field>
    <md-filled-button>Sign In</md-filled-button>
  </md-card-content>
</md-card>
```

## Responsive Design

### Automatic Breakpoints
```css
/* Mobile-first approach */
.component {
  /* Mobile styles */
  padding: 1rem;
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 2rem;
  }
}
```

## Accessibility

### WCAG Compliance
```html
<!-- Automatic accessibility features -->
<button
  aria-label="Sign in to your account"
  role="button"
  tabindex="0"
>
  Sign In
</button>

<input
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
  type="email"
/>

<div id="email-error" role="alert" aria-live="polite">
  <!-- Error messages appear here -->
</div>
```

## Iteration Workflow

```markdown
## Visual Iteration Checklist
- [ ] Layout matches mockup
- [ ] Colors are accurate
- [ ] Typography is correct
- [ ] Spacing is consistent
- [ ] Interactions work
- [ ] Responsive on all sizes
- [ ] Accessible (WCAG AA)
```

## Best Practices

1. **Component Reusability**: Create reusable components
2. **Design Tokens**: Use consistent values
3. **Semantic HTML**: Proper element usage
4. **CSS Organization**: BEM or CSS Modules
5. **Performance**: Optimize images and animations

## Integration

### With Design Tools
- Figma specifications
- Sketch mockups
- Adobe XD prototypes
- InVision designs
- Zeplin handoffs

### Output Formats
- **HTML/CSS**: Universal structure and styling
- **Component Code**: Framework-specific components
- **Design Tokens**: Variable definitions
- **Documentation**: Component usage guides