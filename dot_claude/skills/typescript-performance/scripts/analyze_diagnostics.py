#!/usr/bin/env python3
"""
TypeScript Extended Diagnostics Analyzer
Parses and analyzes the output of tsc --extendedDiagnostics
"""

import sys
import re
from pathlib import Path
from typing import Dict


def parse_diagnostics(text: str) -> Dict[str, str]:
    """Parse extendedDiagnostics output into a structured format."""
    metrics = {}

    # Common patterns
    patterns = {
        "Files": r"Files:\s+(\d+)",
        "Lines": r"Lines:\s+(\d+)",
        "Nodes": r"Nodes:\s+(\d+)",
        "Identifiers": r"Identifiers:\s+(\d+)",
        "Symbols": r"Symbols:\s+(\d+)",
        "Types": r"Types:\s+(\d+)",
        "Memory used": r"Memory used:\s+(\d+)K",
        "I/O Read time": r"I/O Read time:\s+([\d.]+)s",
        "Parse time": r"Parse time:\s+([\d.]+)s",
        "Program time": r"Program time:\s+([\d.]+)s",
        "Bind time": r"Bind time:\s+([\d.]+)s",
        "Check time": r"Check time:\s+([\d.]+)s",
        "Emit time": r"Emit time:\s+([\d.]+)s",
        "Total time": r"Total time:\s+([\d.]+)s",
    }

    for name, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            metrics[name] = match.group(1)

    return metrics


def analyze_metrics(metrics: Dict[str, str]) -> list[str]:
    """Analyze metrics and provide insights."""
    issues = []

    # Check for high check time
    if "Check time" in metrics and "Total time" in metrics:
        check_time = float(metrics["Check time"])
        total_time = float(metrics["Total time"])
        check_ratio = check_time / total_time if total_time > 0 else 0

        if check_ratio > 0.7:
            issues.append(
                f"⚠️  Check time is {check_ratio * 100:.1f}% of total time (high)"
            )
            issues.append("   → Focus on type-checking performance")

    # Check for high I/O time
    if "I/O Read time" in metrics and "Total time" in metrics:
        io_time = float(metrics["I/O Read time"])
        total_time = float(metrics["Total time"])
        io_ratio = io_time / total_time if total_time > 0 else 0

        if io_ratio > 0.3:
            issues.append(
                f"⚠️  I/O Read time is {io_ratio * 100:.1f}% of total time (high)"
            )
            issues.append("   → Check include/exclude configuration in tsconfig.json")

    # Check file count
    if "Files" in metrics:
        file_count = int(metrics["Files"])
        if file_count > 5000:
            issues.append(f"⚠️  Processing {file_count} files (very high)")
            issues.append("   → Consider using project references to split the project")
        elif file_count > 2000:
            issues.append(f"⚠️  Processing {file_count} files (high)")
            issues.append("   → Review include/exclude patterns")

    # Check memory usage
    if "Memory used" in metrics:
        memory_mb = int(metrics["Memory used"]) / 1024
        if memory_mb > 2000:
            issues.append(f"⚠️  Memory usage: {memory_mb:.1f}MB (very high)")
            issues.append("   → Consider breaking project into smaller parts")

    return issues


def format_output(metrics: Dict[str, str], issues: list[str]) -> str:
    """Format the analysis output."""
    output = []

    output.append("=" * 60)
    output.append("TypeScript Extended Diagnostics Analysis")
    output.append("=" * 60)
    output.append("")

    # Key metrics
    output.append("📊 Key Metrics:")
    output.append("")

    key_metrics = ["Files", "Lines", "Types", "Memory used", "Total time"]
    for metric in key_metrics:
        if metric in metrics:
            output.append(f"   {metric:20s}: {metrics[metric]}")

    output.append("")
    output.append("⏱️  Time Breakdown:")
    output.append("")

    time_metrics = [
        "I/O Read time",
        "Parse time",
        "Bind time",
        "Check time",
        "Emit time",
    ]
    for metric in time_metrics:
        if metric in metrics:
            value = metrics[metric]
            # Calculate percentage if total time is available
            if "Total time" in metrics:
                total = float(metrics["Total time"])
                current = float(value)
                percentage = (current / total * 100) if total > 0 else 0
                output.append(f"   {metric:20s}: {value:>6s}s ({percentage:5.1f}%)")
            else:
                output.append(f"   {metric:20s}: {value:>6s}s")

    # Issues and recommendations
    if issues:
        output.append("")
        output.append("🔍 Analysis & Recommendations:")
        output.append("")
        for issue in issues:
            output.append(issue)
    else:
        output.append("")
        output.append("✅ No obvious performance issues detected")

    output.append("")
    output.append("=" * 60)

    return "\n".join(output)


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_diagnostics.py <diagnostics-file>")
        print("   or: tsc --extendedDiagnostics | python analyze_diagnostics.py -")
        sys.exit(1)

    input_path = sys.argv[1]

    # Read input
    if input_path == "-":
        text = sys.stdin.read()
    else:
        path = Path(input_path)
        if not path.exists():
            print(f"Error: File not found: {input_path}")
            sys.exit(1)
        text = path.read_text()

    # Parse and analyze
    metrics = parse_diagnostics(text)

    if not metrics:
        print("Error: No diagnostics data found in input")
        sys.exit(1)

    issues = analyze_metrics(metrics)

    # Output results
    print(format_output(metrics, issues))


if __name__ == "__main__":
    main()
