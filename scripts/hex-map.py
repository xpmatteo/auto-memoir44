#!/usr/bin/env python3
# ABOUTME: Prints an ASCII rendition of a hex map grid.
# ABOUTME: Usage: hex-map.py <rows> <cols>

import sys


def q_str(q):
    if q < 0:
        return str(q)     # "-1", "-2", etc.
    return f"{q:02d}"     # "00", "01", "12", etc.


def hex_label(q, r):
    return q_str(q) + f"{r:02d}"


def render(num_rows, num_cols):
    for r in range(num_rows):
        q_start = -(r // 2)
        if r % 2 == 0:
            num_hexes = num_cols
            label_indent = 9
            border_indent = 6
        else:
            num_hexes = num_cols - 1
            label_indent = 14
            border_indent = 11
        labels = [hex_label(q_start + i, r) for i in range(num_hexes)]
        print(" " * label_indent + "      ".join(labels))
        print(" " * border_indent + "|        |" * num_hexes)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <rows> <cols>", file=sys.stderr)
        sys.exit(1)
    render(int(sys.argv[1]), int(sys.argv[2]))
