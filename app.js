// ================= IMPORTS =================

import { db, auth } from "./firebaseConfig.js";

import {
  collection,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ================= GLOBALS =================

let chartInstance = null;
let studentCourseStats = {};
let groupedStudentsCache = {};
let currentSearchValue = "";
let currentSubjectFilter = "";
let unsubscribeAttendance = null;


// ================= AUTH =================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const role = userDoc.data().role;
      applyRoleAccess(role);
    } else {
      console.warn("User role document missing");
    }

  } catch (err) {
    console.error("User role fetch error:", err);
  }

  // Always load dashboard even if role missing
  loadDashboard();

});


// ================= LOAD DASHBOARD =================

function loadDashboard() {

  console.log("Dashboard loading...");

  if (unsubscribeAttendance) unsubscribeAttendance();

  const attendanceRef = collection(db, "attendance");

  unsubscribeAttendance = onSnapshot(attendanceRef, (snapshot) => {

    console.log("Attendance docs:", snapshot.size);

    let total = 0;
    let present = 0;
    let subjectStats = {};
    studentCourseStats = {};

    snapshot.forEach(docSnap => {

      const d = docSnap.data();

      if (!d.student_id || !d.subject || !d.status) return;

      total++;

      if (d.status === "PRESENT") present++;

      // ===== SUBJECT STATS =====

      if (!subjectStats[d.subject]) {
        subjectStats[d.subject] = { total: 0, present: 0 };
      }

      subjectStats[d.subject].total++;

      if (d.status === "PRESENT") {
        subjectStats[d.subject].present++;
      }

      // ===== STUDENT + SUBJECT =====

      const key = `${d.student_id}_${d.subject}`;

      if (!studentCourseStats[key]) {

        studentCourseStats[key] = {
          studentId: d.student_id,
          name: d.name || "Unknown",
          subject: d.subject,
          total: 0,
          present: 0,
          trustScores: []
        };

      }

      studentCourseStats[key].total++;

      if (d.status === "PRESENT") {
        studentCourseStats[key].present++;
      }

      if (typeof d.trust_score === "number") {
        studentCourseStats[key].trustScores.push(d.trust_score);
      }

    });

    updateDashboardNumbers(total, present);

    drawChart(subjectStats);

    populateSubjectDropdown(subjectStats);

    renderTable();

    renderStudents();

    updateRecentActivity(snapshot);

  });

}


// ================= DASHBOARD NUMBERS =================

function updateDashboardNumbers(total, present) {

  document.getElementById("totalCount").innerText =
    Object.keys(studentCourseStats).length;

  document.getElementById("percentage").innerText =
    total ? Math.round((present / total) * 100) + "%" : "0%";

  document.getElementById("lowAttendance").innerText =
    Object.values(studentCourseStats)
      .filter(s => (s.present / s.total) * 100 < 75).length;

}


// ================= CHART =================

function drawChart(subjectStats) {

  const ctx = document.getElementById("subjectChart");

  if (!ctx) return;

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
        backgroundColor: [
          "#60a5fa",
          "#22c55e",
          "#fb7185",
          "#a78bfa",
          "#f59e0b"
        ],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

}


// ================= SUBJECT FILTER =================

function populateSubjectDropdown(subjectStats) {

  const select = document.getElementById("subjectSelect");
  if (!select) return;

  select.innerHTML = `<option value="">All Subjects</option>`;

  Object.keys(subjectStats).forEach(subject => {

    const opt = document.createElement("option");

    opt.value = subject;
    opt.textContent = subject;

    select.appendChild(opt);

  });

}

function filterBySubject(subject) {
  currentSubjectFilter = subject;
  renderTable();
}


// ================= TABLE =================

function renderTable() {

  const tbody = document.querySelector("#attendanceTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  Object.values(studentCourseStats)
    .filter(s => !currentSubjectFilter || s.subject === currentSubjectFilter)
    .forEach(s => {

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
          <span class="status-pill status-${status.toLowerCase()}">
            ${status}
          </span>
        </td>
      `;

      tbody.appendChild(tr);

    });

  applySearchFilter();

}


// ================= SEARCH =================

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

  input.addEventListener("input", e => {
    currentSearchValue = e.target.value.toLowerCase();
    applySearchFilter();
  });

}


// ================= STUDENTS =================

function renderStudents() {

  const container = document.getElementById("studentsGrid");

  if (!container) return;

  container.innerHTML = "";

  groupedStudentsCache = {};

  Object.values(studentCourseStats).forEach(s => {

    if (!groupedStudentsCache[s.studentId]) {

      groupedStudentsCache[s.studentId] = {
        id: s.studentId,
        name: s.name,
        total: 0,
        present: 0,
        trustValues: []
      };

    }

    groupedStudentsCache[s.studentId].total += s.total;
    groupedStudentsCache[s.studentId].present += s.present;

    groupedStudentsCache[s.studentId]
      .trustValues.push(...s.trustScores);

  });

  Object.values(groupedStudentsCache).forEach(student => {

    const percent =
      Math.round((student.present / student.total) * 100);

    const trust =
      student.trustValues.length
        ? Math.round(
            student.trustValues.reduce((a,b)=>a+b,0) /
            student.trustValues.length
          )
        : percent;

    const card = document.createElement("div");

    card.className =
      "bg-gray-600/40 backdrop-blur-xl rounded-2xl p-6 hover:scale-105 transition cursor-pointer";

    card.innerHTML = `
      <h3 class="text-xl font-bold text-white mb-2">
        ${student.name}
      </h3>
      <p class="text-white/70 mb-3">
        ID: ${student.id}
      </p>
      <p>Attendance: ${percent}%</p>
      <p class="text-indigo-400">
        Trust Score: ${trust}%
      </p>
    `;

    container.appendChild(card);

  });

}


// ================= RECENT ACTIVITY =================

function updateRecentActivity(snapshot) {

  const container =
    document.getElementById("recentActivityList");

  if (!container) return;

  container.innerHTML = "";

  const activities = [];

  snapshot.forEach(doc => {

    const d = doc.data();

    if (!d.student_id) return;

    activities.push({
      name: d.name || "Unknown",
      subject: d.subject,
      status: d.status,
      time: new Date()
    });

  });

  activities
    .slice(-10)
    .reverse()
    .forEach(a => {

      const div = document.createElement("div");

      div.className =
        "flex justify-between bg-white/5 rounded-xl p-3";

      div.innerHTML = `
        <div>
          <b>${a.name}</b>
          <div>${a.subject}</div>
        </div>
        <span>${a.status}</span>
      `;

      container.appendChild(div);

    });

}


// ================= ROLE ACCESS =================

function applyRoleAccess(role) {

  const analyticsNav =
    document.getElementById("analyticsNav");

  const settingsNav =
    document.getElementById("settingsNav");

  if (role === "student") {
    analyticsNav?.classList.add("hidden");
    settingsNav?.classList.add("hidden");
  }

  if (role === "teacher") {
    settingsNav?.classList.add("hidden");
  }

}


// ================= NAVIGATION =================

function showSection(section) {

  document.querySelectorAll(".section")
    .forEach(sec => sec.classList.remove("active-section"));

  document.getElementById(section + "Section")
    ?.classList.add("active-section");

}

window.showSection = showSection;


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

  const subjectSelect =
    document.getElementById("subjectSelect");

  if (subjectSelect) {
    subjectSelect.addEventListener(
      "change",
      e => filterBySubject(e.target.value)
    );
  }

});