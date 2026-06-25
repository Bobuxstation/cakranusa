// get preferred language
var prefLang = localStorage.getItem("prefLang") || "en";
var langData, langUnavailable = {};

// translate text or load from cache if already translated
async function translate(word) {
    langData ??= await (await fetch(`./local/${prefLang}.json`)).json();
    if (/^\s+$/.test(word) || word == "") return word;
    else if (langData.interface[word]) return langData.interface[word];
    else {
        langUnavailable[word] = "";
        return `?${word}`;
    };
};

// start translation for each element types
async function startAutomaticTranslation() {
    for (let item of document.getElementsByTagName("span")) {
        item.innerText = await translate(item.innerText, prefLang)
    }

    for (let item of document.getElementsByTagName("option")) {
        item.innerText = await translate(item.innerText, prefLang)
    }

    for (let item of document.getElementsByTagName("*")) {
        if (item.title) {
            item.title = await translate(item.title, prefLang)
        } else if (item.placeholder) {
            item.placeholder = await translate(item.placeholder, prefLang)
        }
    }
}

function loadTutorial() {
    document.getElementById("tutorialLeft").innerText = "";
    document.getElementById("tutorialRight").innerText = "";

    Object.keys(langData.tutorial).forEach((item, i) => {
        const button = document.createElement("button");
        button.className = 'tutorialTabButton'
        button.innerText = item;
        button.name = item;
        button.onclick = () => { openTab(`${item}`, 'tutorialTab') };

        const tab = document.createElement("div");
        tab.className = "tutorialTab innertab";
        tab.id = item;
        tab.innerHTML = langData.tutorial[item];

        if (i == 0) { tab.style.display = "block"; button.classList.add("selected") };
        document.getElementById("tutorialLeft").appendChild(button);
        document.getElementById("tutorialRight").appendChild(tab);
    });
}