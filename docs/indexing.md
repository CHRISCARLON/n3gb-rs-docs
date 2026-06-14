---
sidebar_position: 2
title: How Indexing Works
---

# How Indexing Works

## The mental model

A coordinate — BNG easting/northing, or WGS84 lon/lat that is **projected to BNG
first** — is mapped to an integer `(row, col)` on an offset hexagon lattice. The
lattice spacing comes from per-zoom constant tables. That `(row, col)` yields a
hexagon **center** point, and the center + zoom level is encoded into a 19-byte,
checksummed, URL-safe Base64 **id**.

> **Not hierarchical.** Unlike H3, each zoom level is an independent lattice —
> there is no built-in parent/child relationship between a cell at zoom 10 and one
> at zoom 11. To "change zoom" you re-index the coordinate.

## The pipeline

Follow one coordinate from input to id. The constants come from three per-zoom
tables: `CELL_WIDTHS`, `CELL_RADIUS`, and
`GRID_EXTENTS = [min_x, min_y, max_x, max_y] = [0, 0, 750000, 1350000]` (the BNG
bounds of Great Britain).

### Step 0 — (optional) WGS84 → BNG

If the input is WGS84 it is projected to BNG first, dispatched on `ConversionMethod`:

- `Ostn15` (**default**) — OSTN15 grid-shift data embedded at compile time, ~1mm
  accuracy, no system dependencies.
- `Proj` — the system PROJ library; ~1mm with the OSTN15 grid file installed, ~5m
  (Helmert fallback) without.

### Step 1 — BNG point → (row, col)

```text
dx = CELL_WIDTHS[zoom]
dy = 1.5 * CELL_RADIUS[zoom]
row = round((y - min_y) / dy)
col = round((x - min_x) / dx - (row mod 2))
```

Odd rows are offset horizontally by half a cell width (offset coordinates):

```
row 2:  ⬡ ⬡ ⬡ ⬡ ⬡      <- even row, no offset
row 1:   ⬡ ⬡ ⬡ ⬡ ⬡     <- odd row, offset by dx/2
row 0:  ⬡ ⬡ ⬡ ⬡ ⬡      <- even row, no offset
        col: 0 1 2 3 4
```

### Step 2 — (row, col) → center

The exact inverse of step 1:

```text
x = min_x + col*dx + (row mod 2)*(dx/2)
y = min_y + row*dy
```

### Step 3 — center + zoom → id

`generate_hex_identifier` packs a 19-byte buffer, then URL-safe Base64 encodes it
(no padding). Coordinates are scaled ×1000 first, preserving three decimal places
(millimetre precision).

### Step 4 — id → components (round trip)

`decode_hex_identifier` Base64-decodes, checks the length is 19, verifies the
checksum and version, then divides the packed integers back by 1000 — recovering
the center point and zoom level.

## Worked example

**Input:** BNG `(easting: 457500.0, northing: 340000.0)`, zoom 10.

```text
dx = CELL_WIDTHS[10]       = 130.0
dy = 1.5 * CELL_RADIUS[10] = 1.5 * 75.056 = 112.583

row = round((340000 - 0) / 112.583)            = round(3019.55) = 3020
col = round((457500 - 0) / 130 - (3020 mod 2)) = round(3519.23) = 3519

center_x = 0 + 3519*130 + (3020 mod 2)*(130/2) = 457470.0
center_y = 0 + 3020*112.583                    ≈ 340001.6

scale ×1000 -> easting_int ≈ 457470000, northing_int ≈ 340001573
pack [version=1][easting u64 BE][northing u64 BE][zoom=10][checksum]
Base64 (URL-safe, no padding) -> the cell id
```

## ID binary format

The identifier is a URL-safe Base64 string encoding 19 bytes:

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 1 | Version | Format version (currently 1) |
| 1 | 8 | Easting | BNG easting × 1000 as big-endian `u64` |
| 9 | 8 | Northing | BNG northing × 1000 as big-endian `u64` |
| 17 | 1 | Zoom Level | Grid zoom level (0–15) |
| 18 | 1 | Checksum | Wrapping sum of bytes 0–17 |

## Distance between cells

Offset `(row, col)` converts to cube coordinates (`q = col - row/2`, `r = row`,
`s = -q - r`), and `grid_distance` is the Manhattan distance in cube space — the
number of hex steps between two cells. Both cells must share a zoom level, or you
get `N3gbError::ZoomLevelMismatch`.

## How it differs from H3

| Aspect | H3/H3O | n3gb-rs |
|--------|--------|---------|
| Coverage | Global (icosahedron) | UK only (BNG) |
| ID encodes | Path through hierarchy | Raw coordinates |
| Parent/child | Built into index (truncate path) | Must recompute from coords |
| ID size | 64 bits | 152 bits (19 bytes) |
| Zoom level | Implicit (number of directions) | Explicit (stored in ID) |

H3 encodes the **path** from a base cell down through the hierarchy. n3gb-rs
encodes the **coordinates** directly. This means n3gb-rs has no built-in
parent/child relationships — to find a cell's parent at another zoom level, you
decode the coordinates and recompute.
