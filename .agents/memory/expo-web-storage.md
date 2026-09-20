---
name: Expo web storage
description: Cross-platform session storage behavior for the SafeTest Expo app.
---

Use SecureStore for iOS and Android session material, but guard SecureStore calls on web and use an AsyncStorage fallback. The Expo web preview can load the SecureStore package while not exposing the native async methods.

**Why:** The first preview crashed at startup when the web runtime called SecureStore's native async getter.

**How to apply:** Any new session, biometric, or local-secret helper must branch on `Platform.OS === "web"` before invoking SecureStore.