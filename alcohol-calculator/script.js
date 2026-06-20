// 1. Define drink properties in a single configuration object
const DRINK_PROPERTIES = {
    beer:   { size: 500, percent: 5 },
    wine:   { size: 150, percent: 12 },
    vodka:  { size: 40,  percent: 40 },
    whisky: { size: 40,  percent: 40 },
    gin:    { size: 40,  percent: 37.5 }
};

// 2. Cache DOM elements at the top
const drinkType = document.getElementById("drinkType");
const calculateBtn = document.getElementById("calculateBtn");
const sizeInput = document.getElementById("size");
const percentInput = document.getElementById("percent");

const weightInput = document.getElementById("weight");
const genderInput = document.getElementById("gender");
const drinksInput = document.getElementById("drinks");
const hoursInput = document.getElementById("hours");
const sleepInput = document.getElementById("sleep");
const foodInput = document.getElementById("food");
const ageInput = document.getElementById("age");
const driveTimeInput = document.getElementById("driveTime");

const resultContainer = document.getElementById("result");
const driveResultContainer = document.getElementById("driveResult");
const chartCanvas = document.getElementById("bacChart");

// 3. Auto-fill inputs when a drink type changes
drinkType.addEventListener("change", function () {
    const selectedDrink = DRINK_PROPERTIES[drinkType.value];
    if (selectedDrink) {
        sizeInput.value = selectedDrink.size;
        percentInput.value = selectedDrink.percent;
    }
});

calculateBtn.addEventListener("click", calculateBAC);

function calculateBAC() {
    // Get numerical values
    const weight = Number(weightInput.value);
    const gender = genderInput.value;
    const drinks = Number(drinksInput.value);
    const size = Number(sizeInput.value);
    const percent = Number(percentInput.value);
    const hours = Number(hoursInput.value);
    const sleep = Number(sleepInput.value);
    const food = foodInput.value;
    const age = Number(ageInput.value);

    // Input Validation
    if (weight <= 0 || drinks <= 0 || size <= 0 || percent <= 0 || age <= 0) {
        resultContainer.innerHTML = "Please complete all fields correctly.";
        return;
    }

    // Food modifier (using else if saves performance)
    let foodModifier = 1;
    if (food === "light") {
        foodModifier = 0.9;
    } else if (food === "heavy") {
        foodModifier = 0.8;
    }

    // Sleep modifier (Clean ternary operator)
    const sleepModifier = sleep < 6 ? 1.1 : 1.0;

    // Pure alcohol calculations
    const alcoholMl = drinks * size * (percent / 100);
    const alcoholGrams = alcoholMl * 0.789;

    // Gender constant
    const bodyWaterConstant = gender === "female" ? 0.55 : 0.68;

    // BAC Calculation
    let bac = (alcoholGrams / (weight * 1000 * bodyWaterConstant)) * 100;
    bac = bac * foodModifier * sleepModifier;
    bac = bac - hours * 0.015;

    if (bac < 0) bac = 0;

    // Determine intoxication level
    let level = "";
    let effects = "";
    let levelColor = "";

    if (bac < 0.02) {
        level = "🟢 Sober";
        levelColor = "#2ecc71";
        effects = "Little or no noticeable effect.";
    } else if (bac < 0.05) {
        level = "🟡 Relaxed";
        levelColor = "#f1c40f";
        effects = "Mild mood improvement and relaxation.";
    } else if (bac < 0.08) {
        level = "🟠 Tipsy";
        levelColor = "#e67e22";
        effects = "Reduced reaction time and judgement.";
    } else if (bac < 0.15) {
        level = "🔴 Drunk";
        levelColor = "#e74c3c";
        effects = "Significant impairment.";
    } else if (bac < 0.25) {
        level = "⚫ Very Drunk";
        levelColor = "#8e44ad";
        effects = "High intoxication level.";
    } else {
        level = "☠️ Danger Zone";
        levelColor = "#000000";
        effects = "Very high intoxication level.";
    }

    const soberHours = bac / 0.015;
    const now = new Date();
    const soberDate = new Date(now.getTime() + (soberHours * 60 * 60 * 1000));

    // Prepare chart data
    let chartLabels = [];
    let chartValues = [];

    for (let i = 0; i <= soberHours; i++) {
        let futureBac = bac - (i * 0.015);
        if (futureBac < 0) futureBac = 0;

        chartLabels.push(i + "h");
        chartValues.push(futureBac.toFixed(3));
    }

    // Render main results
    resultContainer.innerHTML = `
        <h2>Results</h2>
        <p><strong>Drink:</strong> ${drinkType.value}</p>
        <p><strong>Estimated BAC:</strong> ${bac.toFixed(3)}%</p>
        <p>
            <strong>Level:</strong>
            <span style="color:${levelColor}; font-weight:bold; font-size:20px;">
                ${level}
            </span>
        </p>
        <p><strong>Effects:</strong> ${effects}</p>
        <p><strong>Estimated time to sober:</strong> ${soberHours.toFixed(1)} hours</p>
        <p><strong>Driving:</strong> ${bac >= 0.08 ? "❌ Not Safe" : "⚠️ Use Caution"}</p>
    `;

    // Driving check logic
    const driveTime = driveTimeInput.value;

    if (driveTime) {
        const parts = driveTime.split(":");
        const driveDate = new Date();
        driveDate.setHours(parts[0], parts[1], 0);

        if (driveDate < now) {
            driveDate.setDate(driveDate.getDate() + 1);
        }

        if (driveDate >= soberDate) {
            driveResultContainer.innerHTML = `
                <h3>🚗 Driving Check</h3>
                <p>✅ Safe to drive at ${driveTime}</p>
            `;
        } else {
            driveResultContainer.innerHTML = `
                <h3>🚗 Driving Check</h3>
                <p>❌ Not safe to drive at ${driveTime}</p>
                <p>You may be sober around: ${soberDate.toLocaleTimeString()}</p>
            `;
        }
    }

    // Chart.js initialization and cleanup
    if (window.bacChartInstance) {
        window.bacChartInstance.destroy();
    }

    window.bacChartInstance = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "BAC %",
                data: chartValues
            }]
        },
        options: {
            responsive: true
        }
    });
}