# ROLL//99 cross-surface experiments

These are preexisting ROLL//99 native and fabrication source experiments brought under version control so that future sessions can evolve them beside the web Memory Lab. They are **not production releases**.

## Native SwiftUI

- `roll99-native/apps/Packages/RollKit/Sources/RollCore/RollCore.swift`: framework-independent Swift engine (d6, d10, d20, 00–99) with `PercentileResult.wireEvent` matching the *web* RollKit event (`id`, `kind`, `tens`, `ones`, `value`, `display`, `source`, `occurredAt`). Legacy `event` is retained for compatibility.
- `RollUI`, `Apps/iOS`, and `Apps/Watch`: SwiftUI native prototypes and skins. iOS/watchOS app targets are **not** built or tested against Apple SDKs; use Xcode and a device/simulator for acceptance.
- **Tested:** `swift test -j 2 --package-path experiments/roll99-native/apps/Packages/RollKit` on Linux Swift 6.2.1, 5 passing core tests. SwiftUI targets are conditionally compiled and not validated by this run.
- To generate an Xcode project on macOS, see `roll99-native/apps/README.md` and `project.yml` (XcodeGen).

## 3D printable d10 geometry

- `roll99-print/3d/source/ROLL99_d10.scad`: editable parametric symmetric die with recessed 0–9 numerals and X10/X1 labels.
- `generate_d10.py` and `orient_for_bed.py`: initial fabrication scripts.
- `roll99-print/docs/3D_PRINTING.md`: Bambu Lab print guidance.
- STL/3MF release files remain separate user artifacts; they are not included in this source-only PR. No physical roll-balance study or Bambu test print is claimed.

## Promotion gates

1. Verify the Swift wire format round-trips as expected through a real iOS/watchOS/web transport and use stable host-neutral IDs.
2. Build and launch both Apple targets and evaluate reduced-motion, Watch sizing, haptic timing, and offline execution.
3. Verify OpenSCAD geometry/STLs, printer slicer, orientation and numerals, then print and assess potential balance bias.
4. Integrate from the released RollKit package only after the second host proves the cross-app contract.

No private Notion PAO roster is included here.