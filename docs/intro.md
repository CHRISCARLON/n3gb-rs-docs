---
slug: /
sidebar_position: 1
title: Overview
---

# n3gb-rs

Rust implementation of a hex-based spatial indexing system for British National Grid.

This work is inspired by [GDS NUAR n3gb](https://github.com/national-underground-asset-register/n3gb) and [h3o](https://github.com/HydroniumLabs/h3o).

Work in progress, won't be perfect.

## Core Structs

### HexCell

A single hexagonal cell with a unique ID, center point, and zoom level.

**Create one:**

```rust
use n3gb_rs::HexCell;
use geo_types::Point;

// From BNG coordinates
let point = Point::new(383640.0, 398260.0);
let cell = HexCell::from_bng(&point, 12)?;

// From an existing ID
let cell = HexCell::from_hex_id("AAF3kQBBMZQM")?;
```

**What you can do:**

```rust
cell.id              // Unique Base64 identifier
cell.easting()       // Center X coordinate
cell.northing()      // Center Y coordinate
cell.to_polygon()    // Get the hex as a Polygon geometry
```

### HexGrid

A collection of HexCells covering a bounding box/polygon boundary

**Create one:**

```rust
use n3gb_rs::HexGrid;

// Using builder
let grid = HexGrid::builder()
    .zoom_level(12)
    .bng_extent(&(300000.0, 300000.0), &(350000.0, 350000.0))
    .build()?;

// Direct construction
let grid = HexGrid::from_bng_extent(&(300000.0, 300000.0), &(350000.0, 350000.0), 12)?;
```

**What you can do:**

```rust
use geo_types::point;

// Look up a cell by point
let pt = point! { x: 325000.0, y: 325000.0 };
if let Some(cell) = grid.get_cell_at(&pt) {
    println!("{}", cell.id);
}

// Iterate over all cells
for cell in grid.cells() {
    println!("{}", cell.id);
}

// Export to GeoParquet
grid.to_geoparquet("output.parquet")?;

// Export to Arrow RecordBatch
let batch = grid.to_record_batch()?;
```

## WGS84 to BNG conversion

Any function that accepts WGS84 coordinates requires a `ConversionMethod` argument. Two backends are available:

| Method | Accuracy | System requirement |
|--------|----------|--------------------|
| `ConversionMethod::Ostn15` | ~1mm always | None (data embedded at compile time) |
| `ConversionMethod::Proj` | ~1mm with grid files, ~5m without | `libproj` system library |

**Stay with `Ostn15` (default) unless you have a specific reason to use PROJ.**

When PROJ grid files (`uk_os_OSTN15_NTv2_OSGBtoETRS.tif`) are not installed, PROJ silently falls back to a Helmert transform with ~5m error — no warning is raised.

To check which pipeline PROJ is actually using at runtime:
```
PROJ_DEBUG=2 cargo run
```
Look for `uk_os_OSTN15_NTv2_OSGBtoETRS.tif - succeeded` (grid active) or `OSGB 1936 to WGS 84 (6)` (Helmert fallback). The `check_proj` example automates this check.

```rust
use n3gb_rs::{HexCell, ConversionMethod};

// Recommended
let cell = HexCell::from_wgs84(&(-2.248, 53.481), 12, ConversionMethod::Ostn15)?;

// Only if you know libproj + grid files are installed
let cell = HexCell::from_wgs84(&(-2.248, 53.481), 12, ConversionMethod::Proj)?;
```

## Zoom levels

Each zoom level has **7x the area** of the next finer level (aperture 7).

| Zoom | Radius (m) | Width (m) | Use case |
|------|-----------|-----------|----------|
| 0 | 1,281,250 | 2,219,190 | All of GB |
| 5 | 9,850 | 17,060 | Regional |
| 10 | 75 | 130 | Neighbourhood |
| 12 | 10 | 18 | Street level |
| 15 | 0.58 | 1 | Sub-metre |

Cell widths follow the formula: `width(zoom) = (sqrt(7))^(15 - zoom)`

## Modules

| Module | What it does |
|--------|-------------|
| `cell` | `HexCell` — single hexagon with ID, center, row/col |
| `grid` | `HexGrid` — collection of cells covering an extent |
| `coord` | `Crs` enum, `ConversionMethod` enum, WGS84 to BNG transformations (PROJ + OSTN15) |
| `geom` | Hexagon polygon creation, WKT/GeoJSON parsing |
| `index` | Hex ID encoding/decoding, point to row/col math |
| `dimensions` | Hexagon dimension calculations |
| `io` | Arrow, GeoParquet, and CSV I/O |

## Examples

**Simple hex grid over Manchester at zoom level 10**

![Hex grid over Manchester](pathname:///n3gb-rs-docs/manchester-simple-gird.png)

*Base map © Crown Copyright and database rights Ordnance Survey.*

**UPRN density heatmap — count of Unique Property Reference Numbers per hex cell at zoom level 6**

Working on fixing some of the bad geometries that appear.

Hunch is that it's the source data that is wrong for some of them.

![UPRN density map](pathname:///n3gb-rs-docs/uprn_density.png)

*Base map © Crown Copyright and database rights Ordnance Survey. UPRN data licensed under the Open Government Licence v3.0, contains OS data © Crown Copyright and database rights.*

**Cadent open pipeline dataset — each pipe indexed to the hex cells its line passes through**

Using line coverage (`from_line_string_bng` / `from_line_string_wgs84`) at zoom level 11, every pipe feature keeps its original attributes and gains a `hex_ids` list — one entry for a short pipe, several where a longer line crosses multiple cells.

| type | pressure | material | asset_id | hex_ids |
|------|----------|----------|----------|---------|
| Service Pipe | LP | PE | CDT1248335481 | `[AQAAAAAfkU50AAAAAArOz-kLDg]` |
| Service Pipe | LP | PE | CDT1248355939 | `[AQAAAAAeWkV0AAAAAAodZPALuA, AQAAAAAeWqUoAAAAAAoeCrMLNg]` |
| Main Pipe | LP | PE | CDT1248359381 | `[AQAAAAAf9X7kAAAAAAsqwjYLrw]` |
| Main Pipe | LP | PE | CDT1248363703 | `[AQAAAAAi9_sIAAAAAAsSzP4LDw]` |

Run over the full open dataset, every feature is tagged in a single pass — input columns straight through, plus the new `hex_ids` list:

```
=== Gas-pipe infrastructure -> hex ID lists ===
Input:  gas-pipe-infrastructure-gpi_open.parquet
Column: geo_shape (WKB (Multi)LineString, WGS84)
Zoom:   11
Output: gas-pipes-with-hexids-z11.parquet  (input + `hex_ids`)

Features:          2,268,971
Cell memberships:  5,559,918
Avg cells/feature: 2.45

Elapsed: 2.57s (882,893 features/sec)
```

*Cadent gas pipeline data licensed under the Open Government Licence v3.0.*
