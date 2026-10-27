# crudandlogic.com

A vertical, illustrated concept guide for IT professionals who use app builders. Hosted on GitHub Pages from the root of `main`; no build step.

## Edit

- `index.html`: narrative, diagrams, glossary and roadmap.
- `assets/css/site.css`: responsive visual system and CSS animations.
- `assets/js/site.js`: pipeline walkthrough, motion controls and hero particles.
- `assets/img/pipeline-world.webp`: generated cinematic hero artwork.

The opening combines generated artwork with live canvas gates and individual flowing documents. Foreground gate frames occlude the sheets as they pass. The explanatory diagrams use real text and HTML/SVG. Concept panels translate and brighten in response to scroll position; they remain readable throughout. The global motion control freezes the hero and shows panels in their final position; OS reduced-motion preferences are respected. Selecting a pipeline step pauses its automatic playback. No JavaScript leaves a static, readable page.

## Check and preview

Run `python tests/check_site.py` and `node --check assets/js/site.js`. Preview with `python -m http.server 5198 --bind 127.0.0.1`.

## Publish

Push `main` to `https://github.com/shawnklewis/crudandlogic.com.git`. GitHub Pages uses the root of `main` and the `CNAME` file for `crudandlogic.com`. No hosting provider or DNS migration is needed.

## Editorial boundaries

The concept is sourced from 18 archived project discussions and the October 2026 design and continuation notes. Distinguish the implemented UI prototype, the planned runtime and exploratory ideas. Never publish private business records, names, infrastructure addresses or private repository links. Keep production-data screenshots and demo packages out of this repository.

First edition: October 27, 2026. See `docs/superpowers/specs/2026-10-27-architecture-story-design.md` for this pass's brief. Discord links retain the `DISCORD_INVITE` comment marker.
