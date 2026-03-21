import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Star, X, BookOpen, Search, Filter, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE_URL from "../lib/api";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────
   Filter Configuration
───────────────────────────────────────────── */
const FILTER_GROUPS = [
  {
    id: "program",
    label: "Program",
    icon: "💻",
    options: [
      { label: "Python",  categories: ["Programming"] },
      { label: "React",   categories: ["Web Development", "Mobile Development"] },
    ],
  },
  {
    id: "domain",
    label: "Domain",
    icon: "🌐",
    options: [
      { label: "Data Science",    categories: ["Data Science"] },
      { label: "Web Dev",         categories: ["Web Development"] },
      { label: "AI & ML",         categories: ["AI & ML"] },
      { label: "AI Ethics",       categories: ["AI Ethics"] },
      { label: "Cyber Security",  categories: ["Cyber Security"] },
      { label: "Mobile Dev",      categories: ["Mobile Development"] },
      { label: "Databases",       categories: ["Databases"] },
    ],
  },
  {
    id: "level",
    label: "Level",
    icon: "📊",
    options: [
      { label: "Beginner",      levels: ["Beginner"] },
      { label: "Intermediate",  levels: ["Intermediate"] },
      { label: "Advanced",      levels: ["Advanced"] },
    ],
  },
];

function courseMatchesFilter(course, groupId, option) {
  if (groupId === "level") return option.levels?.includes(course.level);
  return option.categories?.includes(course.category);
}

const CATEGORY_COLORS = {
  "Programming":        "bg-yellow-100 text-yellow-700",
  "Web Development":    "bg-purple-100 text-purple-600",
  "AI & ML":            "bg-cyan-100 text-cyan-600",
  "AI Ethics":          "bg-green-100 text-green-600",
  "Data Science":       "bg-blue-100 text-blue-600",
  "Cyber Security":     "bg-red-100 text-red-600",
  "Mobile Development": "bg-orange-100 text-orange-600",
  "Databases":          "bg-indigo-100 text-indigo-600",
};
const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || "bg-slate-100 text-slate-600";

/* ─────────────────────────────────────────────
   FilterBar  (shared by both tabs)
───────────────────────────────────────────── */
const FilterBar = ({ activeFilters, onToggle, onClearAll, totalShown, totalAll, label }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const hasActive = Object.values(activeFilters).some((v) => v !== null);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-main">
          <Filter className="w-4 h-4 text-teal-500" />
          Filter by:
        </div>

        {FILTER_GROUPS.map((group) => {
          const active = activeFilters[group.id];
          const isOpen = openGroup === group.id;
          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-teal-500 text-white border-teal-500 shadow-md"
                    : "bg-card text-main border-border hover:border-teal-400 hover:text-teal-600"
                }`}
              >
                <span>{group.icon}</span>
                <span>{active ? active.label : group.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenGroup(null)} />
                  <div className="absolute left-0 top-full mt-2 z-20 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-48">
                    {active && (
                      <button
                        onClick={() => { onToggle(group.id, null); setOpenGroup(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-b border-border"
                      >
                        <X className="w-3.5 h-3.5" /> Clear filter
                      </button>
                    )}
                    {group.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { onToggle(group.id, opt); setOpenGroup(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          active?.label === opt.label
                            ? "bg-teal-50 text-teal-700 font-semibold"
                            : "text-main hover:bg-canvas-alt"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {hasActive && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-all"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}

        <span className="ml-auto text-xs text-muted">
          {hasActive
            ? `${totalShown} of ${totalAll} ${label}`
            : `${totalAll} ${label}`}
        </span>
      </div>

      {hasActive && (
        <div className="flex flex-wrap gap-2 mt-3">
          {FILTER_GROUPS.map((group) =>
            activeFilters[group.id] ? (
              <span
                key={group.id}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full"
              >
                {group.icon} {group.label}: {activeFilters[group.id].label}
                <button
                  onClick={() => onToggle(group.id, null)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const CoursesPage = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState("my-courses");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exploreCourses, setExploreCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ── separate filter states for each tab ──
  const emptyFilters = () => Object.fromEntries(FILTER_GROUPS.map((g) => [g.id, null]));
  const [myFilters,      setMyFilters]      = useState(emptyFilters());
  const [exploreFilters, setExploreFilters] = useState(emptyFilters());

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const [exploreRes, myRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/courses`),
          fetch(`${API_BASE_URL}/api/courses/my-courses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const exploreData = await exploreRes.json();
        const myData = myRes.ok ? await myRes.json() : [];
        setExploreCourses(exploreData);
        setMyCourses(myData);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (location?.state?.activeTab === "explore") setActiveTab("explore");
  }, [location]);

  // ── filter helpers ──
  const applyFilters = (courseList, filters) =>
    courseList.filter((course) =>
      FILTER_GROUPS.every((group) => {
        const active = filters[group.id];
        if (!active) return true;
        return courseMatchesFilter(course, group.id, active);
      })
    );

  const unenrolledCourses   = exploreCourses.filter((c) => !myCourses.some((m) => m.id === c.id));
  const filteredMyCourses   = applyFilters(myCourses,       myFilters);
  const filteredExplore     = applyFilters(unenrolledCourses, exploreFilters);

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/users/purchase-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: selectedCourse.id, courseTitle: selectedCourse.title }),
      });
      const [exploreRes, myRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/courses`),
        fetch(`${API_BASE_URL}/api/courses/my-courses`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setExploreCourses(await exploreRes.json());
      setMyCourses(await myRes.json());
      setShowEnrollPopup(false);
      setSelectedCourse(null);
      setActiveTab("my-courses");
    } catch (err) {
      console.error("Enroll error:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas-alt flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-main mb-4">Please Login</h1>
          <p className="text-muted">You need to be logged in to access the courses page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-alt flex flex-col">
      <Header />
      <Sidebar activePage="courses" />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 mt-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        {/* ══════ HERO ══════ */}
        <div className="relative overflow-hidden bg-linear-to-br from-teal-700 via-teal-600 to-teal-800 pt-16 pb-12 px-4 sm:px-8">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-5">
              <img
                src={
                  user?.avatar_url ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
                    user?.name || user?.email?.split("@")[0] || "User"
                  )}`
                }
                alt="Profile"
                className="w-20 h-20 rounded-full border-3 border-white/80 object-cover shadow-lg"
              />
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {user?.name ||
                    (user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email?.split("@")[0] || "User")}
                </h1>
                <p className="text-teal-100 text-sm sm:text-base mt-1">
                  {t("courses.subtitle")}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setActiveTab("my-courses")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeTab === "my-courses"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-black/30 text-white hover:bg-black/40"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Enrolled Courses
              </button>
              <button
                onClick={() => setActiveTab("explore")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeTab === "explore"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-black/30 text-white hover:bg-black/40"
                }`}
              >
                <Search className="w-4 h-4" />
                {t("courses.explore")}
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">

            {/* ═══════ MY COURSES ═══════ */}
            {activeTab === "my-courses" && (
              <div>
                {/* {myCourses.length > 0 && (
                  // <FilterBar
                  //   activeFilters={myFilters}
                  //   onToggle={(groupId, option) =>
                  //     setMyFilters((prev) => ({ ...prev, [groupId]: option }))
                  //   }
                  //   onClearAll={() => setMyFilters(emptyFilters())}
                  //   totalShown={filteredMyCourses.length}
                  //   totalAll={myCourses.length}
                  //   label={`enrolled course${myCourses.length !== 1 ? "s" : ""}`}
                  // />
                )} */}

                {myCourses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-main mb-2">No courses yet</h3>
                    <p className="text-muted mb-6">{t("courses.not_enrolled")}</p>
                    <button
                      onClick={() => setActiveTab("explore")}
                      className="px-6 py-2.5 bg-teal-500 text-white rounded-full font-semibold text-sm hover:bg-teal-600 transition-colors"
                    >
                      Explore Courses
                    </button>
                  </div>
                )}

                {myCourses.length > 0 && filteredMyCourses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-main mb-1">No courses match your filters</h3>
                    <p className="text-muted text-sm mb-4">Try adjusting or clearing the active filters.</p>
                    <button
                      onClick={() => setMyFilters(emptyFilters())}
                      className="px-5 py-2 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMyCourses.map((course) => {
                    const purchasedEntry = user?.purchasedCourses?.find(
                      (c) => Number(c.courseId) === Number(course.id)
                    );
                    const progress = purchasedEntry?.progress;
                    const hasStarted =
                      progress?.completedLessons?.length > 0 || progress?.currentLesson != null;

                    return (
                      <div
                        key={course.id}
                        className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-40">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                          <span
                            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(course.category)}`}
                          >
                            {course.category}
                          </span>
                        </div>

                        <div className="p-5 space-y-3">
                          <h3 className="text-base font-semibold text-main leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-xs text-muted">
                            {course.lessons} &bull; {course.level}
                          </p>
                          <button
                            onClick={() => navigate(`/learning/${course.id}`)}
                            className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-white font-semibold text-sm hover:bg-teal-500 transition-colors"
                          >
                            {hasStarted ? t("common.continue_learning") : t("common.start_learning")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════ EXPLORE ═══════ */}
            {activeTab === "explore" && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-main">All Courses</h2>
                  <p className="text-sm text-muted mt-1">
                    {unenrolledCourses.length} courses available to enroll
                  </p>
                </div>

                {/* ── EXPLORE FILTER BAR ── */}
                <FilterBar
                  activeFilters={exploreFilters}
                  onToggle={(groupId, option) =>
                    setExploreFilters((prev) => ({ ...prev, [groupId]: option }))
                  }
                  onClearAll={() => setExploreFilters(emptyFilters())}
                  totalShown={filteredExplore.length}
                  totalAll={unenrolledCourses.length}
                  label="courses available"
                />

                {/* No results state */}
                {filteredExplore.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-main mb-1">No courses match your filters</h3>
                    <p className="text-muted text-sm mb-4">Try adjusting or clearing the active filters.</p>
                    <button
                      onClick={() => setExploreFilters(emptyFilters())}
                      className="px-5 py-2 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {/* Course Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredExplore.map((course) => (
                    <div
                      key={course.id}
                      className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40">
                        <img
                          src={course.image}
                          className="w-full h-full object-cover"
                          alt={course.title}
                        />
                        <div className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {course.rating}
                        </div>
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(course.category)}`}
                        >
                          {course.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-main leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted">
                          {course.lessons} &bull; {course.level}
                        </p>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="line-through text-xs text-slate-400 mr-1">
                              {course.price}
                            </span>
                            <span className="font-bold text-green-600 text-sm">₹0</span>
                          </div>
                          <button
                            onClick={() => navigate(`/course-preview/${course.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#2DD4BF] text-white text-xs font-semibold hover:bg-teal-500 transition-colors"
                          >
                            {t("common.enroll")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══════ ENROLL POPUP ═══════ */}
      {showEnrollPopup && selectedCourse && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">
            <button onClick={() => setShowEnrollPopup(false)} className="absolute top-4 right-4">
              <X />
            </button>
            <img
              src={selectedCourse.image}
              alt={selectedCourse.title}
              className="w-full h-40 object-cover rounded-xl mb-4"
            />
            <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {selectedCourse.category} &bull; {selectedCourse.level}
            </p>
            <div className="flex justify-between items-center mt-4">
              <span className="line-through text-slate-400">{selectedCourse.price}</span>
              <span className="text-lg font-bold text-green-600">₹0</span>
            </div>
            <button
              onClick={handleEnroll}
              className="w-full mt-6 py-3 rounded-xl bg-[#2DD4BF] text-white font-semibold"
            >
              {t("courses.confirm_enrollment")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
