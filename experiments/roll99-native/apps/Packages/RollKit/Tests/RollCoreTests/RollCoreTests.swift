import XCTest
@testable import RollCore

final class RollCoreTests: XCTestCase {
    func testDisplayPreservesLeadingZeros() {
        XCTAssertEqual(PercentileResult(tens: 0, ones: 0).display, "00")
        XCTAssertEqual(PercentileResult(tens: 0, ones: 7).display, "07")
        XCTAssertEqual(PercentileResult(tens: 4, ones: 2).value, 42)
        XCTAssertEqual(PercentileResult(tens: 4, ones: 2).memoryNodeID, "pao:42")
        XCTAssertEqual(PercentileResult(tens: 9, ones: 9).display, "99")
    }

    func testAllPossiblePercentilePairsRoundTrip() {
        let all = (0...9).flatMap { a in (0...9).map { b in PercentileResult(tens: a, ones: b) } }
        XCTAssertEqual(all.count, 100)
        XCTAssertEqual(Set(all.map(\.display)).count, 100)
        XCTAssertEqual(Set(all.map(\.value)), Set(0...99))
    }

    func testCoreSupportsOtherAppsWithDifferentDice() {
        let result = RollEngine().roll([.d6, .d20, .d10])
        XCTAssertEqual(result.count, 3)
        XCTAssertTrue((1...6).contains(Int(result[0].label)!))
        XCTAssertTrue((1...20).contains(Int(result[1].label)!))
        XCTAssertTrue((0...9).contains(Int(result[2].label)!))
    }

    func testWebCompatibleEventFieldsAndRoundTrip() throws {
        for digits in [(0, 0), (0, 7), (4, 2), (9, 9)] {
            let roll = PercentileResult(tens: digits.0, ones: digits.1)
            let event = roll.wireEvent
            XCTAssertEqual(event.kind, "percentile-d10")
            XCTAssertEqual(event.display, roll.display)
            XCTAssertEqual(event.value, roll.value)
            XCTAssertEqual(event.tens, roll.tens)
            XCTAssertEqual(event.ones, roll.ones)
            XCTAssertEqual(event.source, "digital")
            XCTAssertFalse(event.occurredAt.isEmpty)
            let encoded = try JSONEncoder().encode(event)
            let decoded = try JSONDecoder().decode(PercentileWireEvent.self, from: encoded)
            XCTAssertEqual(decoded, event)
        }
    }

    func testGeneratedRollsWithinBounds() {
        for _ in 0..<1000 {
            let result = RollEngine().percentile()
            XCTAssertTrue((0...99).contains(result.value))
            XCTAssertEqual(result.display.count, 2)
        }
    }
}