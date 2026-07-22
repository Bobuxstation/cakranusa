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

//citizen profile
function profileShortcut(citizen) {
    let elem = document.createElement("u");
    elem.innerText = citizen.name;
    elem.className = 'profileShortcut';
    elem.style.cursor = "pointer";
    elem.onclick = () => { profilePage(citizen); }

    let br = document.createElement("br");
    elem.appendChild(br);

    return elem;
}

//parse tile data for popup
let updateInfo = 0;
async function tileInfo(tile) {
    if (tile.index != updateInfo) {
        updateInfo = tile.index;
    } else if (floatingDiv.style.display == 'block') {
        floatingDiv.innerText = '';

        switch (tile.type) {
            case 4:
                floatingDiv.appendChild(infoHeading(await translate(tile.building)));
                if (!structures[tile.building].slots) break;

                floatingDiv.appendChild(infoProgress(citizensInTile(tile), eval(structures[tile.building].slots)));
                floatingDiv.appendChild(infoTable({ [await translate("Citizen(s) using facility")]: `${citizensInTile(tile)}/${eval(structures[tile.building].slots)}`}));
                citizensInTile(tile, true).forEach(citizen => { floatingDiv.appendChild(profileShortcut(citizen)) });
                break;
            case 3:
                if (!tile.occupied) {
                    //zone for sale
                    floatingDiv.appendChild(infoHeading(`${await translate(tile.zone)}`));
                    floatingDiv.appendChild(infoWarning(`${await translate("No demands for")} ${await translate(tile.zone)}!`));
                } else {
                    //occupied zone
                    floatingDiv.appendChild(infoHeading(`${await translate(tile.zone)}`));

                    //resident info and warning labels
                    tile.warnings.forEach(e => floatingDiv.appendChild(infoWarning(e)));
                    if (tile.zone == "housing") {
                        floatingDiv.appendChild(infoProgress(checkResidents(tile).length, tile.slot));
                        floatingDiv.appendChild(infoTable({ [await translate("Residents")]: `${checkResidents(tile).length}/${tile.slot}` }))
                        checkResidents(tile).forEach(citizen => { floatingDiv.appendChild(profileShortcut(citizen)) });
                    } else {
                        floatingDiv.appendChild(infoProgress(checkEmployees(tile).length, tile.slot));
                        floatingDiv.appendChild(infoTable({
                            [await translate("Workers")]: `${checkEmployees(tile).length}/${tile.slot}`,
                            [await translate("Min. education level")]: `${await translate(education.find(item => structures[item].education == allZones[tile.zone][tile.buildingModel].level - 1) || "basic education")}`
                        }))
                        checkEmployees(tile).forEach(citizen => { floatingDiv.appendChild(profileShortcut(citizen)) });
                    }
                };
                break;
            case 2:
                floatingDiv.appendChild(infoHeading(await translate(`road`)));
                if (tile.qualityState < 75) floatingDiv.appendChild(infoWarning(await translate("roadquality")));

                floatingDiv.appendChild(infoProgress(tile.qualityState, 100));
                floatingDiv.appendChild(infoTable({
                    [await translate("Quality")]: `${tile.qualityState}/100`,
                    [await translate("Vehicles Passing")]: citizensInTile(tile)
                }));
                break;
            case 1:
                floatingDiv.appendChild(infoHeading(await translate(tile.foliageType)));
                break;
            default:
                floatingDiv.appendChild(infoTable(tile));
                break;
        }
    };
}