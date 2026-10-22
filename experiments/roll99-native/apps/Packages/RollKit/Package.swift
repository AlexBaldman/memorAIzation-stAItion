// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RollKit",
    platforms: [.iOS(.v17), .watchOS(.v10), .macOS(.v14)],
    products: [
        .library(name: "RollCore", targets: ["RollCore"]),
        .library(name: "RollUI", targets: ["RollUI"])
    ],
    targets: [
        .target(name: "RollCore"),
        .target(name: "RollUI", dependencies: ["RollCore"]),
        .testTarget(name: "RollCoreTests", dependencies: ["RollCore"])
    ]
)