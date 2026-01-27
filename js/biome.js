function worleyNoiseSeeded(x, y, cellSize = 1, seed = 1) {
    x /= cellSize;
    y /= cellSize;

    const ix = Math.floor(x);
    const iy = Math.floor(y);
    let minDist = Infinity;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const cx = ix + dx;
            const cy = iy + dy;

            // Feature point inside the cell
            const fx = cx + hash2D(cx, cy, seed);
            const fy = cy + hash2D(cx, cy, seed + 1);

            const dist = Math.hypot(x - fx, y - fy);
            minDist = Math.min(minDist, dist);
        }
    }

    return minDist;
}

function hash2D(x, y, seed) {
    let h = x * 374761393 + y * 668265263 + seed * 1442695040888963407;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function worley01Seeded(x, y, cellSize, seed) {
    const d = worleyNoiseSeeded(x, y, cellSize, seed);
    return Math.min(d / Math.SQRT2, 1);
}