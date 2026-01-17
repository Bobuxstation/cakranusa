// render road model on tile based on neighbors
async function setRoadModel(directions, tile, isUpdate) {
    let object

    if (meshLocations[tile.index]) scene.remove(meshLocations[tile.index]);
    if (Object.values(directions).length > 3) {
        // 4 way intersection
        object = await loadWMat(`${tile.model}_intersection_4`);
    } else if (Object.values(directions).length == 3) {
        // 3 way intersection
        object = await loadWMat(`${tile.model}_intersection_3`);

        let north = typeof directions.north == "undefined";
        let east = typeof directions.east == "undefined";
        let south = typeof directions.south == "undefined";
        let west = typeof directions.west == "undefined";

        if (north) {
            object.rotation.set(0, Math.PI * 1.5, 0);
        } else if (south) {
            object.rotation.set(0, Math.PI / 2, 0);
        } else if (east) {
            object.rotation.set(0, Math.PI * 2, 0);
        } else if (west) {
            object.rotation.set(0, Math.PI, 0);
        }
    } else {
        let northwest = typeof directions.north != "undefined" && typeof directions.west != "undefined";
        let northeast = typeof directions.north != "undefined" && typeof directions.east != "undefined";
        let southwest = typeof directions.south != "undefined" && typeof directions.west != "undefined";
        let southeast = typeof directions.south != "undefined" && typeof directions.east != "undefined";

        if (northwest || northeast || southwest || southeast) {
            // turn road
            object = await loadWMat(`${tile.model}_intersection_turn`);

            if (northwest) {
                object.rotation.set(0, Math.PI * 2, 0);
            } else if (northeast) {
                object.rotation.set(0, Math.PI / 2, 0);
            } else if (southwest) {
                object.rotation.set(0, Math.PI * 1.5, 0);
            } else if (southeast) {
                object.rotation.set(0, Math.PI, 0);
            }
        } else {
            // straight road
            object = await loadWMat(`${tile.model}_straight`);

            if (typeof directions.east != "undefined" || typeof directions.west != "undefined") {
                object.rotation.set(0, Math.PI / 2, 0);
            }
        }
    }

    object.position.set(tile["posX"], tile["posY"] + 0.12, tile["posZ"]);
    object.scale.setScalar(0.1565);
    scene.add(object);

    meshLocations[tile.index] = object;
    if (isUpdate) return;
    animMove(object, true);
}

// check neighbor of tiles for roads (north, east, south, west)
function checkNeighborForRoads(x, z, rand, all = false) {
    const north = sceneData.flat().find(item => item.posX == x && item.posZ == z + 1 && item.type == 2);
    const south = sceneData.flat().find(item => item.posX == x && item.posZ == z - 1 && item.type == 2);
    const east = sceneData.flat().find(item => item.posX == x + 1 && item.posZ == z && item.type == 2);
    const west = sceneData.flat().find(item => item.posX == x - 1 && item.posZ == z && item.type == 2);

    const directions = {};
    if (north) directions.north = north;
    if (south) directions.south = south;
    if (east) directions.east = east;
    if (west) directions.west = west;

    const directionRotation = {
        north: (Math.PI / 2),
        south: -(Math.PI / 2),
        east: Math.PI,
        west: Math.PI * 2
    };

    if (all) {
        return directions;
    }

    if (Object.values(directions).length > 0) {
        if (rand) {
            const pick = Math.floor(Math.random() * Object.values(directions).length);
            return {
                tile: Object.values(directions)[pick],
                direction: Object.keys(directions)[pick],
                rot: directionRotation[Object.keys(directions)[pick]],
            };
        } else {
            return {
                tile: Object.values(directions)[0],
                direction: Object.keys(directions)[0],
                rot: directionRotation[Object.keys(directions)[0]]
            };
        }
    }

    return false;
}