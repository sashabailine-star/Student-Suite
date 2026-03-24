const SUPABASE_URL = "https://kprlkctuyggqypjqwrey.supabase.co";
const SUPABASE_KEY = "sb_publishable_w3xLD4D-gk0HQwRCOY7kow_7aa_qLzM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const AUTH_URL = "https://sashabailine-star.github.io/Student-Suite/auth.html";

const STORAGE_KEY = "studentSuiteLocalFallbackV5";
const SCHOOL_YEARS = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const DEFAULT_GRADING_SCHEMA = {
  Tests: 30,
  Assignments: 40,
  Participation: 30
};

let currentUserId = null;
let calendarYear = 2026;
let calendarMonth = 2;

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

async function protectPage() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data?.session) {
    window.location.href = AUTH_URL;
    return false;
  }

  currentUserId = data.session.user.id;
  return true;
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = AUTH_URL;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeGradingSchema(schema) {
  const source = schema && typeof schema === "object" ? schema : DEFAULT_GRADING_SCHEMA;
  return {
    Tests: Number(source.Tests ?? 30),
    Assignments: Number(source.Assignments ?? 40),
    Participation: Number(source.Participation ?? 30)
  };
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
      extracurriculars: Array.isArray(parsed.extracurriculars) ? parsed.extracurriculars : [],
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : []
    };
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadCoursesFromSupabase() {
  const { data, error } = await supabaseClient
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return;

  state.courses = (data || []).map((course) => ({
    id: course.id,
    schoolYear: course.school_year,
    name: course.name,
    level: course.level,
    notes: course.notes || "",
    reminders: course.reminders || "",
    links: course.links || "",
    goals: course.goals || "",
    gradingSchema: normalizeGradingSchema(course.grading_schema)
  }));

  saveState();
}

async function addCourseToSupabase({ schoolYear, name, level }) {
  const { data, error } = await supabaseClient
    .from("courses")
    .insert({
      user_id: currentUserId,
      school_year: schoolYear,
      name,
      level,
      notes: "",
      reminders: "",
      links: "",
      goals: "",
      grading_schema: DEFAULT_GRADING_SCHEMA
    })
    .select()
    .single();

  if (error) {
    alert("Could not save course.");
    return false;
  }

  state.courses.push({
    id: data.id,
    schoolYear: data.school_year,
    name: data.name,
    level: data.level,
    notes: data.notes || "",
    reminders: data.reminders || "",
    links: data.links || "",
    goals: data.goals || "",
    gradingSchema: normalizeGradingSchema(data.grading_schema)
  });

  saveState();
  return true;
}

async function deleteCourseFromSupabase(id) {
  const { error } = await supabaseClient.from("courses").delete().eq("id", id);
  if (error) return;

  state.courses = state.courses.filter((course) => course.id !== id);
  state.assignments = state.assignments.filter((assignment) => assignment.courseId !== id);
  saveState();
  renderPage();
}

async function updateCourseFieldInSupabase(courseId, field, value) {
  const columnMap = {
    notes: "notes",
    reminders: "reminders",
    links: "links",
    goals: "goals",
    gradingSchema: "grading_schema"
  };

  const column = columnMap[field];
  if (!column) return;

  await supabaseClient.from("courses").update({ [column]: value }).eq("id", courseId);
}

async function loadAssignmentsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("assignments")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return;

  state.assignments = (data || []).map((assignment) => ({
    id: assignment.id,
    courseId: assignment.course_id,
    name: assignment.name,
    category: assignment.category || "Assignments",
    quarter: assignment.quarter,
    score: Number(assignment.score),
    total: Number(assignment.total),
    date: assignment.date
  }));

  saveState();
}

async function addAssignmentToSupabase({ courseId, name, category, quarter, score, total, date }) {
  const { data, error } = await supabaseClient
    .from("assignments")
    .insert({
      user_id: currentUserId,
      course_id: courseId,
      name,
      category,
      quarter,
      score: Number(score),
      total: Number(total),
      date
    })
    .select()
    .single();

  if (error) {
    alert("Could not save assignment.");
    return false;
  }

  state.assignments.push({
    id: data.id,
    courseId: data.course_id,
    name: data.name,
    category: data.category || "Assignments",
    quarter: data.quarter,
    score: Number(data.score),
    total: Number(data.total),
    date: data.date
  });

  saveState();
  return true;
}

async function deleteAssignmentFromSupabase(id) {
  const { error } = await supabaseClient.from("assignments").delete().eq("id", id);
  if (error) return;

  state.assignments = state.assignments.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

async function loadExtracurricularsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("extracurriculars")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return;

  state.extracurriculars = (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    description: item.description || "",
    accomplishments: item.accomplishments || "",
    impact: item.impact || "",
    leadership: item.leadership || "",
    goals: item.goals || "",
    reminders: item.reminders || "",
    resumeIdeas: item.resume_ideas || "",
    essayIdeas: item.essay_ideas || ""
  }));

  saveState();
}

async function addExtracurricularToSupabase({ title, category }) {
  const { data, error } = await supabaseClient
    .from("extracurriculars")
    .insert({
      user_id: currentUserId,
      title,
      category,
      description: "",
      accomplishments: "",
      impact: "",
      leadership: "",
      goals: "",
      reminders: "",
      resume_ideas: "",
      essay_ideas: ""
    })
    .select()
    .single();

  if (error) {
    alert("Could not save extracurricular.");
    return false;
  }

  state.extracurriculars.push({
    id: data.id,
    title: data.title,
    category: data.category,
    description: data.description || "",
    accomplishments: data.accomplishments || "",
    impact: data.impact || "",
    leadership: data.leadership || "",
    goals: data.goals || "",
    reminders: data.reminders || "",
    resumeIdeas: data.resume_ideas || "",
    essayIdeas: data.essay_ideas || ""
  });

  saveState();
  return true;
}

async function updateExtracurricularFieldInSupabase(activityId, field, value) {
  const columnMap = {
    description: "description",
    accomplishments: "accomplishments",
    impact: "impact",
    leadership: "leadership",
    goals: "goals",
    reminders: "reminders",
    resumeIdeas: "resume_ideas",
    essayIdeas: "essay_ideas"
  };

  const column = columnMap[field];
  if (!column) return;

  await supabaseClient.from("extracurriculars").update({ [column]: value }).eq("id", activityId);
}

async function deleteExtracurricularFromSupabase(id) {
  const { error } = await supabaseClient.from("extracurriculars").delete().eq("id", id);
  if (error) return;

  state.extracurriculars = state.extracurriculars.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

async function ensureCollegeContentRow() {
  const { data } = await supabaseClient
    .from("college_content")
    .select("*")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!data) {
    await supabaseClient.from("college_content").insert({
      user_id: currentUserId,
      personal_statement: "",
      extended_resume: "",
      supplement_bank: "",
      application_checklist: "",
      college_materials: ""
    });
  }
}

async function loadCollegeContentFromSupabase() {
  await ensureCollegeContentRow();

  const { data, error } = await supabaseClient
    .from("college_content")
    .select("*")
    .eq("user_id", currentUserId)
    .single();

  if (error || !data) return;

  state.college.personalStatement = data.personal_statement || "";
  state.college.extendedResume = data.extended_resume || "";
  state.college.supplementBank = data.supplement_bank || "";
  state.college.applicationChecklist = data.application_checklist || "";
  state.college.collegeMaterials = data.college_materials || "";

  saveState();
}

async function updateCollegeContentFieldInSupabase(field, value) {
  const columnMap = {
    personalStatement: "personal_statement",
    extendedResume: "extended_resume",
    supplementBank: "supplement_bank",
    applicationChecklist: "application_checklist",
    collegeMaterials: "college_materials"
  };

  const column = columnMap[field];
  if (!column) return;

  await supabaseClient
    .from("college_content")
    .update({
      [column]: value,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", currentUserId);
}

async function loadCollegeSchoolsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("college_schools")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return;

  state.college.schools = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    major: item.major,
    category: item.category
  }));

  saveState();
}

async function addCollegeSchoolToSupabase({ name, major, category }) {
  const { data, error } = await supabaseClient
    .from("college_schools")
    .insert({
      user_id: currentUserId,
      name,
      major,
      category
    })
    .select()
    .single();

  if (error) {
    alert("Could not save college.");
    return false;
  }

  state.college.schools.push({
    id: data.id,
    name: data.name,
    major: data.major,
    category: data.category
  });

  saveState();
  return true;
}

async function deleteCollegeSchoolFromSupabase(id) {
  const { error } = await supabaseClient.from("college_schools").delete().eq("id", id);
  if (error) return;

  state.college.schools = state.college.schools.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

async function loadCollegeDeadlinesFromSupabase() {
  const { data, error } = await supabaseClient
    .from("college_deadlines")
    .select("*")
    .order("date", { ascending: true });

  if (error) return;

  state.college.deadlines = (data || []).map((item) => ({
    id: item.id,
    school: item.school,
    type: item.type,
    date: item.date
  }));

  saveState();
}

async function addCollegeDeadlineToSupabase({ school, type, date }) {
  const { data, error } = await supabaseClient
    .from("college_deadlines")
    .insert({
      user_id: currentUserId,
      school,
      type,
      date
    })
    .select()
    .single();

  if (error) {
    alert("Could not save deadline.");
    return false;
  }

  state.college.deadlines.push({
    id: data.id,
    school: data.school,
    type: data.type,
    date: data.date
  });

  saveState();
  return true;
}

async function deleteCollegeDeadlineFromSupabase(id) {
  const { error } = await supabaseClient.from("college_deadlines").delete().eq("id", id);
  if (error) return;

  state.college.deadlines = state.college.deadlines.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

function getGradeScaleSorted() {
  return [...state.settings.gradeScale].sort((a, b) => Number(b.min) - Number(a.min));
}

function getLetterDataFromPercent(percent) {
  return getGradeScaleSorted().find((band) => percent >= Number(band.min)) || { label: "F", gpa: 0 };
}

function getCourseWeight(level) {
  const match = state.settings.courseWeights.find((item) => item.level === level);
  return match ? Number(match.weight) : 0;
}

function getCoursesForYear(year) {
  return state.courses.filter((course) => course.schoolYear === year);
}

function getAssignmentsForCourse(courseId) {
  return state.assignments.filter((a) => a.courseId === courseId);
}

function getAssignmentsForCourseQuarter(courseId, quarter) {
  return state.assignments.filter((a) => a.courseId === courseId && a.quarter === quarter);
}

function getCategoryAverage(courseId, quarter, category) {
  const items = getAssignmentsForCourseQuarter(courseId, quarter).filter((a) => a.category === category);
  if (!items.length) return null;

  const earned = items.reduce((sum, item) => sum + Number(item.score), 0);
  const possible = items.reduce((sum, item) => sum + Number(item.total), 0);
  if (!possible) return null;

  return (earned / possible) * 100;
}

function getQuarterAverage(courseId, quarter) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return null;

  const schema = normalizeGradingSchema(course.gradingSchema);
  const categories = Object.keys(schema);

  let weightedTotal = 0;
  let weightUsed = 0;

  categories.forEach((category) => {
    const avg = getCategoryAverage(courseId, quarter, category);
    const weight = Number(schema[category] || 0);

    if (avg !== null && weight > 0) {
      weightedTotal += avg * (weight / 100);
      weightUsed += weight;
    }
  });

  if (weightUsed > 0) {
    return weightedTotal * (100 / weightUsed);
  }

  const items = getAssignmentsForCourseQuarter(courseId, quarter);
  if (!items.length) return null;

  const earned = items.reduce((sum, item) => sum + Number(item.score), 0);
  const possible = items.reduce((sum, item) => sum + Number(item.total), 0);
  if (!possible) return null;

  return (earned / possible) * 100;
}

function getCourseYearAverage(courseId) {
  const quarterAverages = QUARTERS.map((q) => getQuarterAverage(courseId, q)).filter((avg) => avg !== null);
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
  const graded = courses.map((course) => getCourseYearGpa(course)).filter(Boolean);

  if (!graded.length) return { weighted: 0, unweighted: 0 };

  return {
    unweighted: graded.reduce((sum, item) => sum + item.base, 0) / graded.length,
    weighted: graded.reduce((sum, item) => sum + item.weighted, 0) / graded.length
  };
}

function getCumulativeGpa() {
  const yearly = SCHOOL_YEARS.map((year) => {
    const hasCourses = getCoursesForYear(year).length > 0;
    return hasCourses ? getYearGpa(year) : null;
  }).filter(Boolean);

  if (!yearly.length) return { weighted: 0, unweighted: 0 };

  return {
    unweighted: yearly.reduce((sum, item) => sum + item.unweighted, 0) / yearly.length,
    weighted: yearly.reduce((sum, item) => sum + item.weighted, 0) / yearly.length
  };
}

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
      ${QUARTERS.map((quarter) => {
        const values = courses.map((course) => getQuarterAverage(course.id, quarter)).filter((v) => v !== null);
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
      ${courses.map((course) => {
        const yearData = getCourseYearGpa(course);
        const letterData = yearData ? getLetterDataFromPercent(yearData.average) : null;

        return `
          <div class="course-card">
            <div class="course-name">${course.name}</div>
            <div class="course-meta">
              ${course.level}
              ${yearData ? ` • ${letterData.label} • ${yearData.base.toFixed(2)} base • ${yearData.weighted.toFixed(2)} weighted` : " • No year GPA yet"}
            </div>
            <div class="top-gap">
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

  const schoolDeadlines = state.assignments.map((a) => {
    const course = state.courses.find((c) => c.id === a.courseId);
    return {
      title: a.name,
      subtitle: `${course ? course.name : "Course"} • ${a.quarter}`,
      source: "School",
      date: a.date
    };
  });

  const collegeDeadlines = state.college.deadlines.map((d) => ({
    title: d.school,
    subtitle: d.type,
    source: "College",
    date: d.date
  }));

  const combined = [...schoolDeadlines, ...collegeDeadlines]
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  if (!combined.length) {
    target.innerHTML = `<div class="empty-state">No upcoming deadlines yet.</div>`;
    return;
  }

  target.innerHTML = combined.map((item) => `
    <div class="list-card">
      <div class="list-title">${item.title}</div>
      <div class="list-sub">${item.source} • ${item.subtitle} • ${item.date}</div>
    </div>
  `).join("");
}

function addCalendarEvent(title, date, category) {
  state.calendarEvents.push({ id: crypto.randomUUID(), title, date, category });
  saveState();
  renderPage();
}

function renderCalendar() {
  const target = document.getElementById("calendarGrid");
  if (!target) return;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
    const events = state.calendarEvents.filter((e) => e.date === dateString);

    cells.push(`
      <div class="calendar-day">
        <div class="calendar-day-number">${day}</div>
        ${events.map((e) => `<div class="calendar-event">${e.title}</div>`).join("")}
      </div>
    `);
  }

  target.innerHTML = `
    <div class="calendar-controls">
      <button class="btn btn-secondary" onclick="changeCalendarMonth(-1)">Prev</button>
      <div class="calendar-month-title">${monthNames[calendarMonth]} ${calendarYear}</div>
      <button class="btn btn-secondary" onclick="changeCalendarMonth(1)">Next</button>
    </div>
    <div class="calendar-header">
      ${weekdayNames.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
    </div>
    <div class="calendar-grid">${cells.join("")}</div>
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

  [dashboardSelector, academicsSelector, courseYear].forEach((select) => {
    if (!select) return;

    const currentValue = select.id === "courseYear" ? null : state.currentYearView;

    select.innerHTML = SCHOOL_YEARS.map((year) => `
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
  document.querySelectorAll("textarea[data-course-id]").forEach((textarea) => {
    textarea.addEventListener("blur", async () => {
      const course = state.courses.find((c) => c.id === textarea.dataset.courseId);
      if (!course) return;

      course[textarea.dataset.field] = textarea.value;
      saveState();
      await updateCourseFieldInSupabase(course.id, textarea.dataset.field, textarea.value);
    });
  });
}

function bindWeightingAutosave() {
  document.querySelectorAll(".weight-input").forEach((input) => {
    input.addEventListener("change", async () => {
      const course = state.courses.find((c) => c.id === input.dataset.courseId);
      if (!course) return;

      const schema = normalizeGradingSchema(course.gradingSchema);
      schema[input.dataset.category] = Number(input.value || 0);
      course.gradingSchema = schema;
      saveState();
      await updateCourseFieldInSupabase(course.id, "gradingSchema", schema);
      renderPage();
    });
  });
}

function bindExtracurricularAutosave() {
  document.querySelectorAll("textarea[data-activity-id]").forEach((textarea) => {
    textarea.addEventListener("blur", async () => {
      const activity = state.extracurriculars.find((a) => a.id === textarea.dataset.activityId);
      if (!activity) return;

      activity[textarea.dataset.activityField] = textarea.value;
      saveState();
      await updateExtracurricularFieldInSupabase(activity.id, textarea.dataset.activityField, textarea.value);
    });
  });
}

function bindCollegeTextAutosave() {
  ["personalStatement", "extendedResume", "supplementBank", "applicationChecklist", "collegeMaterials"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("blur", async () => {
      const fieldMap = {
        personalStatement: "personalStatement",
        extendedResume: "extendedResume",
        supplementBank: "supplementBank",
        applicationChecklist: "applicationChecklist",
        collegeMaterials: "collegeMaterials"
      };

      state.college[fieldMap[id]] = el.value;
      saveState();
      await updateCollegeContentFieldInSupabase(fieldMap[id], el.value);
    });
  });
}

function deleteGradeBand(id) {
  state.settings.gradeScale = state.settings.gradeScale.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

function deleteCourseWeight(id) {
  state.settings.courseWeights = state.settings.courseWeights.filter((item) => item.id !== id);
  saveState();
  renderPage();
}

async function deleteCourse(id) {
  await deleteCourseFromSupabase(id);
}

async function deleteAssignment(id) {
  await deleteAssignmentFromSupabase(id);
}

async function deleteDeadline(id) {
  await deleteCollegeDeadlineFromSupabase(id);
}

async function deleteCollegeSchool(id) {
  await deleteCollegeSchoolFromSupabase(id);
}

async function deleteActivity(id) {
  await deleteExtracurricularFromSupabase(id);
}

function renderGradeBandList() {
  const target = document.getElementById("gradeBandList");
  if (!target) return;

  const sorted = getGradeScaleSorted();

  target.innerHTML = sorted.map((band) => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${band.label}</div>
          <div class="list-sub">Minimum ${Number(band.min).toFixed(1)}% • GPA ${Number(band.gpa).toFixed(2)}</div>
        </div>
        <button class="btn btn-danger" onclick="deleteGradeBand('${band.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderCourseWeightList() {
  const target = document.getElementById("courseWeightList");
  if (!target) return;

  target.innerHTML = state.settings.courseWeights.map((item) => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.level}</div>
          <div class="list-sub">Weight ${Number(item.weight).toFixed(2)}</div>
        </div>
        <button class="btn btn-danger" onclick="deleteCourseWeight('${item.id}')">Delete</button>
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
      ${courses.map((course) => {
        const yearData = getCourseYearGpa(course);
        const courseAssignments = getAssignmentsForCourse(course.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const schema = normalizeGradingSchema(course.gradingSchema);

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
              <div>
                ${QUARTERS.map((quarter) => {
                  const avg = getQuarterAverage(course.id, quarter);
                  return `<span class="soft-tag">${quarter}: ${avg !== null ? avg.toFixed(1) + "%" : "—"}</span>`;
                }).join("")}
              </div>
            </div>

            <div class="subject-column top-gap">
              <div class="subject-label">Course Weighting</div>
              <div class="weighting-grid">
                <div>
                  <label class="weighting-note">Tests %</label>
                  <input class="weight-input" data-course-id="${course.id}" data-category="Tests" type="number" min="0" max="100" value="${schema.Tests}" />
                </div>
                <div>
                  <label class="weighting-note">Assignments %</label>
                  <input class="weight-input" data-course-id="${course.id}" data-category="Assignments" type="number" min="0" max="100" value="${schema.Assignments}" />
                </div>
                <div>
                  <label class="weighting-note">Participation %</label>
                  <input class="weight-input" data-course-id="${course.id}" data-category="Participation" type="number" min="0" max="100" value="${schema.Participation}" />
                </div>
              </div>
              <div class="weighting-note">These do not have to total 100 while editing, but your averages will make the most sense when they do.</div>
            </div>

            <div class="top-gap">
              <button class="btn btn-danger" onclick="deleteCourse('${course.id}')">Delete Course</button>
            </div>

            <form class="subject-form-inline top-gap" data-course-id="${course.id}">
              <div class="subject-label">Add class assignment</div>
              <input type="text" name="assignmentName" placeholder="Assignment name" required />
              <div class="row-three">
                <select name="assignmentCategory" required>
                  <option value="Tests">Tests</option>
                  <option value="Assignments">Assignments</option>
                  <option value="Participation">Participation</option>
                </select>
                <select name="assignmentQuarter" required>
                  ${QUARTERS.map((q) => `<option value="${q}">${q}</option>`).join("")}
                </select>
                <input type="number" name="assignmentScore" placeholder="Score earned" min="0" step="0.01" required />
              </div>
              <div class="row-three">
                <input type="number" name="assignmentTotal" placeholder="Points possible" min="1" step="0.01" required />
                <input type="date" name="assignmentDate" required />
                <button type="submit" class="btn btn-primary">Add Assignment</button>
              </div>
            </form>

            <div class="subject-columns">
              <div class="subject-column">
                <div class="subject-label">Notes</div>
                <textarea data-course-id="${course.id}" data-field="notes">${course.notes || ""}</textarea>

                <div class="subject-label">Reminders</div>
                <textarea data-course-id="${course.id}" data-field="reminders">${course.reminders || ""}</textarea>
              </div>

              <div class="subject-column">
                <div class="subject-label">Resources</div>
                <textarea data-course-id="${course.id}" data-field="links">${course.links || ""}</textarea>

                <div class="subject-label">Study Goals</div>
                <textarea data-course-id="${course.id}" data-field="goals">${course.goals || ""}</textarea>
              </div>

              <div class="subject-column">
                <div class="subject-label">Assignment History</div>
                <div class="assignment-subtable">
                  <div class="assignment-row assignment-header">
                    <div>Name</div>
                    <div>Category</div>
                    <div>Quarter</div>
                    <div>Score</div>
                    <div>Date</div>
                    <div>Letter</div>
                  </div>
                  ${
                    courseAssignments.length
                      ? courseAssignments.map((item) => {
                          const percent = (item.score / item.total) * 100;
                          const letter = getLetterDataFromPercent(percent).label;
                          return `
                            <div class="assignment-row">
                              <div>${item.name}</div>
                              <div>${item.category || "Assignments"}</div>
                              <div>${item.quarter}</div>
                              <div>${item.score}/${item.total}</div>
                              <div>${item.date}</div>
                              <div>${letter}</div>
                            </div>
                            <div class="top-gap">
                              <button class="btn btn-danger btn-sm" onclick="deleteAssignment('${item.id}')">Delete Assignment</button>
                            </div>
                          `;
                        }).join("")
                      : `<div class="assignment-row"><div>No assignments yet</div><div>—</div><div>—</div><div>—</div><div>—</div><div>—</div></div>`
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
  bindWeightingAutosave();
}

function renderDeadlines() {
  const target = document.getElementById("deadlineList");
  if (!target) return;

  const sorted = [...state.college.deadlines].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!sorted.length) {
    target.innerHTML = `<div class="empty-state">No deadlines added yet.</div>`;
    return;
  }

  target.innerHTML = sorted.map((item) => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.school}</div>
          <div class="list-sub">${item.type} • ${item.date}</div>
        </div>
        <button class="btn btn-danger" onclick="deleteDeadline('${item.id}')">Delete</button>
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

  target.innerHTML = state.college.schools.map((item) => `
    <div class="list-card">
      <div class="list-card-row">
        <div>
          <div class="list-title">${item.name}</div>
          <div class="list-sub">${item.major} • ${item.category}</div>
        </div>
        <button class="btn btn-danger" onclick="deleteCollegeSchool('${item.id}')">Delete</button>
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
      ${state.extracurriculars.map((activity) => `
        <div class="extracurricular-card">
          <div class="extracurricular-top">
            <div>
              <div class="extracurricular-title">${activity.title}</div>
              <div class="extracurricular-sub">${activity.category || "Activity"}</div>
            </div>
            <button class="btn btn-danger" onclick="deleteActivity('${activity.id}')">Delete</button>
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
              <div class="extracurricular-label">Resume Ideas</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="resumeIdeas">${activity.resumeIdeas || ""}</textarea>

              <div class="extracurricular-label">Essay Angles</div>
              <textarea data-activity-id="${activity.id}" data-activity-field="essayIdeas">${activity.essayIdeas || ""}</textarea>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  bindExtracurricularAutosave();
}

function bindForms() {
  const courseForm = document.getElementById("courseForm");
  if (courseForm) {
    const courseLevel = document.getElementById("courseLevel");
    if (courseLevel) {
      courseLevel.innerHTML = state.settings.courseWeights.map((item) => `
        <option value="${item.level}">${item.level}</option>
      `).join("");
    }

    courseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const schoolYear = document.getElementById("courseYear").value;
      const name = document.getElementById("courseName").value.trim();
      const level = document.getElementById("courseLevel").value;
      if (!schoolYear || !name || !level) return;

      const ok = await addCourseToSupabase({ schoolYear, name, level });
      if (!ok) return;

      renderPage();
      courseForm.reset();
      document.getElementById("courseYear").value = state.currentYearView;
    });
  }

  const deadlineForm = document.getElementById("deadlineForm");
  if (deadlineForm) {
    deadlineForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const ok = await addCollegeDeadlineToSupabase({
        school: document.getElementById("deadlineSchool").value.trim(),
        type: document.getElementById("deadlineType").value.trim(),
        date: document.getElementById("deadlineDate").value
      });

      if (!ok) return;

      renderPage();
      deadlineForm.reset();
    });
  }

  const collegeListForm = document.getElementById("collegeListForm");
  if (collegeListForm) {
    collegeListForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const ok = await addCollegeSchoolToSupabase({
        name: document.getElementById("collegeName").value.trim(),
        major: document.getElementById("collegeMajor").value.trim(),
        category: document.getElementById("collegeCategory").value
      });

      if (!ok) return;

      renderPage();
      collegeListForm.reset();
    });
  }

  const calendarEventForm = document.getElementById("calendarEventForm");
  if (calendarEventForm) {
    calendarEventForm.addEventListener("submit", (e) => {
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
    activityForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const ok = await addExtracurricularToSupabase({
        title: document.getElementById("activityTitle").value.trim(),
        category: document.getElementById("activityCategory").value.trim()
      });

      if (!ok) return;

      renderPage();
      activityForm.reset();
    });
  }

  const gradeBandForm = document.getElementById("gradeBandForm");
  if (gradeBandForm) {
    gradeBandForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const label = document.getElementById("bandLabel").value.trim();
      const min = Number(document.getElementById("bandMin").value);
      const gpa = Number(document.getElementById("bandGpa").value);
      if (!label || Number.isNaN(min) || Number.isNaN(gpa)) return;

      state.settings.gradeScale = state.settings.gradeScale.filter((item) => item.label !== label);
      state.settings.gradeScale.push({ id: crypto.randomUUID(), label, min, gpa });

      saveState();
      renderPage();
      gradeBandForm.reset();
    });
  }

  const courseWeightForm = document.getElementById("courseWeightForm");
  if (courseWeightForm) {
    courseWeightForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const level = document.getElementById("weightLevel").value.trim();
      const weight = Number(document.getElementById("weightValue").value);
      if (!level || Number.isNaN(weight)) return;

      state.settings.courseWeights = state.settings.courseWeights.filter((item) => item.level !== level);
      state.settings.courseWeights.push({ id: crypto.randomUUID(), level, weight });

      saveState();
      renderPage();
      courseWeightForm.reset();
    });
  }

  bindCollegeTextAutosave();
}

function bindSubjectForms() {
  document.querySelectorAll(".subject-form-inline").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const courseId = form.getAttribute("data-course-id");
      const name = form.assignmentName.value.trim();
      const category = form.assignmentCategory.value;
      const quarter = form.assignmentQuarter.value;
      const score = form.assignmentScore.value;
      const total = form.assignmentTotal.value;
      const date = form.assignmentDate.value;

      if (!courseId || !name || !category || !quarter || !score || !total || !date) return;

      const ok = await addAssignmentToSupabase({
        courseId,
        name,
        category,
        quarter,
        score,
        total,
        date
      });

      if (!ok) return;

      renderPage();
      form.reset();
    });
  });
}

function fillCollegeTextareas() {
  const map = {
    personalStatement: state.college.personalStatement,
    extendedResume: state.college.extendedResume,
    supplementBank: state.college.supplementBank,
    applicationChecklist: state.college.applicationChecklist,
    collegeMaterials: state.college.collegeMaterials
  };

  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = map[id] || "";
  });
}

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

document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await protectPage();
  if (!allowed) return;

  await loadCoursesFromSupabase();
  await loadAssignmentsFromSupabase();
  await loadExtracurricularsFromSupabase();
  await loadCollegeContentFromSupabase();
  await loadCollegeSchoolsFromSupabase();
  await loadCollegeDeadlinesFromSupabase();

  bindForms();
  renderPage();
});