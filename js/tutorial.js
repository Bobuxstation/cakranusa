var tutorial = {
    "Home": `
        <b>Welcome!</b> <br><br>

        You can get all the information you need regarding gameplay on this tab. 
        To inquire about gameplay, start by selecting the topic you want on the left side of this menu. <br><br>
        Good Luck!
    `,
    "Zoning": `
        Lands, you got a lot of them. <br><br>

        As the government, you need to urbanise and improve this place so that it can be the town you envision. 
        One of the most important things you need to do to achieve this is to sell some of the lands you have to let 
        the people build buildings that can benefit the city.
    `,
    "Commercial Industry and Farms": `
        In order for the citizens to feed themselves, they need somewhere to work. <br><br>
        
        <b>Farm</b><br>
        Farms does not require higher education requirements. They also do not pay well but is a great option for starting cities. 
        Farms employ a significant amount of people, does not affect the air quality but exhausts their workers. Once citizens have better
        education, they will stop working in farms and work at another job if given the opportunity<br><br>

        <b>Commercial</b><br>
        Commercial workplaces generally require higher education qualification. But pay well and employ a significant
        amount of people. Commercial workplaces does not affect the air quality and does not exhaust their workers.<br><br>

        <b>Industrial</b><br>
        Industrial workplaces generally require higher education qualification. But pay well and employ a significant
        amount of people. Industrial workplaces affects the air quality and exhaust their workers.
    `,
    "Supply": `
        It is an obligation for the city to supply its citizens with necessary supplies<br><br>

        <b>Capacity and networks</b><br>
        Services can only supply a fixed amount on the network. The more houses there are on a network the higher their consumption is.
        Which is why you should build more services on demand. Keep an eye out on the <i>Supply Tab</i> for any networks nearing its
        full capacity.<br><br>

        <b>Water</b><br>
        Water can be obtained by building water pumps. You can then place down water pipes from the pump to the citizens' houses.<br><br>

        <b>Electricity</b><br>
        Electricity can be made using solar panels or wind turbines. You can then place down cables from the generators to the citizens' houses.
    `,
    "Education": `
        Education is crucial for a growing city. <br><br>

        There are 3 levels of education. Make sure you build all of them when you have the funds. Higher education leads to a better
        opportunity for the citizen. They also improve moral values for when they have to work in government.
    `,
    "Fire Department and Healthcare": `
        Fire department and healthcare are important facilities which should be built immediately at the start of the game<br><br>
        
        <b>Fire department</b><br>
        Buildings have a small chance of catching on fire. If they are left to burn the effects would be devastating.<br><br>

        <b>Healthcare</b><br>
        From working, citizens health can worsen over time. Which is why a healthcare facility is important. Otherwise, they may fall sick and eventually pass away.
    `,
    "Taxes": `
        Our budget primarily come from taxes. <br><br>

        Salary tax is collected everyday, while land and transportation taxes is collected monthly. In order to collect land and transportation
        taxes, a tax office must be built. Adjusting tax rates also has consequences. If the tax rates are too high, approval plummets and
        citizens will complain or even move out.
    `,
    "Budget": `
        Sometimes our funds are not enough, which is why budget cuts have to be made. <br><br>

        A department's efficiency is linked to its budget. Which is why when the budget is high, the department will function well. While
        if the budget is low, the department will not function well and resort to corruption and bribery.
    `,
    "Tourism": `
        Other than taxes, you can also build tourist sites to add a bit more to the budget. <br><br>

        Building tourist sites attracts tourists from other cities. Letting the city make more money. Air quality affects potential tourism.
    `,
    "Road Quality": `
        Due to weather conditions and budget, road quality degrades overtime.<br><br>

        A damaged road takes longer to pass through. You can check a road's quality by clicking on it. If it is below 75, replace it by 
        building a road over it.
    `,
};

var splashtext = [
    "With corruption!",
    "100% Not rushed",
    "Where are the promised housing zones?",
    "Disasters coming soon!",
    "Electricity not included",
    "0% Employment rates!",
    "Write it down, @poskita",
    "Yes, we will fix the broken roads",
    "32 Road tiles!",
    "has the keys!",
    "Stop cutting down those trees!",
    "Water not included",
    "Models by TAR",
    "Brought to you by Perintis Interactive"
];

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