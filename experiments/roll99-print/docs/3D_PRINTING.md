# ROLL//99: 3D printing guide

## Files for your dad

- `3d/models/ROLL99_PAIR_plate.3mf`: both dice laid out together on one build plate in a generic, Bambu Studio-importable 3MF container. Check printer, nozzle, filament and slicing settings in Bambu Studio; this is **not** a printer-calibrated Bambu preset.
- `3d/models/ROLL99_TENS_PRINT_ORIENTED.stl`: first die, all faces engraved 0–9, with an `X10` identifier. Already arranged with one flat kite face on Z=0.
- `3d/models/ROLL99_ONES_PRINT_ORIENTED.stl`: second die, all faces engraved 0–9, with an `X1` identifier. Also oriented flat on the virtual build plate.
- `3d/source/ROLL99_d10.scad`: editable parameterized OpenSCAD model (use the `role` variable).
- `3d/source/generate_d10.py`: generates the OpenSCAD model with analytic faces and outward-oriented engraving transforms.
- `3d/source/orient_for_bed.py`: converts the upright geometry into print-oriented files.

The raw unrotated STLs are included too, if you want to adjust orientation yourself.

## Print process (Bambu Studio)

1. Open Bambu Studio and import `ROLL99_PAIR_plate.3mf` for both arranged dice, or import **both** `PRINT_ORIENTED.stl` files. They are already oriented with a face downward. Generic 3MF object colors may require manual assignment to AMS slots.
2. Select your dad's **specific Bambu printer and nozzle profile** (we haven't confirmed the model yet). Start with a regular 0.4 mm nozzle and PLA, ideally matte neon cyan for the tens die and hot pink/magenta for the ones die. Use independent plates or the AMS for two color jobs.
3. For a first trial: layer height **0.12–0.16 mm**, at least **3 walls**, and **100% infill** for consistent solid density. The die is small, so full infill is a sensible baseline. Use a **brim** if adhesion is poor. Let Bambu Studio assess whether any local overhangs need support.
4. **Slice and inspect** text cavities and overhang previews before printing. The main digits are recessed approximately **0.72 mm**; small `X10`/`X1` marks use a shallower cut. For crisp marks, slow external walls and use a fine layer height.
5. Remove the print and deburr any elephant's foot or support scars before assessing its roll. Fill the recessed characters with contrasting acrylic paint or paint pen if desired, wiping the surface clean. A quick manual tumble test is worth doing before committing to an elaborate multi-color run.

**Important:** The models are designed to be *geometrically* symmetric, but home-printed dice are not certified for casino-style fairness. The engraving, slicer settings, first-layer artifacts, and filament composition can add small biases. They are ideal for PAO drills, not for high-stakes wagering.

## Geometry details

- Shape: **pentagonal trapezohedron**, 10 congruent kite faces (not a rounded 10-gon extruded as a cylinder).
- Every face has a numeral 0–9. Each die has a tiny `X10` or `X1` role label so you can tell them apart even in monochrome.
- Opposite faces have complementary labels adding to 9.
- Body envelope before printing orientation: about **28.5 × 27.2 × 28.7 mm** (depending on the viewed axes). The print-oriented bounding box is approximately **20.0 × 28.2 × 19.4 mm**.
- A 0.38 mm Minkowski softening helps blunt extremely sharp plastic corners.
- OpenSCAD and analytic vertex geometry are editable. Regenerate both STLs after changing source parameters.
- The delivered STLs were checked to be **watertight**, have consistent outward winding, and contain a single connected closed mesh.

## Future physical variants

`OBSIDIAN` (smoke-gray matte + painted phosphor numbers), `AFTERBURN` (cyan/pink pair), and `ARCADE RELIC` (amber resin-like aesthetic) can all reuse the exact geometry. A bigger collector's edition could use magnetic storage, custom cases, inlaid numerals, and NFC tags linking to the digital app, but those are not modeled in v0.1.