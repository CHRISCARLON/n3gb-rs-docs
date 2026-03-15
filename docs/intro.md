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
| `coord` | CRS enum, WGS84 to BNG transformations |
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
