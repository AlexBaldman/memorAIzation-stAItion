#if canImport(SwiftUI)
import SwiftUI
import RollCore

public extension Color {
    init(rollHex: String) {
        let hex = rollHex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let v = UInt64(hex, radix: 16) ?? 0xFFFFFF
        self.init(.sRGB, red: Double((v >> 16) & 255) / 255,
                  green: Double((v >> 8) & 255) / 255,
                  blue: Double(v & 255) / 255, opacity: 1)
    }
}

/// One configurable surface for a standalone app, Watch, or host application.
/// Hosts receive the authoritative result through `onRoll` after the animation.
public struct Roll99Panel: View {
    public var skin: DiceSkin
    public var compact: Bool
    public var onRoll: ((PercentileResult) -> Void)?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayed: PercentileResult?
    @State private var pending: PercentileResult?
    @State private var spin = 0.0
    @State private var rolling = false
    @State private var history: [PercentileResult] = []

    public init(skin: DiceSkin = DiceSkin.presets[0], compact: Bool = false,
                onRoll: ((PercentileResult) -> Void)? = nil) {
        self.skin = skin; self.compact = compact; self.onRoll = onRoll
    }

    public var body: some View {
        VStack(spacing: compact ? 12 : 24) {
            HStack(spacing: compact ? 9 : 22) {
                FacetDie(digit: displayed.map { "\($0.tens)" } ?? "?",
                         caption: "TENS", color: Color(rollHex: skin.tensHex),
                         size: compact ? 72 : 142, spin: spin)
                FacetDie(digit: displayed.map { "\($0.ones)" } ?? "?",
                         caption: "ONES", color: Color(rollHex: skin.onesHex),
                         size: compact ? 72 : 142, spin: -spin)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(displayed.map { "Dice rolled \($0.display)" } ?? "Dice ready")

            VStack(spacing: 2) {
                Text("PERCENTILE OUTPUT")
                    .font(.system(size: compact ? 8 : 11, weight: .bold, design: .monospaced))
                    .tracking(compact ? 1 : 3)
                    .foregroundStyle(.white.opacity(0.45))
                Text(displayed?.display ?? "––")
                    .font(.system(size: compact ? 54 : 96, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .contentTransition(.numericText())
                    .shadow(color: Color(rollHex: skin.tensHex).opacity(0.45), radius: 20)
            }

            Button(action: roll) {
                HStack(spacing: 8) {
                    Image(systemName: "dice.fill")
                    Text(rolling ? "ROLLING" : "ROLL // 99")
                }
                .font(.system(size: compact ? 12 : 16, weight: .heavy, design: .monospaced))
                .tracking(1)
                .foregroundStyle(Color(rollHex: skin.backgroundHex))
                .frame(maxWidth: .infinity)
                .frame(height: compact ? 42 : 58)
                .background(Color(rollHex: skin.tensHex), in: RoundedRectangle(cornerRadius: compact ? 14 : 18))
                .shadow(color: Color(rollHex: skin.tensHex).opacity(0.28), radius: 19)
            }
            .buttonStyle(.plain)
            .disabled(rolling)
            .accessibilityHint("Generate a random number from zero zero through ninety nine")

            if !compact {
                VStack(alignment: .leading, spacing: 11) {
                    HStack {
                        Text("ROLL LOG")
                        Spacer()
                        Text("\(history.count) RECENT")
                    }
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .tracking(2)
                    .foregroundStyle(.white.opacity(0.4))
                    HStack(spacing: 9) {
                        ForEach(history.prefix(6)) { item in
                            Text(item.display)
                                .font(.system(size: 19, weight: .bold, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.8))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 9)
                                .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 10))
                        }
                        if history.isEmpty {
                            Text("YOUR FIRST ROLL IS WAITING")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.35))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
            }
        }
        .padding(compact ? 4 : 18)
        .frame(maxWidth: compact ? 240 : 540)
    }

    private func roll() {
        guard !rolling else { return }
        // Determine the result up-front. Animation never changes its probability.
        let result = RollEngine().percentile()
        pending = result
        rolling = true
        withAnimation(reduceMotion ? nil : .easeOut(duration: 0.85)) {
            spin += reduceMotion ? 0 : 1080 + Double(result.tens * 36)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + (reduceMotion ? 0.05 : 0.85)) {
            guard pending?.id == result.id else { return }
            withAnimation(.easeOut(duration: 0.12)) { displayed = result }
            history.insert(result, at: 0)
            history = Array(history.prefix(6))
            rolling = false
            pending = nil
            onRoll?(result)
        }
    }
}

private struct FacetDie: View {
    var digit: String
    var caption: String
    var color: Color
    var size: CGFloat
    var spin: Double

    var body: some View {
        ZStack {
            DieOutline()
                .fill(LinearGradient(colors: [color.opacity(0.35), Color(red: 0.07, green: 0.1, blue: 0.17), color.opacity(0.12)],
                                     startPoint: .topLeading, endPoint: .bottomTrailing))
            DieOutline()
                .stroke(color.opacity(0.92), lineWidth: 2)
            DieFacets()
                .stroke(color.opacity(0.30), lineWidth: 1)
            VStack(spacing: size < 100 ? 2 : 5) {
                Text(digit)
                    .font(.system(size: size * 0.43, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .shadow(color: color.opacity(0.9), radius: 12)
                Text(caption)
                    .font(.system(size: size * 0.073, weight: .heavy, design: .monospaced))
                    .tracking(1)
                    .foregroundStyle(color)
            }
        }
        .frame(width: size, height: size * 1.10)
        .rotation3DEffect(.degrees(spin), axis: (x: 0.9, y: 0.65, z: 0.2))
        .shadow(color: color.opacity(0.24), radius: 16)
    }
}

private struct DieOutline: Shape {
    func path(in r: CGRect) -> Path {
        let coords: [(CGFloat, CGFloat)] = [(0.5,0.015),(0.88,0.18),(0.98,0.48),(0.82,0.86),(0.5,0.99),(0.18,0.86),(0.02,0.48),(0.12,0.18)]
        var p = Path()
        for (i, pair) in coords.enumerated() {
            let q = CGPoint(x: r.minX + pair0.0 * r.width, y: r.minY + pair0.1 * r.height)
            if i == 0 { p.move(to: q) } else { p.addLine(to: q) }
        }
        p.closeSubpath()
        return p
    }
}

private struct DieFacets: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let mid = CGPoint(x: r.midX, y: r.midY)
        for (x, y) in [(0.5,0.015),(0.88,0.18),(0.98,0.48),(0.82,0.86),(0.5,0.99),(0.18,0.86),(0.02,0.48),(0.12,0.18)] {
            p.move(to: mid)
            p.addLine(to: CGPoint(x: r.minX + x * r.width, y: r.minY + y * r.height))
        }
        return p
    }
}
#endif