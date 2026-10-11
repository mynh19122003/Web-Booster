# Avatar crop implementation and review

The requirements from `gemini-code-1791631672726.md` are integrated into the employee coach editor.

## Implementation steps

1. `components/ProfileAvatarSection.tsx` opens the picker from the photo or upload button. It accepts PNG, JPEG and WebP up to 5 MB, reports errors with `role="alert"`, and opens the crop modal using a temporary object URL.
2. `components/AvatarCropModal.tsx` uses `react-easy-crop` with a 1:1 circular mask, mouse and library touch gesture support, keyboard panning, and 1–3× zoom in 0.05 increments. It includes zoom buttons, focus containment, Escape cancellation, focus restoration, scroll locking, reduced-motion-aware fade transitions, and localized labels.
3. `utils/cropImage.ts` validates natural-image pixel coordinates, draws the crop to Canvas, exports a JPEG at quality 0.92, and caps its longest side at 512 pixels. The displayed circular mask is applied by avatar styling; the uploaded image is square so it works in all existing avatar components.
4. The section passes the exported `File` to the coach editor. The editor appends it to `FormData` and posts to the existing protected avatar endpoint. Selection alone does not upload. Confirmation saves the crop and retains existing avatar update events for profile and dashboard synchronization.
5. Raw and preview object URLs are revoked when replaced, canceled, saved or unmounted. Failed uploads leave the editor open for retry. Other unsaved profile fields are preserved.

## Review and verification

- Strict TypeScript build and targeted ESLint checks pass.
- The modal portal has an explicit client hydration guard, so the reusable component never reads `document.body` during server rendering.
- 29 automated tests pass, including pixel mapping, output resolution and type, invalid coordinates, image decode failure, upload type/size validation, ownership checks and existing Riot/profile regressions.
- Browser QA uses a separate SQLite database and disposable employee. Real coach data is unchanged.
- Verified picker activation from both the upload button and the avatar, oversized image rejection, SVG rejection, cancel/reset behavior, keyboard panning, mouse dragging, zoom bounds, export/upload, immediate coach header update, and preservation of unsaved form fields.
- Tested desktop at 1280×800 and mobile layout at 390×844; the dialog fits without horizontal overflow. Physical touchscreen swipe and pinch gestures were not exercised; those handlers are supplied by `react-easy-crop`.
- Crop confirmation produces JPEG data on the server. Original uploaded files are not retained. Temporary preview URLs are owned by the section and released explicitly.

## Reuse

`ProfileAvatarSection` accepts `avatar`, `name`, `disabled`, `hasCustomPhoto`, and an asynchronous `onSave(File | null)` callback. Returning a rejected promise keeps the crop open and displays an error so the user can retry; `null` requests removal of the current custom photo.

Validation commands:

```text
node --test tests/avatar-crop.test.mjs tests/auth-riot.test.mjs
npm run build
npx eslint components/AvatarCropModal.tsx components/ProfileAvatarSection.tsx components/coaches/CoachProfileEditor.tsx utils/cropImage.ts app/api/employee/coaches/[slug]/avatar/route.ts tests/avatar-crop.test.mjs tests/auth-riot.test.mjs
```
