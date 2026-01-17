var tutorial = {
    "Home": `
        Welcome! <br><br>
        You can get all the information you need regarding gameplay on this tab. 
        To inquire about gameplay, start by selecting the topic you want on the left side of this menu. <br><br>
        Good Luck!
    `,
    "Zoning": `
        Lands, you got a lot of them. You, as the government, need to urbanise and improve this place so that it can be the town you envision. One of the most important things you need to do to achieve this is to sell some of the lands you have to let the people build buildings that can benefit the city. These buildings will need plumbings, electricity, and other stuff connected to them. Refer to the Services section for that.
    `,
    "Commercial": `
        Small businesses build communities they say. Here, they can also be a perfect pick for when you are just starting out with not a lot of citizens living. They will generate you a respectable revenue, which will benefit you obviously. Not only that,compared to industrial buildings which can be very detrimental to the environment, commercials doesn't impact their surroundings as much, making them very eco-friendly compared to it! As your citry grow however, your residents are going to exponentially increase. This is where commercials falls off, as it cannot employ that much people (most do not even employ 10 employees). It is overall a very inefficient use of land when it comes to employment later on 
    `,
    "Industral": `
        Indusrty, it's where products can be mass-produced, & where most of the products in our supermarket comes from. Similarly, one of the building you can put here are Industrial buildings. They are massive buildings (well, they're supposed to be at least), & having them will result in you earning a respecatble amount of revenue. With a big building, comes big workforce too, as it employs alot of people per-building. This is great for late-game urbanisation, as it means that alot of residents can get employed and do work compared to commercial buildings. With big operations, comes big repercussions however. Industrial buildings will affect the environment significantly. It can emit alot of carbon pollution and make the air people breathe dirty. If not careful, it can be very detrimental to the city you're supposed to keep clean and healthy.
    `
}

var errors = {
    "occupiedTile": "Cannot build here: Tile already occupied!",
    "roadConnection": "Cannot build here: Missing road connection!",
    "noMoney": "Cannot build here: Insufficient funds"
}

Object.keys(tutorial).forEach((item, i) => {
    const button = document.createElement("button");
    button.className = 'tutorialTabButton'
    button.innerText = item;
    button.onclick = () => { openTab(`${item}`, 'tutorialTab') };

    const tab = document.createElement("div");
    tab.className = "tutorialTab innertab";
    tab.id = item;
    tab.innerHTML = tutorial[item];

    if (i == 0) { tab.style.display = "block"; button.classList.add("selected") };
    document.getElementById("tutorialLeft").appendChild(button);
    document.getElementById("tutorialRight").appendChild(tab);
});