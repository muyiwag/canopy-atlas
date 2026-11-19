"""Summarise canopy, known bare area and missing coverage within a fixed footprint."""

import argparse
import json
import math
from pathlib import Path


def polygon_geometries(document):
    if document.get("type") == "FeatureCollection":
        return [feature["geometry"] for feature in document["features"]]
    if document.get("type") == "Feature":
        return [document["geometry"]]
    return [document]


def summarize(canopy_pixels, observed_pixels, footprint_pixels, cell_area):
    if not 0 <= canopy_pixels <= observed_pixels <= footprint_pixels:
        raise ValueError("Pixel counts do not describe a valid canopy mask.")
    missing = footprint_pixels - observed_pixels
    return {
        "footprint_within_raster_ha": footprint_pixels * cell_area / 10000,
        "observed_land_ha": observed_pixels * cell_area / 10000,
        "canopy_ha": canopy_pixels * cell_area / 10000,
        "missing_ha": missing * cell_area / 10000,
        "canopy_share_of_observed_pct": 100 * canopy_pixels / observed_pixels if observed_pixels else None,
        "observed_share_of_footprint_pct": 100 * observed_pixels / footprint_pixels if footprint_pixels else None,
        "missingness_lower_pct": 100 * canopy_pixels / footprint_pixels if footprint_pixels else None,
        "missingness_upper_pct": 100 * (canopy_pixels + missing) / footprint_pixels if footprint_pixels else None,
    }


def read_mask(raster_path, footprint_path):
    import rasterio
    from rasterio.features import geometry_mask

    geometries = polygon_geometries(json.loads(Path(footprint_path).read_text()))
    if not geometries or any(not geometry or geometry.get("type") not in {"Polygon", "MultiPolygon"} for geometry in geometries):
        raise ValueError("The footprint must contain polygon geometry.")
    with rasterio.open(raster_path) as source:
        if source.count != 1 or not source.crs or not source.crs.is_projected:
            raise ValueError("Use a one-band raster in a projected metre-based equal-area CRS.")
        if not math.isclose(source.crs.linear_units_factor[1], 1):
            raise ValueError("The raster CRS must use metres.")
        if source.nodata in {0, 1}:
            raise ValueError("NoData must differ from the observed mask values 0 and 1.")
        transform = source.transform
        area = abs(transform.a * transform.e - transform.b * transform.d)
        if may_extend_beyond_raster(geometries, source.bounds):
            raise ValueError("The raster must cover the footprint. Pad uncovered areas with NoData.")
        canopy = observed = footprint = 0
        for _, window in source.block_windows(1):
            values = source.read(1, window=window, masked=True)
            inside = geometry_mask(geometries, out_shape=values.shape, transform=source.window_transform(window), invert=True)
            known = inside & ~values.mask
            if ((values.data != 0) & (values.data != 1) & known).any():
                raise ValueError("Observed mask values must be either 0 or 1.")
            canopy += int(((values.data == 1) & known).sum())
            observed += int(known.sum())
            footprint += int(inside.sum())
        return summarize(canopy, observed, footprint, area)


def may_extend_beyond_raster(geometries, bounds):
    from rasterio.features import bounds as polygon_bounds

    return any(
        west < bounds.left or east > bounds.right or south < bounds.bottom or north > bounds.top
        for west, south, east, north in map(polygon_bounds, geometries)
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mask")
    parser.add_argument("footprint")
    args = parser.parse_args()
    print(json.dumps(read_mask(args.mask, args.footprint), indent=2))


if __name__ == "__main__":
    main()
