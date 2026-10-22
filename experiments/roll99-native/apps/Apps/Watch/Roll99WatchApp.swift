import SwiftUI
import RollCore
import RollUI
import WatchKit

@main
struct Roll99WatchApp: App {
    var body: some Scene {
        WindowGroup { WatchDiceScreen() }
    }
}

struct WatchDiceScreen: View {
    @AppStorage("roll99.watchSkin") private var skinIndex = 0
    private var skin: DiceSkin { DiceSkin.presets[skinIndex % DiceSkin.presets.count] }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 7) {
                Text("ROLL//99")
                    .font(.system(size: 19, weight: .black, design: .rounded))
                    .foregroundStyle(Color(rollHex: skin.tensHex))
                Roll99Panel(skin: skin, compact: true) { _ in
                    WKInterfaceDevice.current().play(.success)
                }
                Button("CHANGE FINISH") {
                    skinIndex = (skinIndex + 1) % DiceSkin.presets.count
                }
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundStyle(Color(rollHex: skin.onesHex))
                .buttonStyle(.plain)
                .padding(.top, 3)
            }
        }
        .containerBackground(Color(rollHex: skin.backgroundHex), for: .navigation)
    }
}