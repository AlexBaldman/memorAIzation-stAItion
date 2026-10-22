import Foundation

/// Headless dice mechanics. No references to SwiftUI, iOS, watchOS, or Memory Station.
public struct DieSpec: Codable, Equatable, Sendable {
    public let sides: Int
    public let labels: [String]?

    public init(sides: Int, labels: [String]? = nil) {
        precondition(sides >= 2, "A die needs at least two sides")
        precondition(labels == nil || labels?.count == sides, "A label per side is required")
        self.sides = sides
        self.labels = labels
    }

    public static let d10 = DieSpec(sides: 10, labels: (0...9).map(String.init))
    public static let d6 = DieSpec(sides: 6)
    public static let d20 = DieSpec(sides: 20)
}

public struct DieOutcome: Codable, Equatable, Sendable {
    public let index: Int   // Zero-based face index
    public let label: String
    public init(index: Int, label: String) { self.index = index; self.label = label }
}

public struct PercentileResult: Codable, Equatable, Identifiable, Sendable {
    public let id: UUID
    public let tens: Int
    public let ones: Int
    public let occurredAt: Date

    public init(tens: Int, ones: Int, id: UUID = UUID(), occurredAt: Date = Date()) {
        precondition((0...9).contains(tens) && (0...9).contains(ones))
        self.id = id
        self.tens = tens
        self.ones = ones
        self.occurredAt = occurredAt
    }

    public var value: Int { tens * 10 + ones }
    /// Always two characters, even for 00 or 07.
    public var display: String { "\(tens)\(ones)" }
    public var memoryNodeID: String { "pao:\(display)" }
    /// Identical field names and values to the web RollKit wire contract.
    /// The original `event` remains available for backward-compatible host adapters.
    public var wireEvent: PercentileWireEvent {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return PercentileWireEvent(
            id: id.uuidString.lowercased(), kind: "percentile-d10",
            tens: tens, ones: ones, value: value, display: display,
            source: "digital", occurredAt: formatter.string(from: occurredAt)
        )
    }
    public var event: RollEvent {
        RollEvent(type: "dice.percentile.rolled", rollID: id, result: display,
                  faceIndices: [tens, ones], occurredAt: occurredAt)
    }
}

public struct RollEvent: Codable, Sendable {
    public let type: String
    public let rollID: UUID
    public let result: String
    public let faceIndices: [Int]
    public let occurredAt: Date
}

/// Stable cross-platform payload consumed by both web and native RollKit adapters.
public struct PercentileWireEvent: Codable, Equatable, Sendable {
    public let id: String
    public let kind: String
    public let tens: Int
    public let ones: Int
    public let value: Int
    public let display: String
    public let source: String
    public let occurredAt: String
}

public struct RollEngine: Sendable {
    public init() {}

    public func roll<R: RandomNumberGenerator>(_ dice: [DieSpec], using random: inout R) -> [DieOutcome] {
        dice.map { die in
            let index = Int.random(in: 0..<die.sides, using: &random)
            return DieOutcome(index: index, label: die.labels?[index] ?? "\(index + 1)")
        }
    }

    public func roll(_ dice: [DieSpec]) -> [DieOutcome] {
        var random = SystemRandomNumberGenerator()
        return roll(dice, using: &random)
    }

    public func percentile<R: RandomNumberGenerator>(using random: inout R) -> PercentileResult {
        // Exactly two independent uniform 0...9 draws. Never use a 1...100 display conversion.
        let faces = roll([.d10, .d10], using: &random)
        return PercentileResult(tens: faces[0].index, ones: faces[1].index)
    }

    public func percentile() -> PercentileResult {
        var random = SystemRandomNumberGenerator()
        return percentile(using: &random)
    }
}

/// Cross-surface skin description; platforms decide how to render it.
public struct DiceSkin: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let backgroundHex: String
    public let tensHex: String
    public let onesHex: String
    public let highlightHex: String

    public init(id: String, title: String, backgroundHex: String,
                tensHex: String, onesHex: String, highlightHex: String) {
        self.id = id; self.title = title; self.backgroundHex = backgroundHex
        self.tensHex = tensHex; self.onesHex = onesHex; self.highlightHex = highlightHex
    }

    public static let presets: [DiceSkin] = [
        .init(id: "afterburn", title: "AFTERBURN", backgroundHex: "080C1A", tensHex: "28EAF5", onesHex: "FA4DC8", highlightHex: "F8C96A"),
        .init(id: "phosphor", title: "PHOSPHOR", backgroundHex: "061812", tensHex: "AEFF39", onesHex: "33FFBE", highlightHex: "E8FFBC"),
        .init(id: "goldrush", title: "GOLDRUSH", backgroundHex: "17100B", tensHex: "FFC45E", onesHex: "FF6D48", highlightHex: "F8E8BD"),
        .init(id: "ultraviolet", title: "ULTRAVIOLET", backgroundHex: "100B21", tensHex: "A28CFF", onesHex: "F767D6", highlightHex: "EAE7FF")
    ]
}