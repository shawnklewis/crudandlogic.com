# Architecture Story Implementation Plan

**Goal:** Publish an illustrated vertical explanation for IT app builders.
**Spec:** ../specs/2026-10-27-architecture-story-design.md
**Architecture:** Existing static HTML/CSS/JS on GitHub Pages. No build dependency. Generated hero artwork lives in assets/img; explanatory diagrams remain accessible HTML.

1. Replace index.html with the complete concept narrative, section navigation, interactive pipeline and clearly labeled roadmap/deeper notes. Preserve domain, contact and Discord.
2. Replace assets/css/site.css; add assets/js/site.js. Responsive panels, cinematic hero, SVG connectors, pipeline document animation, on-screen step detail, persistent motion toggle. Reduced motion and JS failure must leave all explanations readable.
3. Add hero image locally. Update 404 theme, metadata and README. Adapt old copy-preservation tests to the new brief, retaining link/heading/file checks. Verify motion and pipeline interactions in browser at desktop and phone sizes.
4. Review for unsupported capability claims, customer information, inaccessible controls and clipped diagrams. Commit, fast-forward main, push to the verified GitHub repository and confirm Pages publication.

Review focus: motion preference changes; keyboard controls; narrow screens; JS unavailable; planned AI confused with an implemented capability.

Execution: owner explicitly requests a publishable first iteration and multiple passes. Proceed directly; no extra approval gate for this pass.
