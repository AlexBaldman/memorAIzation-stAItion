import SwiftUI
import RollCore
import RollUI
#if canImport(UIKit)
import UIKit
#endif

@main
struct Roll99iOSApp: App {
    var body: some Scene {
        WindowGroup { Roll99Home() }
    }
}

struct Roll99Home: View {
    @AppStorage("roll99.selectedSkin") private var selectedSkin = "afterburn"
    @AppStorage("roll99.paoPrompt") private var paoPrompt = true
    @State private var lastRoll: PercentileResult?
    @State private var revealHint = false

    private var skin: DiceSkin {
        DiceSkin.presets.first { $0.id == selectedSkin } ?? DiceSkin.presets[0]
    }

    var body: some View {
        ZStack {
            Color(rollHex: skin.backgroundHex).ignoresSafeArea()
            GeometryReader { geo in
                Path { path in
                    let step: CGFloat = 28
                    for x in stride(from: CGFloat.zero, through: geo.size.width, by: step) {
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: geo.size.height))
                    }
                    for y in stride(from: CGFloat.zero, through: geo.size.height, by: step) {
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: geo.size.width, y: y))
                    }
                }
                .stroke(Color(rollHex: skin.tensHex).opacity(0.055), lineWidth: 0.5)
            }.ignoresSafeArea().allowsHitTesting(false)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 26) {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("ROLL//99")
                                .font(.system(size: 34, weight: .black, design: .rounded))
                                .tracking(-2)
                                .foregroundStyle(.white)
                            Text("DICE MACHINE    •    EDITION 001")
                                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                                .tracking(1.5)
                                .foregroundStyle(Color(rollHex: skin.tensHex))
                        }
                        Spacer()
                        Image(systemName: "circle.hexagongrid.fill")
                            .font(.system(size: 29))
                            .foregroundStyle(Color(rollHex: skin.onesHex))
                    }
                    .padding(.horizontal, 24)

                    Roll99Panel(skin: skin) { result in
                        lastRoll = result
                        revealHint = false
                        #if os(iOS)
                        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                        #endif
                        // Host integrations can dispatch `result.event` here.
                    }

                    VStack(alignment: .leading, spacing: 13) {
                        HStack {
                            Text("DICE FINISHES")
                            Spacer()
                            Text("04 / UNLOCKED")
                        }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .tracking(1.5)
                        .foregroundStyle(.white.opacity(0.5))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(DiceSkin.presets) { candidate in
                                    Button { selectedSkin = candidate.id } label: {
                                        VStack(alignment: .leading, spacing: 8) {
                                            HStack(spacing: 5) {
                                                Circle().fill(Color(rollHex: candidate.tensHex)).frame(width: 19, height: 19)
                                                Circle().fill(Color(rollHex: candidate.onesHex)).frame(width: 19, height: 19)
                                            }
                                            Text(candidate.title)
                                                .font(.system(size: 10, weight: .heavy, design: .monospaced))
                                                .foregroundStyle(.white)
                                        }
                                        .padding(14)
                                        .frame(width: 135, alignment: .leading)
                                        .background(.white.opacity(candidate.id == selectedSkin ? 0.11 : 0.04), in: RoundedRectangle(cornerRadius: 15))
                                        .overlay(RoundedRectangle(cornerRadius: 15)
                                            .stroke(Color(rollHex: candidate.tensHex).opacity(candidate.id == selectedSkin ? 1 : 0.1)))
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("Select \(candidate.title) dice skin")
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 23)

                    VStack(spacing: 13) {
                        Toggle("PAO PRACTICE", isOn: $paoPrompt)
                            .font(.system(size: 13, weight: .heavy, design: .monospaced))
                            .tint(Color(rollHex: skin.tensHex))
                        if paoPrompt, let result = lastRoll {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("MEMORY NODE / \(result.memoryNodeID)")
                                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                    .foregroundStyle(Color(rollHex: skin.tensHex))
                                Text("Recall the person, action, and object for \(result.display).")
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.85))
                                Button(revealHint ? "HIDE PROMPT" : "SHOW PROMPT") { revealHint.toggle() }
                                    .font(.system(size: 11, weight: .black, design: .monospaced))
                                    .foregroundStyle(Color(rollHex: skin.onesHex))
                                if revealHint {
                                    Text("Memory Station can resolve \(result.memoryNodeID) to your canonical PAO record when connected. The deck isn't duplicated here.")
                                        .font(.system(size: 12))
                                        .foregroundStyle(.white.opacity(0.6))
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(20)
                    .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 20))
                    .padding(.horizontal, 23)
                }
                .padding(.top, 25)
                .padding(.bottom, 50)
            }
        }
        .preferredColorScheme(.dark)
    }
}