let loaded = {};

//========================
// Zoned buildings preset
//========================

//residential buildings
let houses = {
    'assets/residential/house-1': {
        "level": 2,
        "slots": 3,
    },
    'assets/residential/house-2': {
        "level": 3,
        "slots": 4
    }
};

//commercial buildings
let commercial = {
    'assets/commercial/shop-1': {
        "level": 1,
        "slots": 3,
    }
};

//industrial buildings
let industrial = {
    'assets/commercial/shop-1': {
        "level": 1,
        "slots": 3,
    }
};

//farm buildings
let farm = {
    'assets/farm/farm-1': {
        "level": 1,
        "slots": 5,
    }
};

//========================
// Build Menu
//========================

let foliage = [
    //'assets/Tree.glb',
    //'assets/Tree2.glb',
    'assets/Tree3.glb'
];

//zone types
let zones = {
    "housing": {
        "model": "assets/zoning/housing"
    },
    "commercial": {
        "model": "assets/zoning/commercial"
    },
    "industrial": {
        "model": "assets/zoning/industrial"
    },
    "farm": {
        "model": "assets/zoning/farm"
    },
}

//transport types
let transport = {
    "road": {
        "model": "assets/roads/road"
    }
}

//govt facility
let facility = {
    "hospital": {
        "model": "assets/facility/hospital",
        "type": "medical",
        "range": 8
    },
    "elementary school": {
        "model": "assets/facility/sd",
        "type": "education",
        "level": 2,
        "capacity": 16
    }
}

//for build menu
let buildmenu = {
    "Zones": zones,
    "Transport": transport,
    "Facility": facility
}

//fill build menu
Object.keys(buildmenu).forEach((item, i) => {
    const button = document.createElement("button");
    button.innerText = item;
    button.onclick = () => { openTab(`${item}`, 'buildTab') };

    const tab = document.createElement("div");
    tab.className = "buildTab innertab";
    tab.id = item;
    if (i == 0) tab.style.display = "block";

    Object.keys(buildmenu[item]).forEach(subItem => {
        const subItemButton = document.createElement("button");
        subItemButton.innerText = subItem;
        subItemButton.onclick = () => { setTool(subItem, item) };

        tab.appendChild(subItemButton);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});