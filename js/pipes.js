// render pipe model on tile based on neighbors
async function setPipeModel(directions, tile, type) {
    let typeModel = underground[type].model;
    let object

    if (undergroundGroups[type][tile.index]) scene.remove(undergroundGroups[type][tile.index]);
    if (Object.values(directions).length > 3) {
        // 4 way intersection
        object = await loadWMat(`${typeModel}_intersection_4`);
    } else if (Object.values(directions).length == 3) {
        // 3 way intersection
        object = await loadWMat(`${typeModel}_intersection_3`);

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
            // turn pipe
            object = await loadWMat(`${typeModel}_intersection_turn`);

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
            // straight pipe
            object = await loadWMat(`${typeModel}_straight`);

            if (typeof directions.east != "undefined" || typeof directions.west != "undefined") {
                object.rotation.set(0, Math.PI / 2, 0);
            }
        }
    }

    object.position.set(tile["posX"], tile["posY"] + 0.12, tile["posZ"]);
    object.scale.setScalar(0.1565);
    scene.add(object);

    undergroundGroups[type][tile.index] = object;
}

// check neighbor of tiles for pipes (north, east, south, west)
function checkNeighborForPipes(x, z, type) {
    const north = sceneData.flat().find(item => item.posX == x && item.posZ == z + 1 && item[type]);
    const south = sceneData.flat().find(item => item.posX == x && item.posZ == z - 1 && item[type]);
    const east = sceneData.flat().find(item => item.posX == x + 1 && item.posZ == z && item[type]);
    const west = sceneData.flat().find(item => item.posX == x - 1 && item.posZ == z && item[type]);
    const directions = {};

    if (north) directions.north = north;
    if (south) directions.south = south;
    if (east) directions.east = east;
    if (west) directions.west = west;

    if (directions.length != 0) return directions; 
    return false;
}