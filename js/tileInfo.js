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
    elem.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`;
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
                if (!tile.buildingData.slots) break;
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

                    //resident info and warning labels
                    tile.warnings.forEach(e => floatingDiv.appendChild(infoWarning(e)));
                    if (tile.zone == "housing") {
                        tableData["Residents"] = `${checkResidents(tile).length}/${tile.slot}`;
                        floatingDiv.appendChild(infoProgress(checkResidents(tile).length, tile.slot));
                    } else {
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
                if (tile.qualityState < 75) floatingDiv.appendChild(infoWarning("Road below standard quality!"));

                floatingDiv.appendChild(infoProgress(tile.qualityState, 100));
                floatingDiv.appendChild(infoTable({
                    "Quality": `${tile.qualityState}/100`,
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