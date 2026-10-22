# ROLL//99 | iPhone + Apple Watch source

A native SwiftUI starter powered by one self-contained Swift Package: `Packages/RollKit`.

## Start on a Mac

1. Install Xcode 15+ and its watchOS simulator runtime. Open Terminal in this `apps` directory.
2. Install [XcodeGen](https://github.com/yonaskolb/XcodeGen) using `brew install xcodegen`.
3. Run `xcodegen generate`, then `open ROLL99.xcodeproj`.
4. In Xcode select **ROLL99iOS** or **ROLL99Watch** scheme, choose a compatible iPhone or Watch simulator, and press Run.
5. For actual devices, replace example bundle identifiers and select your Apple Development signing team.

Note: macOS/Xcode is necessary to compile and run Apple targets. This source has not been built on an Apple SDK in this environment. `RollCore` tests have been executed on Linux with Swift 6.2.1 (5 passed). iOS/watchOS UI remains uncompiled without Apple SDKs.

## How to embed elsewhere

Add `Packages/RollKit` as a local Swift Package dependency to an existing project, and link `RollCore` and `RollUI`. Then:

```swift
import RollCore
import RollUI

Roll99Panel(skin: DiceSkin.presets[0]) { result in
    // Values are reliable: result.tens, result.ones, result.display ("00"..."99")
    memoryStation.send(result.event)
    memoryStation.openNode(result.memoryNodeID)
}
```

That `memoryStation` is a placeholder for YOUR host application's actual event bus/navigation layer. Nothing is automatically patched into a repo by this prototype.

### Reusable mechanics

```swift
let engine = RollEngine()
let percentile = engine.percentile()                  // 00...99
let tabletop = engine.roll([.d6, .d20, .d10])      // Arbitrary combinations
```

## Architecture

- `RollCore`: pure Swift, testable, no UI or host-project imports.
- `RollUI`: reusable configurable roll panel, facet dice illustration, animation, skin tokens.
- `Apps/iOS`: standalone phone shell, saved skin selection, PAO practice prompt.
- `Apps/Watch`: independent small-screen app and haptic feedback.
- `docs/MEMORIZATION_STATION_INTEGRATION.md`: drop-in adapter contract.

Results are generated *before* the visual spin. The animation cannot bias probability. Face labels and the percentile result are separate from generic dice roll support.

### Portable RollKit wire event

Use `result.wireEvent` when crossing into the web RollKit event contract. It includes
`id`, `kind`, `tens`, `ones`, `value`, `display`, `source`, and ISO-8601 `occurredAt`.
The original `result.event` is retained for compatibility. UI integrations should
publish a wire event through their host's bridge, not assume that an Apple Watch
can directly dispatch a browser DOM event.