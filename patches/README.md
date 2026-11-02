# Patches (patch-package, applied on `postinstall`)

## expo-modules-jsi+58.0.21

`withEncodedValue` in `JavaScriptObject.swift` captures a raw pointer as a
`nonisolated(unsafe) let` inside a `JavaScriptActor.assumeIsolated` closure.
The Xcode 26.2 toolchain (Swift 6.2) rejects that: *sending 'slot' risks
causing data races* — the iOS build fails. The patch boxes the pointer in the
package's own `UncheckedSendable` helper, which upstream already uses for the
same case elsewhere; behaviour is unchanged (the closure runs synchronously
on the same thread).

The version is pinned via `overrides` in package.json so the patch always
matches. Remove both once an expo-modules-jsi release builds on Xcode 26.2
without it (check the CHANGELOG for `withEncodedValue` / `sending`).
