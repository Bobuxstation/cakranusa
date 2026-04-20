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
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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

      let reversedPath = path.reverse();
      reversedPath.at(-1).direction = reversedPath.at(-2).direction;
      reversedPath.at(-1).rot = reversedPath.at(-2).rot;
      reversedPath.at(0).direction = reversedPath.at(1).direction;
      reversedPath.at(0).rot = reversedPath.at(1).rot;

      return reversedPath;
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
  return { x: posY.indexOf(tile), y: map.indexOf(posY) };
}

//get vehicle position for next step & adjust to road type and lane
function getNextPosition(data, targetPos, currentStep) {
  let laneDisplacement = data.isWalking ? 0.35 : 0.15;
  let nextStep = data.targetRoute[currentStep + 2] || targetPos;
  let changePos = { x: data.location.y - (sceneData[0].length / 2), y: sceneData[data.location.y][data.location.x].height + 0.125, z: data.location.x - (sceneData[0].length / 2) };

  if (targetPos.direction != nextStep.direction) {
    //set corner turn (going to corner tile)
    if (["upright", "downleft", "leftup", "rightdown"].includes(`${targetPos.direction}${nextStep.direction}`)) data.sharpCorner = true;
    else data.largeCorner = true;
    data.cornerCounter = 0;

    //go straight (to corner tile)
    if (targetPos.direction == "left") changePos.x -= laneDisplacement;
    else if (targetPos.direction == "right") changePos.x += laneDisplacement;
    else if (targetPos.direction == "down") changePos.z -= laneDisplacement;
    else if (targetPos.direction == "up") changePos.z += laneDisplacement;
  } else {
    //get corner turn (if going from corner tile)
    let forward = 0;
    if (data.sharpCorner) forward = laneDisplacement;
    else if (data.largeCorner) forward = (laneDisplacement * -1);

    //go straight (straight tile)
    if (targetPos.direction == "left") { changePos.x -= laneDisplacement; changePos.z -= forward }
    else if (targetPos.direction == "right") { changePos.x += laneDisplacement; changePos.z += forward }
    else if (targetPos.direction == "down") { changePos.z -= laneDisplacement; changePos.x += forward }
    else if (targetPos.direction == "up") { changePos.z += laneDisplacement; changePos.x -= forward };

    //finish corner turns (if going from corner tile)
    if (data.cornerCounter > 1) {
      if (data.cornerCounter) delete data.cornerCounter;
      if (data.sharpCorner) delete data.sharpCorner;
      if (data.largeCorner) delete data.largeCorner;
    } else if (typeof data.cornerCounter != "undefined") data.cornerCounter++;
  }

  return changePos;
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

//walk or drive to destination
function shouldWalk(path) {
  var tiles = (path.map(step => sceneData[step.y][step.x])).filter(tile => tile.type == 2);
  var walkableTiles = tiles.filter(tile => transport[tile.roadType].walkable);

  if (tiles.length > 24) return false;
  else if (tiles.length <= 12) return true;
  else if ((walkableTiles.length / tiles.length) > 0.5) return true;
  else return false;
}