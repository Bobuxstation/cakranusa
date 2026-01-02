//popup title bar
function infoHeading(text) {
    let elem = document.createElement("div");
    elem.innerText = text;
    elem.className = 'infoHeading';

    return elem;
}

//popup warning bubbles
function infoWarning(text) {
    let elem = document.createElement("div");
    elem.innerText = `⚠ ${text}`;
    elem.className = 'infoWarning';

    return elem;
}

//popup progress bar
function infoProgress(value, max) {
    let elem = document.createElement("progress");
    elem.value = value;
    elem.max = max;
    elem.className = 'infoProgress';

    return elem;
}

//popup information table
function infoTable(array) {
    let elem = document.createElement("div");
    elem.className = 'infoTable';

    Object.keys(array).forEach(key => {
        let value = array[key];
        let row = document.createElement("span");
        row.innerText = `${key}: ${value}`;
        elem.appendChild(row);

        let br = document.createElement("br");
        elem.appendChild(br);
    });

    return elem;
}

//parse tile data for popup
let updateInfo = 0;
function tileInfo(tile) {
    if (tile.index != updateInfo) {
        updateInfo = tile.index;
    } else if (floatingDiv.style.display == 'block') {
        floatingDiv.innerText = '';
        switch (tile.type) {
            case 4:
                floatingDiv.appendChild(infoHeading(tile.building));
                floatingDiv.appendChild(infoProgress(citizensInTile(tile), tile.buildingData.slots));
                floatingDiv.appendChild(infoTable({
                    "Citizen(s) using facility": `${citizensInTile(tile)}/${tile.buildingData.slots}`,
                }));
                break;
            case 3:
                if (!tile.occupied) {
                    //zone for sale
                    floatingDiv.appendChild(infoHeading(`${tile.zone}`));
                    floatingDiv.appendChild(infoWarning(`No demands for ${tile.zone}!`));
                } else {
                    //occupied zone
                    floatingDiv.appendChild(infoHeading(`${tile.zone}`));
                    let tableData = {};

                    //warnings
                    if (tile.burning) floatingDiv.appendChild(infoWarning("Building on fire!"));
                    if (tile.zone == "housing") {
                        let tileJobless = citizens[tile.index] ? citizens[tile.index].filter(u => u.job == false).length : 0;
                        let tileHealth = citizens[tile.index] ? citizens[tile.index].filter(u => u.health < 50).length : 0;
                        if (tileJobless != 0) floatingDiv.appendChild(infoWarning(`${tileJobless} citizen(s) unemployed!`));
                        if (tileHealth != 0) floatingDiv.appendChild(infoWarning(`${tileHealth} citizen(s) require medical attention!`));
                        if (checkResidents(tile).length == 0) floatingDiv.appendChild(infoWarning("Building abandoned!"));

                        //building residents
                        tableData["Residents"] = `${checkResidents(tile).length}/${tile.slot}`;
                        floatingDiv.appendChild(infoProgress(checkResidents(tile).length, tile.slot));
                    } else {
                        if (checkEmployees(tile).length == tile.slot) floatingDiv.appendChild(infoWarning("No longer accepting workers!"));
                        if (checkEmployees(tile).length == 0) floatingDiv.appendChild(infoWarning("No workers!"));

                        //building workers
                        tableData["Workers"] = `${checkEmployees(tile).length}/${tile.slot}`;
                        tableData["Min. education level"] = `${tile.buildingData.level}`;
                        floatingDiv.appendChild(infoProgress(checkEmployees(tile).length, tile.slot));
                    }

                    //add table data
                    floatingDiv.appendChild(infoTable(tableData));
                };
                break;
            case 2:
                floatingDiv.appendChild(infoHeading(`Road`));
                if (tile.quality < 75) floatingDiv.appendChild(infoWarning("Road below standard quality!"));

                floatingDiv.appendChild(infoProgress(tile.quality, 100));
                floatingDiv.appendChild(infoTable({
                    "Quality": `${tile.quality}/100`,
                    "Vehicles Passing": citizensInTile(tile)
                }));
                break;
            case 1:
                floatingDiv.appendChild(infoHeading(`Tree`));
                floatingDiv.appendChild(infoTable({
                    "Type": tile.foliageType
                }));
                break;
            default:
                floatingDiv.appendChild(infoTable(tile));
                break;
        }
    };
}