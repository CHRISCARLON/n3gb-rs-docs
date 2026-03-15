---
sidebar_position: 3
title: API Reference
---

# API Reference

For people used to similar hexagonal indexing systems (like H3), here is a basic API reference.

Instead of trying to name things exactly the same, I'm trying to ensure some concept and functionality parity between other H3 libraries that exist.

Work in progress, it won't be perfect.

## Quick reference

### Indexing functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Point to cell (BNG)      | `HexCell::from_bng`                      |
| Point to cell (WGS84)    | `HexCell::from_wgs84`                    |
| Geometry to cells         | `HexCell::from_geometry`                |
| Cell ID to cell          | `HexCell::from_hex_id`                   |
| Generate cell ID         | `generate_hex_identifier`                |
| Decode cell ID           | `decode_hex_identifier`                  |
| Point to row/col         | `point_to_row_col`                       |
| Row/col to center        | `row_col_to_center`                      |

### Cell inspection functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Get zoom level           | `HexCell::zoom_level`                    |
| Get cell ID              | `HexCell::id`                            |
| Get center point         | `HexCell::center`                        |
| Get easting              | `HexCell::easting`                       |
| Get northing             | `HexCell::northing`                      |
| Get row index            | `HexCell::row`                           |
| Get column index         | `HexCell::col`                           |
| Cell to polygon          | `HexCell::to_polygon`                    |

### Grid functions

| Concept                   | n3gb-rs                                 |
| :------------------------ | :-------------------------------------- |
| Grid from extent (BNG)    | `HexGrid::from_bng_extent`              |
| Grid from extent (WGS84)  | `HexGrid::from_wgs84_extent`            |
| Grid from rect            | `HexGrid::from_rect`                    |
| Grid from polygon (BNG)   | `HexGrid::from_bng_polygon`             |
| Grid from polygon (WGS84) | `HexGrid::from_wgs84_polygon`           |
| Grid from multipolygon    | `HexGrid::from_bng_multipolygon`        |
| Grid builder              | `HexGridBuilder`                        |
| Get cells                 | `HexGrid::cells`                        |
| Get cell count            | `HexGrid::len`                          |
| Find cell at point        | `HexGrid::get_cell_at`                  |
| Filter cells              | `HexGrid::filter`                       |
| Grid to polygons          | `HexGrid::to_polygons`                  |

### Line coverage functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Line to cells (BNG)      | `HexCell::from_line_string_bng`          |
| Line to cells (WGS84)    | `HexCell::from_line_string_wgs84`        |

### Coordinate transformation functions

| Concept                   | n3gb-rs                                 |
| :------------------------ | :-------------------------------------- |
| WGS84 to BNG point        | `wgs84_to_bng`                          |
| WGS84 to BNG polygon      | `wgs84_polygon_to_bng`                  |
| WGS84 to BNG multipolygon | `wgs84_multipolygon_to_bng`             |
| WGS84 to BNG line         | `wgs84_line_to_bng`                     |

### Hexagon dimension functions

| Concept                    | n3gb-rs                                |
| :------------------------- | :------------------------------------- |
| Dims from side length      | `from_side`                            |
| Dims from circumradius     | `from_circumradius`                    |
| Dims from apothem          | `from_apothem`                         |
| Dims from flat-to-flat     | `from_across_flats`                    |
| Dims from corner-to-corner | `from_across_corners`                  |
| Dims from area             | `from_area`                            |
| Bounding box               | `bounding_box`                         |

### Geometry functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Create hex cell polygon  | `create_hexagon` (used in to_polygon)    |
| Parse WKT/GeoJSON        | `parse_geometry`                         |

### Arrow/Parquet I/O functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Cell to Arrow points     | `HexCell::to_arrow_points`               |
| Cell to Arrow polygons   | `HexCell::to_arrow_polygons`             |
| Cell to RecordBatch      | `HexCell::to_record_batch`               |
| Cell to GeoParquet       | `HexCell::to_geoparquet`                 |
| Grid to Arrow points     | `HexGrid::to_arrow_points`               |
| Grid to Arrow polygons   | `HexGrid::to_arrow_polygons`             |
| Grid to RecordBatch      | `HexGrid::to_record_batch`               |
| Grid to GeoParquet       | `HexGrid::to_geoparquet`                 |
| Write GeoParquet         | `write_geoparquet`                       |

### CSV I/O functions

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| CSV to hex-indexed CSV   | `csv_to_hex_csv`                         |
| CSV config (geometry)    | `CsvHexConfig::new`                      |
| CSV config (coords)      | `CsvHexConfig::from_coords`              |

### Constants

| Concept                  | n3gb-rs                                  |
| :----------------------- | :--------------------------------------- |
| Max zoom level           | `MAX_ZOOM_LEVEL`                         |
| Cell radii by zoom       | `CELL_RADIUS`                            |
| Cell widths by zoom      | `CELL_WIDTHS`                            |
| Grid extents (BNG)       | `GRID_EXTENTS`                           |
| Identifier version       | `IDENTIFIER_VERSION`                     |

---

## Detailed reference

### HexCell

A single hexagonal cell with a unique ID, center point, and zoom level.

#### Creating cells

| Method | Description |
|--------|-------------|
| `HexCell::from_bng(coord, zoom)` | From BNG easting/northing |
| `HexCell::from_wgs84(coord, zoom)` | From WGS84 lon/lat |
| `HexCell::from_hex_id(id)` | From an existing Base64 ID |
| `HexCell::from_geometry(geom, zoom, crs)` | From any `geo_types::Geometry` |
| `HexCell::from_line_string_bng(line, zoom)` | All cells along a BNG line |
| `HexCell::from_line_string_wgs84(line, zoom)` | All cells along a WGS84 line |

Coordinates can be passed as `(f64, f64)` tuples or `geo_types::Point<f64>`:

```rust
use n3gb_rs::HexCell;
use geo_types::Point;

// Both work
let cell = HexCell::from_bng(&(383640.0, 398260.0), 12)?;
let cell = HexCell::from_bng(&Point::new(383640.0, 398260.0), 12)?;
```

#### Cell properties

| Field/Method | Type | Description |
|-------------|------|-------------|
| `cell.id` | `String` | Unique Base64 identifier |
| `cell.center` | `Point<f64>` | Center in BNG coordinates |
| `cell.zoom_level` | `u8` | Zoom level (0-15) |
| `cell.row` | `i64` | Row index in the grid |
| `cell.col` | `i64` | Column index in the grid |
| `cell.easting()` | `f64` | Center x-coordinate |
| `cell.northing()` | `f64` | Center y-coordinate |
| `cell.to_polygon()` | `Polygon<f64>` | Hexagon boundary |

#### Cell output

| Method | Description |
|--------|-------------|
| `cell.to_record_batch()` | Arrow RecordBatch |
| `cell.to_geoparquet(path)` | Write to GeoParquet file |
| `cell.to_arrow_points()` | Arrow PointArray |
| `cell.to_arrow_polygons()` | Arrow PolygonArray |

---

### HexGrid

A collection of `HexCell`s covering a geographic extent.

#### Creating grids

```rust
use n3gb_rs::HexGrid;

// Builder pattern
let grid = HexGrid::builder()
    .zoom_level(10)
    .bng_extent(&(457000.0, 339500.0), &(458000.0, 340500.0))
    .build()?;

// Direct construction
let grid = HexGrid::from_bng_extent(
    &(457000.0, 339500.0),
    &(458000.0, 340500.0),
    10,
)?;
```

| Method | Description |
|--------|-------------|
| `HexGrid::from_bng_extent(min, max, zoom)` | From BNG bounding box |
| `HexGrid::from_wgs84_extent(min, max, zoom)` | From WGS84 bounding box |
| `HexGrid::from_rect(rect, zoom)` | From `geo_types::Rect` |
| `HexGrid::from_bng_polygon(polygon, zoom)` | Cells intersecting a BNG polygon |
| `HexGrid::from_wgs84_polygon(polygon, zoom)` | Cells intersecting a WGS84 polygon |
| `HexGrid::from_bng_multipolygon(mp, zoom)` | Cells intersecting a BNG multipolygon |
| `HexGrid::from_wgs84_multipolygon(mp, zoom)` | Cells intersecting a WGS84 multipolygon |

#### Grid operations

| Method | Description |
|--------|-------------|
| `grid.get_cell_at(point)` | Find cell containing a point (O(1) lookup) |
| `grid.cells()` | Slice of all cells |
| `grid.iter()` | Iterator over cells |
| `grid.len()` | Number of cells |
| `grid.is_empty()` | Whether grid has no cells |
| `grid.filter(predicate)` | Cells matching a predicate |
| `grid.to_polygons()` | All cells as polygons |
| `grid.zoom_level()` | Grid zoom level |

#### Grid output

| Method | Description |
|--------|-------------|
| `grid.to_record_batch()` | Arrow RecordBatch |
| `grid.to_geoparquet(path)` | Write to GeoParquet file |
| `grid.to_arrow_points()` | Arrow PointArray of centers |
| `grid.to_arrow_polygons()` | Arrow PolygonArray of hexagons |

#### Builder methods

The builder collects inputs (converting WGS84 to BNG if needed), then `.build()` generates the grid.

| Method | Description |
|--------|-------------|
| `.zoom_level(u8)` | Set zoom level (required) |
| `.bng_extent(min, max)` | Set BNG bounding box |
| `.wgs84_extent(min, max)` | Set WGS84 bounding box |
| `.rect(rect)` | Set extent from `Rect` |
| `.bng_polygon(polygon)` | Set BNG polygon |
| `.wgs84_polygon(polygon)` | Set WGS84 polygon |
| `.bng_multipolygon(mp)` | Set BNG multipolygon |
| `.wgs84_multipolygon(mp)` | Set WGS84 multipolygon |
| `.build()` | Build the `HexGrid` |

---

### Collection traits

The `HexCellsToArrow` and `HexCellsToGeoParquet` traits are implemented for `Vec<HexCell>` and `[HexCell]`, so you can convert any collection of cells directly:

```rust
use n3gb_rs::{HexCell, HexCellsToArrow, HexCellsToGeoParquet};

let cells: Vec<HexCell> = vec![
    HexCell::from_bng(&(383640.0, 398260.0), 12)?,
    HexCell::from_bng(&(383700.0, 398300.0), 12)?,
];

// Arrow output
let batch = cells.to_record_batch()?;
let points = cells.to_arrow_points();
let polygons = cells.to_arrow_polygons();

// GeoParquet output
cells.to_geoparquet("cells.parquet")?;
```

---

### CSV Processing

Convert CSV files with geometry or coordinate columns to hex-indexed CSVs.

#### From a geometry column

```rust
use n3gb_rs::{csv_to_hex_csv, CsvHexConfig, Crs};

let config = CsvHexConfig::new("geometry", 12)
    .crs(Crs::Wgs84);

csv_to_hex_csv("input.csv", "output.csv", &config)?;
```

#### From coordinate columns

```rust
use n3gb_rs::{csv_to_hex_csv, CsvHexConfig, Crs};

let config = CsvHexConfig::from_coords("Easting", "Northing", 12)
    .crs(Crs::Bng);

csv_to_hex_csv("input.csv", "output.csv", &config)?;
```

#### Using the CsvToHex trait

The `CsvToHex` trait is implemented for all path types, so you can call `.to_hex_csv()` directly on a path:

```rust
use n3gb_rs::{CsvToHex, CsvHexConfig, Crs};

let config = CsvHexConfig::new("geometry", 12)
    .crs(Crs::Wgs84);

"input.csv".to_hex_csv("output.csv", &config)?;
```

#### Output modes

There are two output modes controlled by `.hex_density()`:

**Per-row mode (default)** — each input row gets a hex ID prepended, all original columns are preserved:

```rust
let config = CsvHexConfig::from_coords("X", "Y", 6);

csv_to_hex_csv("input.csv", "output.csv", &config)?;
```

Output: `hex_id, <original columns>` — one row per input row. If your input has 41M rows, you get 41M output rows, each tagged with which hex cell it belongs to.

**Density mode (aggregated)** — rows are grouped by hex cell and counted:

```rust
let config = CsvHexConfig::from_coords("X", "Y", 6)
    .hex_density();

csv_to_hex_csv("input.csv", "output.csv", &config)?;
```

Output: `hex_id, count` — one row per hex cell with how many input rows fell in it. Useful for heatmaps and spatial aggregation.

![UPRN density map](pathname:///n3gb-docs/uprn_density.png)

*Base map © Crown Copyright and database rights Ordnance Survey. UPRN data licensed under the Open Government Licence v3.0, contains OS data © Crown Copyright and database rights.*

#### Config options

| Method | Description |
|--------|-------------|
| `CsvHexConfig::new(geom_col, zoom)` | Config with a geometry column |
| `CsvHexConfig::from_coords(x_col, y_col, zoom)` | Config with coordinate columns |
| `.crs(Crs::Bng)` or `.crs(Crs::Wgs84)` | Set the coordinate reference system |
| `.exclude(vec![...])` | Columns to exclude from output |
| `.with_hex_geometry(GeometryFormat::Wkt)` | Include hex polygon in output |
| `.hex_density()` | Switch to density mode (aggregate to one row per cell with count) |

---

### Coordinate Transformations

| Function | Description |
|----------|-------------|
| `wgs84_to_bng(coord)` | Point: WGS84 to BNG |
| `wgs84_polygon_to_bng(polygon)` | Polygon: WGS84 to BNG |
| `wgs84_multipolygon_to_bng(mp)` | MultiPolygon: WGS84 to BNG |
| `wgs84_line_to_bng(line)` | LineString: WGS84 to BNG |

---

### Geometry Parsing

```rust
use n3gb_rs::parse_geometry;

// Auto-detects WKT or GeoJSON
let geom = parse_geometry("POINT(530000 180000)")?;
let geom = parse_geometry(r#"{"type":"Point","coordinates":[-0.1,51.5]}"#)?;
```

---

### Hexagon Dimensions

The `HexagonDims` struct holds all dimensions of a regular hexagon, computed from any single measurement:

```rust
use n3gb_rs::HexagonDims;

let dims = HexagonDims::from_side(10.0)?;
println!("Area: {}", dims.area);
println!("Perimeter: {}", dims.perimeter);
println!("Apothem: {}", dims.r_apothem);
```

#### HexagonDims fields

| Field | Description |
|-------|-------------|
| `a` | Side length |
| `r_circum` | Circumradius (center to vertex) |
| `r_apothem` | Apothem (center to edge midpoint) |
| `d_corners` | Distance across corners |
| `d_flats` | Distance across flats |
| `perimeter` | Total perimeter |
| `area` | Total area |

#### Constructor functions

| Function | Input |
|----------|-------|
| `HexagonDims::from_side(a)` | Side length |
| `HexagonDims::from_circumradius(r)` | Center to vertex |
| `HexagonDims::from_apothem(r)` | Center to edge midpoint |
| `HexagonDims::from_across_flats(df)` | Edge to opposite edge |
| `HexagonDims::from_across_corners(dc)` | Vertex to opposite vertex |
| `HexagonDims::from_area(area)` | Area |
| `HexagonDims::bounding_box(a, pointy_top)` | Bounding box dimensions |

---

### Error handling

All fallible operations return `Result<T, N3gbError>`. Error variants:

| Variant | Description |
|---------|-------------|
| `InvalidIdentifierLength` | Hex identifier has invalid length |
| `InvalidChecksum` | Hex identifier checksum validation failed |
| `UnsupportedVersion(u8)` | Identifier version not supported |
| `InvalidZoomLevel(u8)` | Zoom level outside valid range (0-15) |
| `InvalidDimension(String)` | Invalid hexagon dimension value |
| `Base64DecodeError` | Failed to decode Base64 identifier |
| `ProjectionError(String)` | Coordinate projection failed |
| `IoError(String)` | File I/O or serialization error |
| `CsvError(String)` | CSV parsing or reading error |
| `GeometryParseError(String)` | Failed to parse geometry from string |

---

### CRS enum

```rust
use n3gb_rs::Crs;

// WGS84 (EPSG:4326) — longitude/latitude (default)
let crs = Crs::Wgs84;

// British National Grid (EPSG:27700) — easting/northing
let crs = Crs::Bng;
```
