---
paths:
  - 'resources/js/**'
  - 'resources/css/**'
---

# Js

## Rebuild assets after UI changes
After making any UI change (components, pages, styles, or anything under `resources/js` / `resources/css`), always clear caches and rebuild assets so the change is active immediately:

```bash
vendor/bin/sail artisan optimize:clear
vendor/bin/sail npm run build
```

## docs/design-system is a frozen reference — do not consult or update it
The `docs/design-system/` directory is a standalone static styleguide used during initial porting. It has no runtime connection to the app. It is now frozen. For all UI work, the source of truth is the React component in `resources/js/`. Never consult, edit, or regenerate files under `docs/design-system/` as part of a UI task — go straight to the component files.
