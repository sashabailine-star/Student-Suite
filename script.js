const SUPABASE_URL = "https://kprlkctuyggqypjqwrey.supabase.co";
const SUPABASE_KEY = "sb_publishable_w3xLD4D-gk0HQwRCOY7kow_7aa_qLzM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function protectPage() {
  const { data, error } = await supabaseClient.auth.getSession();
  console.log("PAGE SESSION:", data, error);

  if (!data?.session) {
    window.location.href = "auth.html";
    return false;
  }

  return true;
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = "auth.html";
}
// =========================
// SUPABASE CONNECTION
// =========================
const SUPABASE_URL = "https://kprlkctuyggqypjqwrey.supabase.co";
const SUPABASE_KEY = "sb_publishable_w3xLD4D-gk0HQwRCOY7kow_7aa_qLzM";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================
// APP STATE
// =========================
const STORAGE_KEY = "studentSuiteFinalPlatformAuthV1";
const SCHOOL_YEARS = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const defaultState = {
  currentYearView: "11th Grade",
  unreadEmailCount: 0,
  settings: {
    gradeScale: [
      { id: crypto.randomUUID(), label: "A+", min: 96.5, gpa: 4.33 },
      { id: crypto.randomUUID(), label: "A", min: 92.5, gpa: 4.0 },
      { id: crypto.randomUUID(), label: "A-", min: 89.5, gpa: 3.67 },
      { id: crypto.randomUUID(), label: "B+", min: 86.5, gpa: 3.33 },
      { id: crypto.randomUUID(), label: "B", min: 82.5, gpa: 3.0 },
      { id: crypto.randomUUID(), label: "B-", min: 79.5, gpa: 2.67 },
      { id: crypto.randomUUID(), label: "C+", min: 76.5, gpa: 2.33 },
      { id: crypto.randomUUID(), label: "C", min: 72.5, gpa: 2.0 },
      { id: crypto.randomUUID(), label: "C-", min: 69.5, gpa: 1.67 },
      { id: crypto.randomUUID(), label: "D+", min: 66.5, gpa: 1.33 },
      { id: crypto.randomUUID(), label: "D", min: 62.5, gpa: 1.0 },
      { id: crypto.randomUUID(), label: "D-", min: 59.5, gpa: 0.67 },
      { id: crypto.randomUUID(), label: "F", min: 0, gpa: 0.0 }
    ],
    courseWeights: [
      { id: crypto.randomUUID(), level: "Regular", weight: 0.0 },
      { id: crypto.randomUUID(), level: "Honors", weight: 1.0 },
      { id: crypto.randomUUID(), level: "Advanced", weight: 2.0 },
      { id: crypto.randomUUID(), level: "AP", weight: 2.0 },
      { id: crypto.randomUUID(), level: "IB", weight: 2.0 },
      { id: crypto.randomUUID(), level: "Pre-AP", weight: 2.0 },
      { id: crypto.randomUUID(), level: "Pre-IB", weight: 2.0 }
    ]
  },
  courses: [],
  assignments: [],
  calendarEvents: [],
  college: {
    personalStatement: "",
    extendedResume: "",
    supplementBank: "",
    applicationChecklist: "",
    collegeMaterials: "",
    deadlines: [],
    schools: []
  },
  extracurriculars: []
};

let state = loadStateFromStorage();
let calendarYear = 2026;
let calendarMonth = 2;

// =========================
// AUTH HELPERS
// =========================
function showAuthMessage(message, isError = false) {
  const el = document.getElementById("authMessage");
  if (!el) return;

  el.innerHTML = `
    <div class="list-card" style="border-color:${isError ? '#f0c8c8' : '#bfd3f4'};">
      <div class="list-sub" style="color:${isError ? '#b33939' : '#163a70'};">
        ${message}
      </div>
    </div>
  `;
}

async function signUpUser(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    showAuthMessage(error.message, true);
    return;
  }

  if (data?.session) {
    window.location.href = "index.html";
    return;
  }

  if (data?.user) {
    showAuthMessage("Account created. If email confirmation is enabled in Supabase, check your inbox first.");
  }
}

async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showAuthMessage(error.message, true);
    return;
  }

  if (data?.user) {
    window.location.href = "index.html";
  }
}

async function signOutUser() {
  await supabase.auth.signOut();
  window.location.href = "auth.html";
}

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  const page = document.body.dataset.page;

  if (page === "auth") {
    if (session) {
      window.location.href = "index.html";
    }
    return session;
  }

  if (!session) {
    window.location.href = "auth.html";
    return null;
  }

  return session;
}

function bindAuthForms() {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      await signUpUser(email, password);
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      await signInUser(email, password);
    });
  }
}

// =========================
// STORAGE HELPERS
// =========================
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadStateFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...clone(defaultState),
      ...parsed,
      settings: {
        ...clone(defaultState.settings),
        ...(parsed.settings || {}),
        gradeScale: Array.isArray(parsed?.settings?.gradeScale) && parsed.settings.gradeScale.length
          ? parsed.settings.gradeScale
          : clone(defaultState.settings.gradeScale),
        courseWeights: Array.isArray(parsed?.settings?.courseWeights) && parsed.settings.courseWeights.length
          ? parsed.settings.courseWeights
          : clone(defaultState.settings.courseWeights)
      },
      college: {
        ...clone(defaultState.college),
        ...(parsed.college || {})
      },
      extracurriculars: Array.isArray(parsed.extracurriculars) ? parsed.extracurriculars : []
    };
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =========================
// GPA + DATA HELPERS
// =========================
function getGradeScaleSorted() {
  return [...state.settings.gradeScale].sort((a, b) => Number(b.min) - Number(a.min));
}

function getLetterDataFromPercent(percent) {
  return getGradeScaleSorted().find(band => percent >= Number(band.min)) || { label: "F", gpa: 0 };
}

function getCourseWeight(level) {
  const match = state.settings.courseWeights.find(item => item.level === level);
  return match ? Number(match.weight) : 0;
}

function getCoursesForYear(year) {
  return state.courses.filter(course => course.schoolYear === year);
}

function getAssignmentsForCourse(courseId) {
  return state.assignments.filter(a => a.courseId === courseId);
}

function getAssignmentsForCourseQuarter(courseId, quarter) {
  return state.assignments.filter(a => a.courseId === courseId && a.quarter === quarter);
}

function getQuarterAverage(courseId, quarter) {
  const items = getAssignmentsForCourseQuarter(courseId, quarter);
  if (!items.length) return null;

  const earned = items.reduce((sum, item) => sum + Number(item.score), 0);
  const possible = items.reduce((sum, item) => sum + Number(item.total), 0);
  if (!possible) return null;

  return (earned / possible) * 100;
}

function getCourseYearAverage(courseId) {
  const quarterAverages = QUARTERS
    .map(q => getQuarterAverage(courseId, q))
    .filter(avg => avg !== null);

  if (!quarterAverages.length) return null;

  return quarterAverages.reduce((sum, avg) => sum + avg, 0) / quarterAverages.length;
}

function getCourseYearGpa(course) {
  const yearAverage = getCourseYearAverage(course.id);
  if (yearAverage === null) return null;

  const base = Number(getLetterDataFromPercent(yearAverage).gpa);
  const weighted = base + getCourseWeight(course.level);

  return {
    average: yearAverage,
    base,
    weighted
  };
}

function getYearGpa(year) {
  const courses = getCoursesForYear(year);
  const graded = courses.map(course => getCourseYearGpa(course)).filter(Boolean);

  if (!graded.length) return { weighted: 0, unweighted: 0 };

  return {
    unweighted: graded.reduce((sum, item) => sum + item.base, 0) / graded.length,
    weighted: graded.reduce((sum, item) => sum + item.weighted, 0) / graded.length
  };
}

function getCumulativeGpa() {
  const yearly = SCHOOL_YEARS.map(year => {
    const hasCourses = getCoursesForYear(year).length > 0;
    return hasCourses ? getYearGpa(year) : null;
  }).filter(Boolean);

  if (!yearly.length) return { weighted: 0, unweighted: 0 };

  return {
    unweighted: yearly.reduce((sum, item) => sum + item.unweighted, 0) / yearly.length,
    weighted: yearly.reduce((sum, item) => sum + item.weighted, 0) / yearly.length
  };
}

// =========================
// RENDER HELPERS
// =========================
function renderDashboardStats() {
  const currentYear = state.currentYearView;
  const yearGpa = getYearGpa(currentYear);
  const cumulative = getCumulativeGpa();

  const yearWeightedEl = document.getElementById("yearWeightedGpa");
  const yearUnweightedEl = document.getElementById("yearUnweightedGpa");
  const cumulativeWeightedEl = document.getElementById("cumulativeWeightedGpa");
  const cumulativeUnweightedEl = document.getElementById("cumulativeUnweightedGpa");
  const courseCountEl = document.getElementById("courseCount");

  if (yearWeightedEl) yearWeightedEl.textContent = yearGpa.weighted.toFixed(2);
  if (yearUnweightedEl) yearUnweightedEl.textContent = yearGpa.unweighted.toFixed(2);
  if (cumulativeWeightedEl) cumulativeWeightedEl.textContent = cumulative.weighted.toFixed(2);
  if (cumulativeUnweightedEl) cumulativeUnweightedEl.textContent = cumulative.unweighted.toFixed(2);
  if (courseCountEl) courseCountEl.textContent = getCoursesForYear(currentYear).length;

  const collegeWeighted = document.getElementById("collegeCumulativeWeighted");
  const collegeUnweighted = document.getElementById("collegeCumulativeUnweighted");
  const collegeSchoolCount = document.getElementById("collegeSchoolCount");

  if (collegeWeighted) collegeWeighted.textContent = cumulative.weighted.toFixed(2);
  if (collegeUnweighted) collegeUnweighted.textContent = cumulative.unweighted.toFixed(2);
  if (collegeSchoolCount) collegeSchoolCount.textContent = state.college.schools.length;
}

function renderQuarterOverview() {
  const target = document.getElementById("dashboardQuarterOverview");
  if (!target) return;

  const courses = getCoursesForYear(state.currentYearView);
  if (!courses.length) {
    target.innerHTML = `<div class="empty-state">No courses in this school year yet.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="quarter-overview-stack">
      ${QUARTERS.map(quarter => {
        const values = courses.map(course => getQuarterAverage(course.id, quarter)).filter(v => v !== null);
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

        return `
          <div class="quarter-card">
            <div class="quarter-title">${quarter}</div>
            <div class="quarter-sub">${avg !== null ? avg.toFixed(1) + "%" : "No grades yet"}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderCourseCards(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const courses = getCoursesForYear(state.currentYearView);
  if (!courses.length) {
    target.innerHTML = `<div class="empty-state">No courses yet for this year.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="course-stack">
      ${courses.map(course => {
        const yearData = getCourseYearGpa(course);
        const letterData = yearData ? getLetterDataFromPercent(yearData.average) : null;

        return `
          <div class="course-card">
            <div class="course-name">${course.name}</div>
            <div class="course-meta">
              ${course.level}
              ${yearData ? ` • ${letterData.label} • ${yearData.base.toFixed(2)} base • ${yearData.weighted.toFixed(2)} weighted` : " • No year GPA yet"}
            </div>
            <div class="top-space-sm">
              <span class="soft-tag">${yearData ? yearData.average.toFixed(1) + "%" : "No grades"}</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" style="width:${yearData ? Math.max(3, yearData.average) : 0}%"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderDeadlinePreview() {
  const target = document.getElementById("deadlinePreview");
  if (!target) return;

  const schoolDeadlines = state.assignments.map(a => {
    const course = state.courses.find(c => c.id === a.courseId);
    return {
      title: a.name,
      subtitle: `${course ? course.name : "Course"} • ${a.quarter}`,
      source: "School",
      date: a.date
    };
  });

  const collegeDeadlines = state.college.deadlines.map(d => ({
    title: d.school,
    subtitle: d.type,
    source: "College",
    date: d.date
  }));

  const combined = [...schoolDeadlines, ...collegeDeadlines]
    .filter(item => item.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  if (!combined.length) {
    target.innerHTML = `<div class="empty-state">No upcoming deadlines yet.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="list-stack">
      ${combined.map(item => `
        <div class="list-card">
          <div class="list-title">${item.title}</div>
          <div class="list-sub">${item.source} • ${item.subtitle} • ${item.date}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function addCalendarEvent(title, date, category) {
  state.calendarEvents.push({ id: crypto.randomUUID(), title, date, category });
  saveState();
  renderPage();
}

function renderCalendar() {
  const target = document.getElementById("calendarGrid");
  if (!target) return;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(`<div class="calendar-day empty"></div>`);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const events = state.calendarEvents.filter(e => e.date === dateString);

    cells.push(`
      <div class="calendar-day">
        <div class="calendar-day-number">${day}</div>
        ${events.map(e => `<div class="calendar-event">${e.title}</div>`).join("")}
      </div>
    `);
  }

  target.innerHTML = `
    <div class="calendar-wrap">
      <div class="calendar-controls">
        <button class="btn btn-dark" onclick="changeCalendarMonth(-1)">Prev</button>
        <div class="calendar-month-title">${monthNames[calendarMonth]} ${calendarYear}</div>
        <button class="btn btn-dark" onclick="changeCalendarMonth(1)">Next</button>
      </div>
      <div class="calendar-header">
        ${weekdayNames.map(day => `<div class="calendar-weekday">${day}</div>`).join("")}
      </div>
      <div class="calendar-grid">${cells.join("")}</div>
    </div>
  `;
}

function changeCalendarMonth(direction) {
  calendarMonth += direction;

  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear -= 1;
  }
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear += 1;
  }
  if (calendarYear < 2026 || (calendarYear === 2026 && calendarMonth < 2)) {
    calendarYear = 2026;
    calendarMonth = 2;
  }

  renderCalendar();
}

function renderYearSelectors() {
  const dashboardSelector = document.getElementById("dashboardYearSelector");
  const academicsSelector = document.getElementById("academicsYearSelector");
  const courseYear = document.getElementById("courseYear");

  [dashboardSelector, academicsSelector, courseYear].forEach(select => {
    if (!select) return;

    const currentValue = select.id === "courseYear" ? null : state.currentYearView;

    select.innerHTML = SCHOOL_YEARS.map(year => `
      <option value="${year}" ${currentValue === year ? "selected" : ""}>${year}</option>
    `).join("");

    if (select.id === "courseYear") {
      select.value = state.currentYearView;
    }
  });

  if (dashboardSelector) {
    dashboardSelector.onchange = (e) => {
      state.currentYearView = e.target.value;
      saveState();
      renderPage();
    };
  }

  if (academicsSelector) {
    academicsSelector.onchange = (e) => {
      state.currentYearView = e.target.value;
      saveState();
      renderPage();
    };
  }
}

function bindCourseTextareaAutosave() {
  document.querySelectorAll("textarea[data-course-id]").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const course = state.courses.find(c => c.id === textarea.dataset.courseId);
      if (!course) return;
      course[textarea.dataset.field] = textarea.value;
      saveState();
    });
  });
}

function bindExtracurricularAutosave() {
  document.querySelectorAll("textarea[data-activity-id]").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const activity = state.extracurriculars.find(a => a.id === textarea.dataset.activityId);
      if (!activity) return;
      activity[textarea.dataset.activityField] = textarea.value;
      saveState();
    });
  });
}

function deleteGradeBand(id) {
  state.settings.gradeScale = state.settings.gradeScale.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function deleteCourseWeight(id) {
  state.settings.courseWeights = state.settings.courseWeights.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function deleteCourse(id) {
  state.courses = state.courses.filter(course => course.id !== id);
  state.assignments = state.assignments.filter(assignment => assignment.courseId !== id);
  saveState();
  renderPage();
}

function deleteAssignment(id) {
  state.assignments = state.assignments.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function deleteDeadline(id) {
  state.college.deadlines = state.college.deadlines.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function deleteCollegeSchool(id) {
  state.college.schools = state.college.schools.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function deleteActivity(id) {
  state.extracurriculars = state.extracurriculars.filter(item => item.id !== id);
  saveState();
  renderPage();
}

function renderGradeBandList() {
  const target = document.getElementById("gradeBandList");
  const countEl = document.getElementById("gradeBandCount");
  if (!target) return;

  const sorted = getGradeScaleSorted();
  if (countEl) countEl.textContent = sorted.length;

  target.innerHTML = sorted.map(band => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${band.label}</div>
          <div class="list-sub">Minimum ${Number(band.min).toFixed(1)}% • GPA ${Number(band.gpa).toFixed(2)}</div>
        </div>
        <div class="list-card-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteGradeBand('${band.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderCourseWeightList() {
  const target = document.getElementById("courseWeightList");
  const countEl = document.getElementById("weightLevelCount");
  if (!target) return;

  if (countEl) countEl.textContent = state.settings.courseWeights.length;

  target.innerHTML = state.settings.courseWeights.map(item => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.level}</div>
          <div class="list-sub">Weight ${Number(item.weight).toFixed(2)}</div>
        </div>
        <div class="list-card-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteCourseWeight('${item.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderSubjectWorkspaces() {
  const target = document.getElementById("subjectWorkspaceList");
  if (!target) return;

  const courses = getCoursesForYear(state.currentYearView);
  if (!courses.length) {
    target.innerHTML = `<div class="empty-state">No subjects yet. Add one above.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="subject-stack">
      ${courses.map(course => {
        const yearData = getCourseYearGpa(course);
        const courseAssignments = getAssignmentsForCourse(course.id).sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
          <div class="subject-card">
            <div class="subject-top">
              <div>
                <div class="subject-title">${course.name}</div>
                <div class="subject-sub">
                  ${course.schoolYear} • ${course.level}
                  ${yearData ? ` • Year Avg ${yearData.average.toFixed(1)}% • ${yearData.weighted.toFixed(2)} weighted GPA` : " • No year GPA yet"}
                </div>
              </div>
              <div class="hero-mini-meta">
                ${QUARTERS.map(quarter => {
                  const avg = getQuarterAverage(course.id, quarter);
                  return `<span class="soft-tag">${quarter}: ${avg !== null ? avg.toFixed(1) + "%" : "—"}</span>`;
                }).join("")}
              </div>
            </div>

            <div class="list-card-actions">
              <button class="btn btn-danger btn-sm" onclick="deleteCourse('${course.id}')">Delete Course</button>
            </div>

            <form class="subject-form-inline" data-course-id="${course.id}">
              <div class="subject-label">Add class assignment</div>
              <input type="text" name="assignmentName" placeholder="Assignment name" required />
              <div class="row-three">
                <select name="assignmentQuarter" required>
                  ${QUARTERS.map(q => `<option value="${q}">${q}</option>`).join("")}
                </select>
                <input type="number" name="assignmentScore" placeholder="Score earned" min="0" step="0.01" required />
                <input type="number" name="assignmentTotal" placeholder="Points possible" min="1" step="0.01" required />
              </div>
              <input type="date" name="assignmentDate" required />
              <button type="submit" class="btn btn-full">Add Assignment</button>
            </form>

            <div class="subject-columns">
              <div class="subject-column">
                <div class="subject-label">Notes</div>
                <textarea data-course-id="${course.id}" data-field="notes" placeholder="Notes, summaries, and study content...">${course.notes || ""}</textarea>

                <div class="subject-label">Reminders</div>
                <textarea data-course-id="${course.id}" data-field="reminders" placeholder="Tests, quizzes, office hours, and reminders...">${course.reminders || ""}</textarea>
              </div>

              <div class="subject-column">
                <div class="subject-label">Resources</div>
                <textarea data-course-id="${course.id}" data-field="links" placeholder="Links, folders, document names, or materials...">${course.links || ""}</textarea>

                <div class="subject-label">Study Goals</div>
                <textarea data-course-id="${course.id}" data-field="goals" placeholder="What do you want to improve in this class?">${course.goals || ""}</textarea>
              </div>

              <div class="subject-column">
                <div class="subject-label">Assignment History</div>
                <div class="assignment-subtable">
                  <div class="assignment-row assignment-header">
                    <div>Name</div>
                    <div>Quarter</div>
                    <div>Score</div>
                    <div>Date</div>
                    <div>Letter</div>
                  </div>
                  ${
                    courseAssignments.length
                      ? courseAssignments.map(item => {
                          const percent = (item.score / item.total) * 100;
                          const letter = getLetterDataFromPercent(percent).label;

                          return `
                            <div class="assignment-row">
                              <div>${item.name}</div>
                              <div>${item.quarter}</div>
                              <div>${item.score}/${item.total}</div>
                              <div>${item.date}</div>
                              <div>${letter}</div>
                            </div>
                            <div class="list-card-actions top-space-sm">
                              <button class="btn btn-danger btn-sm" onclick="deleteAssignment('${item.id}')">Delete</button>
                            </div>
                          `;
                        }).join("")
                      : `<div class="assignment-row"><div>No assignments yet</div><div>—</div><div>—</div><div>—</div><div>—</div></div>`
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  bindSubjectForms();
  bindCourseTextareaAutosave();
}

function renderDeadlines() {
  const target = document.getElementById("deadlineList");
  if (!target) return;

  const sorted = [...state.college.deadlines].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!sorted.length) {
    target.innerHTML = `<div class="empty-state">No deadlines added yet.</div>`;
    return;
  }

  target.innerHTML = sorted.map(item => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.school}</div>
          <div class="list-sub">${item.type} • ${item.date}</div>
        </div>
        <div class="list-card-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteDeadline('${item.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderCollegeList() {
  const target = document.getElementById("collegeList");
  if (!target) return;

  if (!state.college.schools.length) {
    target.innerHTML = `<div class="empty-state">No schools added yet.</div>`;
    return;
  }

  target.innerHTML = state.college.schools.map(item => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.name}</div>
          <div class="list-sub">${item.major} • ${item.category}</div>
        </div>
        <div class="list-card-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteCollegeSchool('${item.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderExtracurriculars() {
  const target = document.getElementById("extracurricularList");
  const summary = document.getElementById("activitySummary");

  if (summary) {
    summary.innerHTML = `<div class="soft-tag">${state.extracurriculars.length} activities</div>`;
  }

  if (!target) return;

  if (!state.extracurriculars.length) {
    target.innerHTML = `<div class="empty-state">No activities yet. Add one above.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="extracurricular-stack">
      ${state.extracurriculars.map(activity => `
        <div class="extracurricular-card">
          <div class="extracurricular-top">
            <div>
              <div class="extracurricular-title">${activity.title}</div>
              <div class="extracurricular-sub">${activity.category || "Activity"}</div>
            </div>
            <div class="list-card-actions">
              <button class="btn btn-danger btn-sm" onclick="deleteActivity('${activity.id}')">Delete</button>
            </div>
          </div>

          <div class="extracurricular-columns">
            <div class="extracurricular-column">
              <div class="extracurricular-label">Description</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="description">${activity.description || ""}</textarea>

              <div class="extracurricular-label">Accomplishments</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="accomplishments">${activity.accomplishments || ""}</textarea>

              <div class="extracurricular-label">Impact</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="impact">${activity.impact || ""}</textarea>
            </div>

            <div class="extracurricular-column">
              <div class="extracurricular-label">Leadership</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="leadership">${activity.leadership || ""}</textarea>

              <div class="extracurricular-label">Goals</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="goals">${activity.goals || ""}</textarea>

              <div class="extracurricular-label">Reminders</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="reminders">${activity.reminders || ""}</textarea>
            </div>

            <div class="extracurricular-column">
              <div class="extracurricular-label">Resume Bullet Ideas</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="resumeIdeas">${activity.resumeIdeas || ""}</textarea>

              <div class="extracurricular-label">Essay / Supplement Angles</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="essayIdeas">${activity.essayIdeas || ""}</textarea>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  bindExtracurricularAutosave();
}

// =========================
// FORM BINDING
// =========================
function bindForms() {
  const courseForm = document.getElementById("courseForm");
  if (courseForm) {
    const courseLevel = document.getElementById("courseLevel");
    if (courseLevel) {
      courseLevel.innerHTML = state.settings.courseWeights.map(item => `
        <option value="${item.level}">${item.level}</option>
      `).join("");
    }

    courseForm.addEventListener("submit", e => {
      e.preventDefault();

      const schoolYear = document.getElementById("courseYear").value;
      const name = document.getElementById("courseName").value.trim();
      const level = document.getElementById("courseLevel").value;
      if (!schoolYear || !name || !level) return;

      state.courses.push({
        id: crypto.randomUUID(),
        schoolYear,
        name,
        level,
        notes: "",
        reminders: "",
        links: "",
        goals: ""
      });

      saveState();
      renderPage();
      courseForm.reset();
      document.getElementById("courseYear").value = state.currentYearView;
    });
  }

  const deadlineForm = document.getElementById("deadlineForm");
  if (deadlineForm) {
    deadlineForm.addEventListener("submit", e => {
      e.preventDefault();

      state.college.deadlines.push({
        id: crypto.randomUUID(),
        school: document.getElementById("deadlineSchool").value.trim(),
        type: document.getElementById("deadlineType").value.trim(),
        date: document.getElementById("deadlineDate").value
      });

      saveState();
      renderPage();
      deadlineForm.reset();
    });
  }

  const collegeListForm = document.getElementById("collegeListForm");
  if (collegeListForm) {
    collegeListForm.addEventListener("submit", e => {
      e.preventDefault();

      state.college.schools.push({
        id: crypto.randomUUID(),
        name: document.getElementById("collegeName").value.trim(),
        major: document.getElementById("collegeMajor").value.trim(),
        category: document.getElementById("collegeCategory").value
      });

      saveState();
      renderPage();
      collegeListForm.reset();
    });
  }

  const calendarEventForm = document.getElementById("calendarEventForm");
  if (calendarEventForm) {
    calendarEventForm.addEventListener("submit", e => {
      e.preventDefault();

      addCalendarEvent(
        document.getElementById("calendarEventTitle").value.trim(),
        document.getElementById("calendarEventDate").value,
        document.getElementById("calendarEventCategory").value.trim()
      );

      calendarEventForm.reset();
    });
  }

  const activityForm = document.getElementById("activityForm");
  if (activityForm) {
    activityForm.addEventListener("submit", e => {
      e.preventDefault();

      state.extracurriculars.push({
        id: crypto.randomUUID(),
        title: document.getElementById("activityTitle").value.trim(),
        category: document.getElementById("activityCategory").value.trim(),
        description: "",
        accomplishments: "",
        impact: "",
        leadership: "",
        goals: "",
        reminders: "",
        resumeIdeas: "",
        essayIdeas: ""
      });

      saveState();
      renderPage();
      activityForm.reset();
    });
  }

  const gradeBandForm = document.getElementById("gradeBandForm");
  if (gradeBandForm) {
    gradeBandForm.addEventListener("submit", e => {
      e.preventDefault();

      const label = document.getElementById("bandLabel").value.trim();
      const min = Number(document.getElementById("bandMin").value);
      const gpa = Number(document.getElementById("bandGpa").value);
      if (!label || Number.isNaN(min) || Number.isNaN(gpa)) return;

      state.settings.gradeScale = state.settings.gradeScale.filter(item => item.label !== label);
      state.settings.gradeScale.push({ id: crypto.randomUUID(), label, min, gpa });

      saveState();
      renderPage();
      gradeBandForm.reset();
    });
  }

  const courseWeightForm = document.getElementById("courseWeightForm");
  if (courseWeightForm) {
    courseWeightForm.addEventListener("submit", e => {
      e.preventDefault();

      const level = document.getElementById("weightLevel").value.trim();
      const weight = Number(document.getElementById("weightValue").value);
      if (!level || Number.isNaN(weight)) return;

      state.settings.courseWeights = state.settings.courseWeights.filter(item => item.level !== level);
      state.settings.courseWeights.push({ id: crypto.randomUUID(), level, weight });

      saveState();
      renderPage();
      courseWeightForm.reset();
    });
  }

  ["personalStatement", "extendedResume", "supplementBank", "applicationChecklist", "collegeMaterials"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("blur", () => {
        state.college[id] = el.value;
        saveState();
      });
    }
  });
}

function bindSubjectForms() {
  document.querySelectorAll(".subject-form-inline").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const courseId = form.getAttribute("data-course-id");
      const name = form.assignmentName.value.trim();
      const quarter = form.assignmentQuarter.value;
      const score = form.assignmentScore.value;
      const total = form.assignmentTotal.value;
      const date = form.assignmentDate.value;

      if (!courseId || !name || !quarter || !score || !total || !date) return;

      state.assignments.push({
        id: crypto.randomUUID(),
        courseId,
        name,
        quarter,
        score: Number(score),
        total: Number(total),
        date
      });

      saveState();
      renderPage();
      form.reset();
    });
  });
}

function fillCollegeTextareas() {
  ["personalStatement", "extendedResume", "supplementBank", "applicationChecklist", "collegeMaterials"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = state.college[id] || "";
  });
}

// =========================
// SEED / RESET
// =========================
function seedDemoData() {
  state = clone(defaultState);
  state.currentYearView = "11th Grade";
  state.unreadEmailCount = 12;

  const bioId = crypto.randomUUID();
  const engId = crypto.randomUUID();
  const mathId = crypto.randomUUID();
  const histId = crypto.randomUUID();

  state.courses = [
    { id: bioId, schoolYear: "11th Grade", name: "Biology", level: "AP", notes: "", reminders: "", links: "", goals: "" },
    { id: engId, schoolYear: "11th Grade", name: "English", level: "Honors", notes: "", reminders: "", links: "", goals: "" },
    { id: mathId, schoolYear: "11th Grade", name: "Algebra II", level: "Advanced", notes: "", reminders: "", links: "", goals: "" },
    { id: histId, schoolYear: "10th Grade", name: "World History", level: "Regular", notes: "", reminders: "", links: "", goals: "" }
  ];

  state.assignments = [
    { id: crypto.randomUUID(), courseId: bioId, name: "Cell Quiz", quarter: "Q1", score: 18, total: 20, date: "2026-03-03" },
    { id: crypto.randomUUID(), courseId: bioId, name: "Lab Report", quarter: "Q2", score: 46, total: 50, date: "2026-03-08" },
    { id: crypto.randomUUID(), courseId: bioId, name: "Genetics Test", quarter: "Q3", score: 84, total: 100, date: "2026-03-18" },
    { id: crypto.randomUUID(), courseId: bioId, name: "Final Project", quarter: "Q4", score: 93, total: 100, date: "2026-04-25" },

    { id: crypto.randomUUID(), courseId: engId, name: "Essay Draft", quarter: "Q1", score: 45, total: 50, date: "2026-03-10" },
    { id: crypto.randomUUID(), courseId: engId, name: "Reading Quiz", quarter: "Q2", score: 19, total: 20, date: "2026-03-15" },
    { id: crypto.randomUUID(), courseId: engId, name: "Socratic Seminar", quarter: "Q3", score: 27, total: 30, date: "2026-03-28" },
    { id: crypto.randomUUID(), courseId: engId, name: "Final Essay", quarter: "Q4", score: 95, total: 100, date: "2026-04-30" },

    { id: crypto.randomUUID(), courseId: mathId, name: "Functions Quiz", quarter: "Q1", score: 16, total: 20, date: "2026-03-12" },
    { id: crypto.randomUUID(), courseId: mathId, name: "Homework Set", quarter: "Q2", score: 10, total: 10, date: "2026-03-19" },
    { id: crypto.randomUUID(), courseId: mathId, name: "Unit Test", quarter: "Q3", score: 78, total: 100, date: "2026-04-02" },
    { id: crypto.randomUUID(), courseId: mathId, name: "Quarter Exam", quarter: "Q4", score: 88, total: 100, date: "2026-05-04" },

    { id: crypto.randomUUID(), courseId: histId, name: "Map Quiz", quarter: "Q1", score: 18, total: 20, date: "2025-09-10" },
    { id: crypto.randomUUID(), courseId: histId, name: "Essay", quarter: "Q2", score: 88, total: 100, date: "2025-11-01" },
    { id: crypto.randomUUID(), courseId: histId, name: "Project", quarter: "Q3", score: 92, total: 100, date: "2026-01-18" },
    { id: crypto.randomUUID(), courseId: histId, name: "Final", quarter: "Q4", score: 90, total: 100, date: "2026-03-01" }
  ];

  state.calendarEvents = [
    { id: crypto.randomUUID(), title: "Quiz", date: "2026-03-12", category: "school" },
    { id: crypto.randomUUID(), title: "Essay Due", date: "2026-03-18", category: "school" },
    { id: crypto.randomUUID(), title: "College Meeting", date: "2026-03-25", category: "college" }
  ];

  state.college.deadlines = [
    { id: crypto.randomUUID(), school: "Example University", type: "EA", date: "2026-11-01" }
  ];

  state.college.schools = [
    { id: crypto.randomUUID(), name: "Example University", major: "Political Science", category: "Target" }
  ];

  state.extracurriculars = [
    {
      id: crypto.randomUUID(),
      title: "Example Club",
      category: "Club",
      description: "",
      accomplishments: "",
      impact: "",
      leadership: "",
      goals: "",
      reminders: "",
      resumeIdeas: "",
      essayIdeas: ""
    }
  ];

  saveState();
  renderPage();
}

function resetAllData() {
  if (!confirm("Are you sure you want to delete all saved data?")) return;
  state = clone(defaultState);
  calendarYear = 2026;
  calendarMonth = 2;
  saveState();
  renderPage();
}

// =========================
// MAIN RENDER
// =========================
function renderPage() {
  renderYearSelectors();
  renderDashboardStats();
  renderQuarterOverview();
  renderCourseCards("dashboardCourseAverages");
  renderDeadlinePreview();
  renderCalendar();
  renderSubjectWorkspaces();
  renderExtracurriculars();
  renderGradeBandList();
  renderCourseWeightList();
  renderDeadlines();
  renderCollegeList();
  fillCollegeTextareas();
}

// =========================
// STARTUP
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await protectPage();
  if (!allowed) return;

  bindForms();
  renderPage();
});