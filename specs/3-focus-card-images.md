# Feature: Focus card images

## What / Why

The About section's two focus cards ("Agentic AI & Multi-Agent Systems" and "Enterprise AI Architecture & Transformation") are currently text-only boxes. Two matching infographic images already exist in `src/public/` (`agentic-and-multi-agent-systems.png` and `enterprise-ai-architecture-and-transformation.png`) but aren't wired into the page. These cards are the site's clearest statement of what Kaloyan does, so giving each one a strong supporting visual — rather than leaving them as plain text — makes the About section read as a genuine showcase of his expertise instead of a placeholder, reinforcing the "AI Solution Architect who lives in the AI future" positioning the site is going for.

## Requirements

- The "Agentic AI & Multi-Agent Systems" focus card displays `agentic-and-multi-agent-systems.png`; the "Enterprise AI Architecture & Transformation" focus card displays `enterprise-ai-architecture-and-transformation.png`. Each image is paired only with its matching card — no cross-wiring.
- Each image is a real visual centerpiece of its card (comparable in visual weight to the heading, not a small decorative thumbnail), since both source images are dense infographics whose internal labels become illegible if shrunk too small. The image sits above the card's heading and description text, spans the full width of the card, and its area is bounded/cropped (e.g. via a fixed aspect ratio with `object-fit: cover`) so both cards stay visually uniform in height regardless of the two images' exact dimensions.
- Because each image's fine interior text won't be legible at in-card size, each image is presented as clickable, opening the original full-resolution PNG (the same file already in `src/public/`) in a new browser tab so a visitor can zoom in and read the detail. No custom lightbox/modal component is introduced — this uses a plain link to the image asset, keeping the feature within the site's no-build, no-added-JS-complexity constraints.
- The clickable image affordance is discoverable: it shows a visible hover state (e.g. subtle transform/overlay, per `DESIGN_SYSTEM.md` interaction-state rules — short transition, no shadow stacking) and a visible keyboard focus outline (`--color-accent`), signaling it's interactive rather than static decoration.
- Each image has descriptive `alt` text summarizing what the infographic conveys (not just repeating the card's heading), since the image's own internal text/labels are illegible at in-card size and won't otherwise be available to screen reader users or in a no-image context.
- Images use `loading="lazy"` (About is below the fold) and are otherwise unmodified/unprocessed source files — no new image variants, no build-time optimization step, consistent with the site's no-build-tooling rule.
- Card visual treatment (image + heading + text) stays within `DESIGN_SYSTEM.md` tokens — existing card border/radius/background/spacing rules are preserved or extended using existing tokens only; no new hardcoded colors, spacing, or radii.
- Layout stays responsive: at mobile widths (~360px) the two cards stack in a single column (as they already do) with each image scaling to the card's full width at its fixed aspect ratio; at the existing two-column breakpoint (`640px+`) both cards and images remain aligned and uniform in size.
- Scope is limited to wiring these two existing images into their two existing focus cards well. No other change to the About section's copy, structure, or the rest of the page.

## Acceptance criteria

- [ ] The "Agentic AI & Multi-Agent Systems" card displays `public/agentic-and-multi-agent-systems.png`; the "Enterprise AI Architecture & Transformation" card displays `public/enterprise-ai-architecture-and-transformation.png`.
- [ ] Each image appears above its card's heading/text, spans the card's full width, and both cards render at matching, uniform heights on desktop and tablet widths despite the images' differing native dimensions.
- [ ] Clicking/tapping either image opens that image's original PNG file in a new browser tab (`target="_blank"` with `rel="noopener noreferrer"`), with no custom modal/lightbox on the page.
- [ ] Hovering an image shows a visible interactive-state change (transition per `DESIGN_SYSTEM.md`, 150–200ms ease, no new shadow depth), and tabbing to the image link shows a visible `--color-accent` focus outline.
- [ ] Each image has non-generic, descriptive `alt` text describing what the diagram conveys, verifiable by inspecting the rendered HTML.
- [ ] Both images use `loading="lazy"`.
- [ ] No new custom colors, spacing values, or border-radius values are introduced outside `DESIGN_SYSTEM.md` tokens.
- [ ] Both cards remain legible and correctly stacked/sized with no overlap, distortion, or cut-off text at mobile (~360px), tablet, and desktop widths.
- [ ] No console errors on load; no new external network requests (images are the existing local PNG files only).
- [ ] The rest of the About section (bio paragraph, card headings/copy, other page sections) is unchanged.
