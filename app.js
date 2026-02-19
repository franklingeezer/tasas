import { db, auth } from "./firebaseConfig.js";

import { onAuthStateChanged, signOut } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { collection, getDocs } from 
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

async function loadDashboard() {
  const snapshot = await getDocs(collection(db, "attendance"));

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
  percentageEl.innerText = Math.round((present / total) * 100) + "%";

  lowAttendanceEl.innerText = Object.values(studentCourseStats)
    .filter(s => (s.present / s.total) * 100 < 75).length;

  drawChart(subjectStats);
  renderTable();
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
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.raw + "%";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + "%";
            }
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




loadDashboard();
