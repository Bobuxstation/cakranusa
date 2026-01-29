const { app } = require('@electron/remote');
const fs = require('fs');
const path = require('path');

//save game
function saveGame(saveName) {
    let targetPath = path.join(app.getPath('userData'), "/saves", `${saveName}.json`);
    let saveData = {
        "saveName": saveName,
        "sceneData": sceneData,
        "citizens": citizens,
        "money": money,
        "date": date,
        "officials": officials,
        "budget": budget,
        "taxes": taxes,
        "worldSeed": worldSeed
    }

    let dir = path.join(app.getPath('userData'), '/saves');
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    fs.writeFileSync(targetPath, JSON.stringify(saveData, null, 2), 'utf-8');
}

function listJsonSaves() {
    let savesDiv = document.getElementById("saves");
    savesDiv.innerHTML = '';

    let savesDir = path.join(app.getPath('userData'), 'saves');
    if (!fs.existsSync(savesDir)) { return []; }

    let files = fs.readdirSync(savesDir).filter(file => file.endsWith('.json'));
    files.forEach(element => {
        let button = document.createElement("button");
        button.innerText = element;
        button.onclick = () => {
            initScene(false, JSON.parse(fs.readFileSync(path.join(savesDir, element), 'utf-8')));
            
            openTab('', 'tab', true);
            document.getElementById("titleButtons").style.display = "none";
            document.getElementById("titleLoad").style.display = "block";
        }

        savesDiv.appendChild(button);
    });
}; listJsonSaves();