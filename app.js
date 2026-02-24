import { db, auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, onSnapshot } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

let chartInstance = null;
let studentCourseStats = {};
let currentSearchValue = "";

// ================= DASHBOARD LOAD =================

function loadDashboard() {

  const attendanceRef = collection(db, "attendance");
  let firstLoad = true;

  onSnapshot(attendanceRef, (snapshot) => {

    let total = 0;
    let present = 0;
    let subjectStats = {};
    studentCourseStats = {};

    snapshot.forEach(doc => {
      const d = doc.data();
      if (!d.student_id || !d.subject || !d.status) return;

      total++;
      if (d.status === "PRESENT") present++;

      if (!subjectStats[d.subject]) {
        subjectStats[d.subject] = { total: 0, present: 0 };
      }

      subjectStats[d.subject].total++;
      if (d.status === "PRESENT") subjectStats[d.subject].present++;

      const key = `${d.student_id}_${d.subject}`;

      if (!studentCourseStats[key]) {
        studentCourseStats[key] = {
          studentId: d.student_id,
          name: d.name || "Unknown",
          subject: d.subject,
          total: 0,
          present: 0,
          trust: d.trust ?? null
        };
      }

      studentCourseStats[key].total++;
      if (d.status === "PRESENT") studentCourseStats[key].present++;
    });

    document.getElementById("totalCount").innerText =
      Object.keys(studentCourseStats).length;

    document.getElementById("percentage").innerText =
      total ? Math.round((present / total) * 100) + "%" : "0%";

    document.getElementById("lowAttendance").innerText =
      Object.values(studentCourseStats)
        .filter(s => (s.present / s.total) * 100 < 75).length;

    drawChart(subjectStats);
    renderTable();

    if (!firstLoad) {
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();

        if (change.type === "added") {
          addRecentActivity(
            `📌 Attendance recorded for ${data.name}`,
            "info"
          );
        }

        if (change.type === "modified" && data.status === "PRESENT") {
          addRecentActivity(
            `✅ ${data.name} marked PRESENT`,
            "success"
          );
        }
      });
    }

    firstLoad = false;
  });
}

// ================= CHART =================

function drawChart(subjectStats) {

  const ctx = document.getElementById("subjectChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const labels = Object.keys(subjectStats);
  const data = labels.map(s =>
    Math.round((subjectStats[s].present / subjectStats[s].total) * 100)
  );

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#60a5fa", "#22c55e", "#fb7185"],
        borderRadius: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// ================= TABLE =================

function renderTable() {

  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  Object.values(studentCourseStats).forEach(s => {

    const percent = Math.round((s.present / s.total) * 100);
    const status =
      percent < 75 ? "LOW" :
      percent < 90 ? "NORMAL" : "PERFECT";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.studentId}</td>
      <td>${s.name}</td>
      <td>${s.subject}</td>
      <td>${s.total}</td>
      <td>${s.present}</td>
      <td>${percent}%</td>
      <td>
        <span class="status-pill rounded-full text-lg px-4 py-2 font-semibold status-${status.toLowerCase()}">
          ${status}
        </span>
      </td>
    `;

    tbody.appendChild(tr);
  });

  applySearchFilter(); // Re-apply search after re-render
}

// ================= SEARCH SYSTEM =================

function applySearchFilter() {

  const rows = document.querySelectorAll("#attendanceTable tbody tr");

  rows.forEach(row => {

    const id = row.cells[0].innerText.toLowerCase();
    const name = row.cells[1].innerText.toLowerCase();

    if (
      id.includes(currentSearchValue) ||
      name.includes(currentSearchValue)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }

  });
}

function initializeSearch() {

  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", (e) => {
    currentSearchValue = e.target.value.toLowerCase();
    applySearchFilter();
  });
}

// ================= RECENT ACTIVITY =================

function addRecentActivity(message, type = "info") {

  const container = document.getElementById("recentActivityList");
  if (!container) return;

  const item = document.createElement("div");

  let colorClass = "border-white/10";
  if (type === "success") colorClass = "border-green-500/30";

  item.className = `
    bg-white/5 border ${colorClass}
    rounded-xl px-4 py-3
    text-white/80 text-sm
  `;

  const time = new Date().toLocaleTimeString();

  item.innerHTML = `
    <div class="flex justify-between items-center">
      <span>${message}</span>
      <span class="text-xs text-white/40">${time}</span>
    </div>
  `;

  container.prepend(item);

  if (container.children.length > 8) {
    container.removeChild(container.lastChild);
  }
}

// ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ================= INIT =================

window.addEventListener("load", () => {
  initializeSearch();
  loadDashboard();
});