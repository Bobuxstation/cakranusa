const { app } = require('@electron/remote');
const fs = require('fs');
const path = require('path');

//save game
function saveGame(saveName, overwrite, quit = false) {
    if (saveName.trim().length == 0) {
        newNotification("Invalid file name!");
        return;
    };

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
    if (fs.existsSync(targetPath) & !overwrite) {
        newNotification("Save file already exists!");
        return;
    }

    fs.writeFileSync(targetPath, JSON.stringify(saveData, null, 2), 'utf-8');
    newNotification("Game saved!");
    if (quit) quitGame();
}

//list all saves
function listJsonSaves(saveMode, quit, div) {
    let savesDiv = document.getElementById(div);
    savesDiv.innerHTML = '';

    let saveBox = document.createElement("div");
    if (saveMode) savesDiv.appendChild(saveBox);
    if (saveMode) savesDiv.appendChild(document.createElement("hr"));

    let textbox = document.createElement("input");
    textbox.placeholder = "File name here..."
    textbox.className = "saveName";
    saveBox.appendChild(textbox);

    let saveButton = document.createElement("button");
    saveButton.innerHTML = `<i class="fa-solid fa-floppy-disk"></i>`;
    saveButton.className = "deleteSave";
    saveButton.onclick = () => {
        openTab('', 'tab', true);
        saveGame(textbox.value, false, quit);
    };
    saveBox.appendChild(saveButton);

    let savesDir = path.join(app.getPath('userData'), 'saves');
    if (!fs.existsSync(savesDir)) { return []; }

    let files = fs.readdirSync(savesDir).filter(file => file.endsWith('.json')).sort((a, b) => fs.statSync(path.join(savesDir, a)).mtime.getTime() - fs.statSync(path.join(savesDir, b)).mtime.getTime()).reverse();
    files.forEach(element => {
        let fileStat = fs.statSync(path.join(savesDir, element));
        let card = document.createElement("div");

        let button = document.createElement("button");
        button.className = "saveName";
        if (saveMode) {
            button.onclick = () => {
                openTab('', 'tab', true);
                saveGame(element.slice(0, -5), true, quit);
            };
        } else {
            button.onclick = () => {
                initScene(false, JSON.parse(fs.readFileSync(path.join(savesDir, element), 'utf-8')));
                document.getElementById("logoImage").style.display = "none";
                document.getElementById("splashtext").style.display = "none";
                document.getElementById("titleButtons").style.display = "none";
                document.getElementById("titleLoad").style.display = "block";
                openTab('', 'titleTab', true)
            };
        };
        card.appendChild(button);

        let saveName = document.createElement("b");
        saveName.innerText = element.slice(0, -5);
        button.appendChild(saveName);

        button.appendChild(document.createElement("br"));

        let saveDate = document.createElement("i");
        saveDate.innerText = `${(fileStat.size * 0.000001).toFixed(2)}MB - ${(new Date(fileStat.mtime.getTime())).toLocaleString()}`;
        button.appendChild(saveDate);

        let deleteButton = document.createElement("button");
        deleteButton.className = "deleteSave";
        deleteButton.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
        deleteButton.onclick = () => {
            fs.unlinkSync(path.join(savesDir, element));
            listJsonSaves(saveMode, quit, div);
        };
        card.appendChild(deleteButton);

        savesDiv.appendChild(card);
    });
};