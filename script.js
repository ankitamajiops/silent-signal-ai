
const communities = [
  {
    name: "Satabhaya",
    district: "Kendrapara",
    lat: 20.62, lng: 86.77,
    hours: 36,
    connectivity: "Unavailable",
    service: "Water shortage",
    updates: 0
  },
  {
    name: "Erसama",
    district: "Jagatsinghpur",
    lat: 20.25, lng: 86.17,
    hours: 20,
    connectivity: "Unstable",
    service: "Road access problem",
    updates: 1
  },
  {
    name: "Astaranga",
    district: "Puri",
    lat: 19.98, lng: 86.27,
    hours: 8,
    connectivity: "Available",
    service: "Normal",
    updates: 5
  },
  {
    name: "Dhamra",
    district: "Bhadrak",
    lat: 20.78, lng: 86.97,
    hours: 30,
    connectivity: "Unavailable",
    service: "Electricity disruption",
    updates: 0
  },
  {
    name: "Gopalpur",
    district: "Ganjam",
    lat: 19.26, lng: 84.91,
    hours: 5,
    connectivity: "Available",
    service: "Normal",
    updates: 7
  },
  {
    name: "Kakatpur",
    district: "Puri",
    lat: 19.97, lng: 86.12,
    hours: 25,
    connectivity: "Unstable",
    service: "Water shortage",
    updates: 1
  },
  {
    name: "Rajnagar",
    district: "Kendrapara",
    lat: 20.52, lng: 86.73,
    hours: 42,
    connectivity: "Unavailable",
    service: "Multiple service disruptions",
    updates: 0
  }
];

const savedCommunities = JSON.parse(
    localStorage.getItem("silentSignalCommunities") || "null"
);

if (savedCommunities) {
    savedCommunities.forEach(saved => {
        const existing = communities.find(
            c => c.name === saved.name
        );

        if (existing) {
            Object.assign(existing, saved);
        }
    });
}

let reports = JSON.parse(localStorage.getItem("silentSignalReports")) || [];

function calculateRisk(c) {
  let score = 0;

  if (c.hours >= 36) score += 35;
  else if (c.hours >= 24) score += 25;
  else if (c.hours >= 12) score += 15;
  else score += 5;

  if (c.connectivity === "Unavailable") score += 30;
  else if (c.connectivity === "Unstable") score += 20;
  else if (c.connectivity === "Unknown") score += 15;

  if (c.service === "Multiple service disruptions") score += 30;
  else if (c.service !== "Normal") score += 20;

  if (c.updates === 0) score += 5;

  return Math.min(score, 100);
}

function getPriority(score) {
  if (score >= 70) return "High";
  if (score >= 45) return "Verify";
  return "Low";
}

function explainRisk(c) {
  const reasons = [];

  if (c.hours >= 24) {
    reasons.push("No recent update for " + c.hours + " hours");
  }

  if (c.connectivity === "Unavailable") {
    reasons.push("Communication unavailable");
  } else if (c.connectivity === "Unstable") {
    reasons.push("Unstable communication");
  }

  if (c.service !== "Normal") {
    reasons.push("Essential service issue: " + c.service);
  }

  if (c.updates === 0) {
    reasons.push("No community updates received");
  }

  return reasons.length
    ? reasons.join("; ")
    : "No major warning signals in sample data";
}

function renderStats() {
  const scored = communities.map(c => ({
    ...c,
    score: calculateRisk(c)
  }));

  document.getElementById("totalCommunities").textContent =
    communities.length;

  document.getElementById("verificationCount").textContent =
    scored.filter(c => c.score >= 45).length;

  document.getElementById("highPriority").textContent =
    scored.filter(c => c.score >= 70).length;

  document.getElementById("totalReports").textContent =
    reports.length;
}

function renderTable() {
    const table = document.getElementById("communityTable");
    const filter = document.getElementById("filterPriority").value;
    const districtFilter = document.getElementById("filterDistrict").value;
    const search = document.getElementById("searchVillage").value.toLowerCase();

    table.innerHTML = "";

    communities.forEach((c, index) => {
        const score = calculateRisk(c);
        const priority = getPriority(score);

        if (filter !== "all" && filter !== priority) return;
        if (districtFilter !== "all" && districtFilter !== c.district) return;
        if (!c.name.toLowerCase().includes(search)) return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${c.name}</strong><br>
            <small>${c.district}</small></td>
            <td>${c.hours} hours ago</td>
            <td>${c.connectivity}</td>
            <td>${c.service}</td>
            <td><strong>${score}/100</strong></td>
            <td><span class="priority ${priority}">${priority}</span></td>
            <td><button class="view-btn" data-index="${index}">View</button></td>
        `;

        table.appendChild(row);
    });
}

function showCommunity(index) {
  const c = communities[index];
  const score = calculateRisk(c);

  alert("\nREASONS: " + explainRisk(c) +
    "COMMUNITY: " + c.name +
    "\nDISTRICT: " + c.district +
    "\nRISK SCORE: " + score +
    "\nPRIORITY: " + getPriority(score) +
    "\nLAST UPDATE: " + c.hours + " hours ago" +
    "\nCONNECTIVITY: " + c.connectivity +
    "\nSERVICE: " + c.service +
    "\n\nRecommended action: Arrange human verification and assess essential service availability."
  );

  window.map.setView([c.lat, c.lng], 10);
}

function renderMap() {
  const mapContainer = document.getElementById("map");

  if (typeof L === "undefined") {
    mapContainer.innerHTML =
      "Map library unavailable. Please check your internet connection.";
    return;
  }

  const map = L.map("map").setView([20.3, 85.8], 7);

  window.map = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  communities.forEach((c, index) => {
    const score = calculateRisk(c);
    const priority = getPriority(score);

    const colors = {
      High: "#ff606b",
      Verify: "#f5ae43",
      Low: "#39c98a"
    };

    const marker = L.circleMarker([c.lat, c.lng], {
      radius: 9,
      color: colors[priority],
      fillColor: colors[priority],
      fillOpacity: 0.8,
      weight: 2
    }).addTo(map);

    marker.bindPopup(`
      <strong>${c.name}</strong><br>
      District: ${c.district}<br>
      Score: ${score}/100<br>
      Priority: ${priority}
      <br><small>Illustrative demo location</small>
    `);

    marker.on("click", () => {
      console.log("Selected community:", index);
    });
  });

  setTimeout(() => map.invalidateSize(), 300);
}

function renderChart() {
  if (typeof Chart === "undefined") return;

  const counts = {
    High: 0,
    Verify: 0,
    Low: 0
  };

  communities.forEach(c => {
    counts[getPriority(calculateRisk(c))]++;
  });

  new Chart(document.getElementById("riskChart"), {
    type: "doughnut",
    data: {
      labels: ["High priority", "Needs verification", "Low priority"],
      datasets: [{
        data: [counts.High, counts.Verify, counts.Low],
        backgroundColor: ["#ff606b", "#f5ae43", "#39c98a"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#aab8ca",
            padding: 15,
            font: { size: 10 }
          }
        }
      }
    }
  });
}

function renderReports() {
  const container = document.getElementById("recentReports");

  if (!reports.length) {
    container.innerHTML =
      '<p class="empty">No new reports yet.</p>';
    return;
  }

  container.innerHTML = reports.map(r => `
    <div class="report-item">
      <strong>${escapeHTML(r.village)}</strong>
      <div>${escapeHTML(r.district)} • ${escapeHTML(r.condition)}</div>
      <div>Connectivity: ${escapeHTML(r.connectivity)}</div>
      <div>${escapeHTML(r.details || "No additional details")}</div>
      <small>New report • Awaiting verification</small>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.getElementById("filterPriority")
  .addEventListener("change", renderTable);

document.getElementById("communityTable")
  .addEventListener("click", event => {
    const button = event.target.closest("[data-index]");
    if (button) showCommunity(Number(button.dataset.index));
  });

document.getElementById("reportForm")
  .addEventListener("submit", event => {
    event.preventDefault();

    const report = {
      village: document.getElementById("village").value.trim(),
      district: document.getElementById("district").value,
      condition: document.getElementById("condition").value,
      connectivity: document.getElementById("connectivity").value,
      details: document.getElementById("details").value.trim()
    };

    if (!report.village) return;

    reports.unshift(report);

    localStorage.setItem("silentSignalReports", JSON.stringify(reports));

    const existing = communities.find(
  c => c.name.toLowerCase() === report.village.toLowerCase()
);

if (existing) {
    existing.hours = 0;
    existing.updates += 1;
    existing.connectivity = report.connectivity;

    if (report.condition !== "No recent community updates") {
        existing.service = report.condition;
    }
} else {
    alert(
        "Report received. This new location requires location verification before being added to the monitoring map."
    );
}

localStorage.setItem(
    "silentSignalCommunities",
    JSON.stringify(communities)
);
    renderTable();
    renderStats();
    renderReports();
    generateRecommendations();

    event.target.reset();

    alert("Report submitted successfully! It is awaiting human verification.");
  });

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

renderStats();
renderTable();
renderChart();
renderReports();
renderMap();

 function generateRecommendations() {
    let panel = document.getElementById("recommendationPanel");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "recommendationPanel";
        panel.className = "panel";

        document.querySelector(".main").appendChild(panel);
    }

    const flagged = communities
        .map(c => ({
            ...c,
            score: calculateRisk(c)
        }))
        .filter(c => c.score >= 45)
        .sort((a, b) => b.score - a.score);

    let content = `
        <h3>Community Response Recommendations</h3>
        <p>Suggestions based on detected warning signals. Human verification is required.</p>
    `;

    if (flagged.length === 0) {
        content += "<p>No communities currently meet the review threshold.</p>";
    }

    flagged.forEach(c => {
        let action = c.score >= 70
            ? "Prioritize human verification and check access to essential services."
            : "Contact local representatives and verify the latest community status.";

        content += `
            <div class="recommendation-item">
                <strong>${c.name} — ${c.district}</strong>
                <p>Risk score: ${c.score}/100</p>
                <p>Suggested action: ${action}</p>
            </div>
        `;
    });

    panel.innerHTML = content;
}

generateRecommendations();
