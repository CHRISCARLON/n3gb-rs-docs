---
sidebar_position: 3
title: API Reference
---

# API Reference

Work in progress, won't be perfect.

Looking to achieve concept parity with H3 where it makes sense.


---

## ConversionMethod

Any WGS84 input requires a `ConversionMethod` argument:

| Variant | Accuracy | Requirement |
|---------|----------|-------------|
| `ConversionMethod::Ostn15` | ~1mm always | None (data embedded at compile time) |
| `ConversionMethod::Proj` | ~1mm with grid files, ~5m without (silent!) | `libproj` system library |

Use `Ostn15` unless you have a reason not to. See the overview for details.

---

## HexCell

### Creating cells

```rust
use n3gb_rs::{HexCell, ConversionMethod};

// From BNG
HexCell::from_bng(&(383640.0, 398260.0), 12)?
HexCell::from_bng(&Point::new(383640.0, 398260.0), 12)?

// From WGS84
HexCell::from_wgs84(&(-2.248, 53.481), 12, ConversionMethod::Ostn15)?

// From ID
HexCell::from_hex_id("AAF3kQBBMZQM")?

// From geometry
HexCell::from_geometry(geom, 12, Crs::Bng, ConversionMethod::Ostn15)?

// All cells along a line
HexCell::from_line_string_bng(&bng_line, 12)?
HexCell::from_line_string_wgs84(&wgs84_line, 12, ConversionMethod::Ostn15)?
```

### Cell properties

| Field/Method | Type | Description |
|-------------|------|-------------|
| `cell.id` | `String` | Unique Base64 identifier |
| `cell.center` | `Point<f64>` | Center in BNG coordinates |
| `cell.zoom_level` | `u8` | Zoom level (0–15) |
| `cell.row` | `i64` | Row index |
| `cell.col` | `i64` | Column index |
| `cell.easting()` | `f64` | Center x-coordinate |
| `cell.northing()` | `f64` | Center y-coordinate |
| `cell.to_polygon()` | `Polygon<f64>` | Hexagon boundary |

### Output

| Method | Returns |
|--------|---------|
| `cell.to_record_batch()` | Arrow `RecordBatch` |
| `cell.to_geoparquet(path)` | Writes GeoParquet file |
| `cell.to_arrow_points()` | Arrow `PointArray` |
| `cell.to_arrow_polygons()` | Arrow `PolygonArray` |

`HexCellsToArrow` and `HexCellsToGeoParquet` are also implemented for `Vec<HexCell>` and `[HexCell]`.

---

## HexGrid

### Creating grids

```rust
use n3gb_rs::{HexGrid, ConversionMethod};

// Builder (BNG)
HexGrid::builder()
    .zoom_level(10)
    .bng_extent(&(457000.0, 339500.0), &(458000.0, 340500.0))
    .build()?

// Builder (WGS84)
HexGrid::builder()
    .zoom_level(10)
    .conversion_method(ConversionMethod::Ostn15)
    .wgs84_extent(&(-2.3, 53.4), &(-2.2, 53.5))?
    .build()?

// Direct (BNG)
HexGrid::from_bng_extent(&(457000.0, 339500.0), &(458000.0, 340500.0), 10)?
HexGrid::from_bng_polygon(&polygon, 10)?
HexGrid::from_bng_multipolygon(&mp, 10)?

// Direct (WGS84) — all take a ConversionMethod
HexGrid::from_wgs84_extent(&(-2.3, 53.4), &(-2.2, 53.5), 10, ConversionMethod::Ostn15)?
HexGrid::from_wgs84_polygon(&polygon, 10, ConversionMethod::Ostn15)?
HexGrid::from_wgs84_multipolygon(&mp, 10, ConversionMethod::Ostn15)?
```

### Builder methods

| Method | Description |
|--------|-------------|
| `.zoom_level(u8)` | Required |
| `.conversion_method(method)` | WGS84→BNG backend (default: `Ostn15`) |
| `.bng_extent(min, max)` | BNG bounding box |
| `.wgs84_extent(min, max)` | WGS84 bounding box |
| `.rect(rect)` | `geo_types::Rect` in BNG |
| `.bng_polygon(polygon)` | BNG polygon |
| `.wgs84_polygon(polygon)` | WGS84 polygon |
| `.bng_multipolygon(mp)` | BNG multipolygon |
| `.wgs84_multipolygon(mp)` | WGS84 multipolygon |
| `.build()` | Build the `HexGrid` |

### Grid methods

| Method | Description |
|--------|-------------|
| `grid.get_cell_at(point)` | Find cell containing a point (O(1)) |
| `grid.cells()` | Slice of all cells |
| `grid.iter()` | Iterator over cells |
| `grid.len()` | Cell count |
| `grid.is_empty()` | True if no cells |
| `grid.filter(predicate)` | Cells matching a predicate |
| `grid.to_polygons()` | All cells as polygons |
| `grid.zoom_level()` | Grid zoom level |
| `grid.to_record_batch()` | Arrow `RecordBatch` |
| `grid.to_geoparquet(path)` | Write GeoParquet file |
| `grid.to_arrow_points()` | Arrow `PointArray` of centers |
| `grid.to_arrow_polygons()` | Arrow `PolygonArray` of hexagons |

---

## Output formats

Cells and grids can be written out three ways:

| Format | What you get | Call |
|--------|--------------|------|
| Arrow | In-memory `RecordBatch` / `PointArray` / `PolygonArray` (tagged BNG / EPSG:27700) | `.to_record_batch()`, `.to_arrow_points()`, `.to_arrow_polygons()` |
| GeoParquet | A `.parquet` file on disk | `.to_geoparquet(path)` |
| CSV | A hex-indexed `.csv` derived from an input CSV | `csv_to_hex_csv(input, output, &config)` |

Arrow and GeoParquet work on a single `HexCell`, a `Vec<HexCell>`/slice, or a `HexGrid`.
CSV is a file-to-file pipeline that adds a hex ID column to an existing CSV.

### Arrow & GeoParquet

```rust
let grid = HexGrid::from_bng_extent(&(457000.0, 339500.0), &(458000.0, 340500.0), 10)?;

let batch = grid.to_record_batch()?;   // Arrow RecordBatch (id, zoom_level, row, col, easting, northing, geometry)
grid.to_geoparquet("grid.parquet")?;   // write GeoParquet file
```

### CSV

```rust
use n3gb_rs::{csv_to_hex_csv, CsvHexConfig, Crs, ConversionMethod};

// From coordinate columns (BNG)
let config = CsvHexConfig::from_coords("Easting", "Northing", 12)
    .crs(Crs::Bng);

// From a geometry column (WGS84)
let config = CsvHexConfig::new("geometry", 12)
    .crs(Crs::Wgs84)
    .conversion_method(ConversionMethod::Ostn15);

// Density mode — one row per hex cell with count
let config = CsvHexConfig::from_coords("X", "Y", 6).hex_density();

csv_to_hex_csv("input.csv", "output.csv", &config)?;
```

#### CSV config options

| Method | Description |
|--------|-------------|
| `CsvHexConfig::new(geom_col, zoom)` | Config with a geometry column |
| `CsvHexConfig::from_coords(x_col, y_col, zoom)` | Config with coordinate columns |
| `.crs(Crs)` | Set CRS (`Bng` or `Wgs84`) |
| `.conversion_method(method)` | WGS84→BNG backend (only for `Crs::Wgs84`, default: `Ostn15`) |
| `.exclude(vec![...])` | Columns to exclude from output |
| `.with_hex_geometry(GeometryFormat::Wkt)` | Include hex polygon in output |
| `.hex_density()` | Aggregate to one row per cell with count |

---

## Enums

```rust
// CRS
Crs::Wgs84   // EPSG:4326 — longitude/latitude
Crs::Bng     // EPSG:27700 — easting/northing

// ConversionMethod
ConversionMethod::Ostn15  // default
ConversionMethod::Proj
```

---

## Error handling

All fallible operations return `Result<T, N3gbError>`.

| Variant | Description |
|---------|-------------|
| `InvalidIdentifierLength` | Hex identifier has wrong length |
| `InvalidChecksum` | Checksum validation failed |
| `UnsupportedVersion(u8)` | Identifier version not supported |
| `InvalidZoomLevel(u8)` | Zoom level outside 0–15 |
| `InvalidDimension(String)` | Invalid hexagon dimension |
| `Base64DecodeError` | Failed to decode Base64 |
| `ProjectionError(String)` | Coordinate projection failed |
| `IoError(String)` | File I/O error |
| `CsvError(String)` | CSV parsing error |
| `GeometryParseError(String)` | Failed to parse WKT/GeoJSON |

---

## Geometry Parsing

```rust
use n3gb_rs::parse_geometry;

// Auto-detects WKT or GeoJSON
let geom = parse_geometry("POINT(530000 180000)")?;
let geom = parse_geometry(r#"{"type":"Point","coordinates":[-0.1,51.5]}"#)?;
```

---

## Hexagon Dimensions

```rust
use n3gb_rs::HexagonDims;

let dims = HexagonDims::from_side(10.0)?;
// dims.area, dims.perimeter, dims.r_apothem, dims.r_circum, dims.d_corners, dims.d_flats
```

Constructors: `from_side`, `from_circumradius`, `from_apothem`, `from_across_flats`, `from_across_corners`, `from_area`, `bounding_box`.
