---
name: Config-driven architecture preference
description: User wants all tuneable values in central config files, not scattered across the codebase
type: feedback
---

User explicitly asked for a central config.js on both server and client so that changing a model, rate limit, token expiry, or any tuneable value means editing one file only.

**Why:** "If I want to change anything I should be changing it at one place instead of finding it all over the project."

**How to apply:** Never hardcode model IDs, rate limits, token expiry, pagination sizes, or UI dimensions inline. Always reference config.js. When adding new configurable values, add them to config.js first.
