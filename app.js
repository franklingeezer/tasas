import { db, auth } from "./firebaseConfig.js";

import { onAuthStateChanged, signOut } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { collection, onSnapshot } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

let chartInstance = null;
let studentCourseStats = {};

const totalCountEl = document.getElementById("totalCount");
const percentageEl = document.getElementById("percentage");
const lowAttendanceEl = document.getElementById("lowAttendance");

const insightId = document.getElementById("insightId");
const insightName = document.getElementById("insightName");
const insightCourse = document.getElementById("insightCourse");
const insightTotal = document.getElementById("insightTotal");
const insightPresent = document.getElementById("insightPresent");
const insightPercent = document.getElementById("insightPercent");
const insightStatus = document.getElementById("insightStatus");
const insightTrust = document.getElementById("insightTrust");

const progressBar = document.getElementById("attendanceProgress");
const trustProgress = document.getElementById("trustProgress");
const attendanceRemark = document.getElementById("attendanceRemark");
const attendanceAdvice = document.getElementById("attendanceAdvice");
const trustRemark = document.getElementById("trustRemark");

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

    totalCountEl.innerText = Object.keys(studentCourseStats).length;
    percentageEl.innerText = total
      ? Math.round((present / total) * 100) + "%"
      : "0%";

    lowAttendanceEl.innerText = Object.values(studentCourseStats)
      .filter(s => (s.present / s.total) * 100 < 75).length;

    drawChart(subjectStats);
    renderTable();

    // 🔔 Toast detection
    if (!firstLoad) {
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();

        if (change.type === "added") {
          showToast(
            `📌 Attendance recorded for ${data.name}`,
            "info"
          );
        }

        if (change.type === "modified" && data.status === "PRESENT") {
          showToast(
            `✅ ${data.name} marked PRESENT`,
            "success"
          );
        }
      });
    }

    firstLoad = false;

  });
}


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

  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#111c2d",
      titleColor: "#ffffff",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(99,102,241,0.4)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: function(context) {
          return context.raw + "%";
        }
      }
    }
  },

  scales: {
    x: {
      ticks: {
        color: "#cbd5e1",
        font: {
          size: 13,
          weight: "500"
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        color: "#cbd5e1",
        callback: function(value) {
          return value + "%";
        }
      },
      grid: {
        color: "rgba(255,255,255,0.05)"
      }
    }
  }
}

  });
}


function renderTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  Object.values(studentCourseStats).forEach(s => {
    const percent = Math.round((s.present / s.total) * 100);
    const status = percent < 75 ? "LOW" : percent < 90 ? "NORMAL" : "PERFECT";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.studentId}</td>
      <td>${s.name}</td>
      <td>${s.subject}</td>
      <td>${s.total}</td>
      <td>${s.present}</td>
      <td>${percent}%</td>
      <td class=""><span class="status-pill rounded-full text-lg px-4 py-2  font-semibold status-${status.toLowerCase()}">${status}</span></td>
    `;

    tr.onclick = () => {
  showInsight(s);
  const modal = document.getElementById("insightModal");
modal.showModal();
document.body.style.overflow = "hidden";


};

    tbody.appendChild(tr);
  });
}

function showInsight(s) {
  const percent = Math.round((s.present / s.total) * 100);
  const trust = s.trust ?? percent;

  insightId.innerText = s.studentId;
  insightName.innerText = s.name;
  insightCourse.innerText = s.subject;
  insightTotal.innerText = s.total;
  insightPresent.innerText = s.present;
  insightPercent.innerText = percent + "%";
  insightTrust.innerText = trust + "%";

  progressBar.style.width = percent + "%";
trustProgress.style.width = trust + "%";




  trustProgress.className = "";

// Dynamic Status Color
insightStatus.className =
  "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-300";

if (percent < 75) {
  insightStatus.innerText = "LOW";
  insightStatus.classList.add("bg-red-500/15", "text-red-400");
}
else if (percent < 90) {
  insightStatus.innerText = "NORMAL";
  insightStatus.classList.add("bg-yellow-500/15", "text-yellow-400");
}
else {
  insightStatus.innerText = "PERFECT";
  insightStatus.classList.add("bg-white/10", "text-white");
}


  attendanceRemark.innerText =
    percent < 75 ? "⚠ At risk of failing" :
    percent < 90 ? "⚠ Acceptable attendance" :
    "✅ Excellent attendance";

  attendanceAdvice.innerText =
    percent < 75 ? "Immediate improvement required." :
    percent < 90 ? "Maintain consistency." :
    "Great job!";
}
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// Modal scroll control
const modal = document.getElementById("insightModal");

if (modal) {
  modal.addEventListener("close", () => {
    document.body.style.overflow = "auto";
  });
}

document.querySelectorAll(".sortable").forEach((header, index) => {
  header.addEventListener("click", () => {
    const rows = Array.from(
      document.querySelector("#attendanceTable tbody").rows
    );

    const isAsc = header.classList.contains("active-asc");
    document.querySelectorAll(".sortable").forEach(h => 
      h.classList.remove("active-asc", "active-desc")
    );

    header.classList.add(isAsc ? "active-desc" : "active-asc");

    rows.sort((a, b) => {
      const valA = a.cells[index].innerText;
      const valB = b.cells[index].innerText;

      return isAsc
        ? valB.localeCompare(valA, undefined, { numeric: true })
        : valA.localeCompare(valB, undefined, { numeric: true });
    });

    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));
  });
});



loadDashboard();
