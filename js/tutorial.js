var tutorial = {
    "Home": `
        Welcome! <br><br>
        You can get all the information you need regarding gameplay on this tab. 
        To inquire about gameplay, start by selecting the topic you want on the left side of this menu. <br><br>
        Good Luck!
    `,
    "Zoning": "Zoning lets citizens acquire a piece of land for a set purpose (Housing, Commercial, Industrial, Farm)"
}

var errors = {
    "occupiedTile": "Cannot build here: Tile already occupied!",
    "roadConnection": "Cannot build here: Missing road connection!",
    "noMoney": "Cannot build here: Insufficient funds"
}

Object.keys(tutorial).forEach((item, i) => {
    const button = document.createElement("button");
    button.innerText = item;
    button.onclick = () => { openTab(`${item}`, 'tutorialTab') };

    const tab = document.createElement("div");
    tab.className = "tutorialTab innertab";
    tab.id = item;
    tab.innerHTML = tutorial[item];

    if (i == 0) tab.style.display = "block";
    document.getElementById("tutorialLeft").appendChild(button);
    document.getElementById("tutorialRight").appendChild(tab);
});