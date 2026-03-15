---
sidebar_position: 2
title: How Indexing Works
---

# How Indexing Works

## The main idea

Given a point in BNG coordinates and a zoom level:

```
1. zoom  -> width  = CELL_WIDTHS[zoom]      
2. zoom  -> radius = CELL_RADIUS[zoom]       
3. radius -> dy = 1.5 * radius
4. northing / dy -> row = round(northing / dy)
5. easting / width -> col = round(easting / width - (row % 2))
6. row + col -> center = back-calculate x, y
7. center + zoom -> id = base64(pack(center * 1000, zoom))
```

## Step by step example

**Input:** `(easting: 457500.0, northing: 340000.0, zoom: 10)`

### Get cell dimensions

```
width  = CELL_WIDTHS[10] = 130.0 meters
radius = CELL_RADIUS[10] = 75.06 meters
```

### Calculate grid spacing

```
dx = width = 130.0          (horizontal distance between columns)
dy = 1.5 * radius = 112.6   (vertical distance between rows)
```

### Find row and column

```
row = round(340000 / 112.6) = 3020
col = round(457500 / 130 - (3020 % 2)) = 3519
```

Odd rows are offset horizontally by half a cell width:

```
row 2:  ⬡ ⬡ ⬡ ⬡ ⬡      <- even row, no offset
row 1:   ⬡ ⬡ ⬡ ⬡ ⬡     <- odd row, offset by dx/2
row 0:  ⬡ ⬡ ⬡ ⬡ ⬡      <- even row, no offset
        col: 0 1 2 3 4
```

### Calculate cell center

```
center_x = col * dx + (row % 2) * (dx / 2) = 457470.0
center_y = row * dy = 340052.0
```

### Generate the ID

```
Scale coordinates * 1000:
  easting_int  = 457470000
  northing_int = 340052000

Pack bytes:
  [version=1][easting as u64][northing as u64][zoom=10][checksum]

Base64 encode -> "AAAbT7YAAFRD..."
```

## ID binary format

The identifier is a URL-safe Base64 string encoding 19 bytes:

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 1 | Version | Format version (currently 1) |
| 1 | 8 | Easting | BNG easting * 1000 as `u64` |
| 9 | 8 | Northing | BNG northing * 1000 as `u64` |
| 17 | 1 | Zoom Level | Grid zoom level (0-15) |
| 18 | 1 | Checksum | Wrapping sum of bytes 0-17 |

## How it differs from H3

| Aspect | H3/H3O | n3gb-rs |
|--------|--------|---------|
| Coverage | Global (icosahedron) | UK only (BNG) |
| ID encodes | Path through hierarchy | Raw coordinates |
| Parent/child | Built into index (truncate path) | Must recompute from coords |
| ID size | 64 bits | 152 bits (19 bytes) |
| Zoom level | Implicit (number of directions) | Explicit (stored in ID) |

H3 encodes the **path** from a base cell down through the hierarchy. N3gb-rs encodes the **coordinates** directly. This means n3gb-rs has no built-in parent/child relationships — to find a cell's parent at a coarser zoom, you decode the coordinates and recompute.
