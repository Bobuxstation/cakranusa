function findPoints(grid) {
  let start, end;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 2) start = { x, y };
      if (grid[y][x] === 3) end = { x, y };
    }
  }
  return { start, end };
}

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// a-star pathfinding
function astar(grid) {
  const height = grid.length;
  const width = grid[0].length;

  let start, end;

  // Find start (2) and target (3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 2) start = { x, y };
      if (grid[y][x] === 3) end = { x, y };
    }
  }

  if (!start || !end) return null;

  const heuristic = (a, b) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const directions = [
    { x: 0, y: -1, dir: "up", rot: -(Math.PI / 2) },
    { x: 0, y: 1, dir: "down", rot: (Math.PI / 2) },
    { x: -1, y: 0, dir: "left", rot: -Math.PI },
    { x: 1, y: 0, dir: "right", rot: Math.PI * 2 }
  ];

  const openSet = [];
  const closedSet = new Set();

  openSet.push({
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null,
    direction: "start"
  });

  while (openSet.length > 0) {
    // Lowest f-cost
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();

    const key = `${current.x},${current.y}`;
    closedSet.add(key);

    // Reached target
    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let node = current;
      while (node) {
        path.push({
          x: node.x,
          y: node.y,
          direction: node.direction,
          rot: node.rot
        });
        node = node.parent;
      }
      return path.reverse();
    }

    for (const d of directions) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;

      if (
        nx < 0 || nx >= width ||
        ny < 0 || ny >= height
      ) continue;

      const cell = grid[ny][nx];
      if (cell === 0) continue;

      const nKey = `${nx},${ny}`;
      if (closedSet.has(nKey)) continue;

      const g = current.g + 1;
      const h = heuristic({ x: nx, y: ny }, end);
      const f = g + h;

      const existing = openSet.find(n => n.x === nx && n.y === ny);

      if (!existing || g < existing.g) {
        const node = {
          x: nx,
          y: ny,
          g,
          h,
          f,
          parent: current,
          direction: d.dir,
          rot: d.rot
        };

        if (existing) {
          Object.assign(existing, node);
        } else {
          openSet.push(node);
        }
      }
    }
  }

  return null; // No path found
}

//find coordinate of tile
function findTileCoordinate(map, tile) {
  let posY = map.find(item => (item.indexOf(tile) != -1));
  let posX = posY.indexOf(tile);
  posY = map.indexOf(posY);

  return { x: posX, y: posY };
}

//convert map for pathfinder
function convertPathfind(map, origin, target) {
  //get coordinates of origin and target
  let originPos = findTileCoordinate(map, origin);
  let targetPos = findTileCoordinate(map, target);
  let newMap = []

  //make suitable map for pathfinder
  for (var y = 0; y < map[0].length; y++) {
    newMap[y] = newMap[y] ? newMap[y] : [];
    for (var x = 0; x < map.length; x++) {
      if (map[y][x].type == 2) newMap[y][x] = 1;
      else if (y == originPos.y & x == originPos.x) newMap[y][x] = 2;
      else if (y == targetPos.y & x == targetPos.x) newMap[y][x] = 3;
      else newMap[y][x] = 0;
    }
  }

  return newMap;
}