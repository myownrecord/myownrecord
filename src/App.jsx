import React, { useEffect, useState } from "react";
import { readData, writeData } from "./apis/api";

// Record value can be string "1"|"x" or object { value: "1"|"x", note?: string, mood?: string }
const getRecordValue = (record) =>
  record && typeof record === "object" && "value" in record ? record.value : record;
const getRecordNote = (record) =>
  record && typeof record === "object" && "note" in record ? record.note : undefined;
const getRecordMood = (record) =>
  record && typeof record === "object" && "mood" in record ? record.mood : undefined;

const PASSWORD_STORAGE_KEY = "insight_tracker_password";
const DEFAULT_PASSWORD = "asyncHide098";
const THEME_STORAGE_KEY = "insight_tracker_theme";

// Password Login Component
const PasswordLogin = ({ onPasswordCorrect }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const storedPassword = typeof localStorage !== "undefined" ? localStorage.getItem(PASSWORD_STORAGE_KEY) : null;
  const correctPassword = storedPassword || DEFAULT_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === correctPassword) {
        onPasswordCorrect();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="password-screen">
      <div className="password-container">
        <div className="password-header">
          <div className="password-icon">🔐</div>
          <h1 className="password-title">Private Tracker</h1>
          <p className="password-subtitle">Enter password to access your records</p>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="password-input-group">
            <label htmlFor="password" className="password-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="password-input"
              placeholder="Enter your password"
              autoFocus
              disabled={isLoading}
            />
            {error && <div className="password-error">{error}</div>}
          </div>

          <button
            type="submit"
            className="password-submit-btn"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <span className="password-loading">
                <span className="password-spinner"></span>
                Verifying...
              </span>
            ) : (
              "Access Records"
            )}
          </button>
        </form>

        <div className="password-footer">
          <p className="password-hint">🔒 Your data is secure and protected</p>
        </div>
      </div>
    </div>
  );
};

// Calculate streaks from data
const calculateStreaks = (data) => {
  if (!data) return { currentStreak: 0, longestStreak: 0, longestStreakStart: null, longestStreakEnd: null, isStreakAtRisk: false };
  
  const allDates = [];
  for (const year of Object.keys(data)) {
    if (!/^\d{4}$/.test(year)) continue;
    for (const month in data[year]) {
      for (const day in data[year][month]) {
        const val = getRecordValue(data[year][month][day]);
        if (val !== "1" && val !== "x") continue;
        const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
        if (monthIndex !== -1) {
          const date = new Date(parseInt(year), monthIndex, parseInt(day));
          allDates.push(date);
        }
      }
    }
  }
  
  if (allDates.length === 0) return { currentStreak: 0, longestStreak: 0, longestStreakStart: null, longestStreakEnd: null, isStreakAtRisk: false };
  
  allDates.sort((a, b) => a - b);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const hasToday = allDates.some((d) => d.getTime() === todayTime);

  // Current streak (from today backwards)
  let currentStreak = 0;
  for (let i = allDates.length - 1; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - currentStreak);
    checkDate.setHours(0, 0, 0, 0);
    if (allDates[i].getTime() === checkDate.getTime()) {
      currentStreak++;
    } else if (currentStreak > 0) break;
  }

  // Longest streak and its date range
  let longestStreak = 1;
  let tempStreak = 1;
  let longestStart = allDates[0];
  let longestEnd = allDates[0];
  let tempStart = allDates[0];

  for (let i = 1; i < allDates.length; i++) {
    const prevDate = allDates[i - 1];
    const currDate = allDates[i];
    const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStart = tempStart;
        longestEnd = currDate;
      }
    } else {
      tempStreak = 1;
      tempStart = currDate;
    }
  }

  const isStreakAtRisk = currentStreak > 0 && !hasToday;
  const formatDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    currentStreak,
    longestStreak,
    longestStreakStart: longestStart,
    longestStreakEnd: longestEnd,
    longestStreakRange: longestStreak > 0 ? `${formatDate(longestStart)} – ${formatDate(longestEnd)}` : null,
    isStreakAtRisk,
  };
};

// Get statistics insights
const getInsights = (data, yearCounts, monthCounts) => {
  if (!data || !yearCounts) return [];
  
  const insights = [];
  
  // Find most active year
  let maxYear = { year: "", total: 0 };
  for (let year in yearCounts) {
    const total = yearCounts[year].yearXCount + yearCounts[year].yearOneCount;
    if (total > maxYear.total) {
      maxYear = { year, total };
    }
  }
  if (maxYear.year) {
    insights.push({ type: "most_active_year", label: "Most Active Year", value: maxYear.year, subtext: `${maxYear.total} records` });
  }
  
  // Find most active month across all years
  let maxMonth = { month: "", total: 0 };
  for (let key in monthCounts) {
    const total = monthCounts[key].monthXCount + monthCounts[key].monthOneCount;
    if (total > maxMonth.total) {
      const parts = key.split("-");
      maxMonth = { month: parts[1], total };
    }
  }
  if (maxMonth.month) {
    insights.push({ type: "most_active_month", label: "Most Active Month", value: maxMonth.month, subtext: `${maxMonth.total} records` });
  }
  
  // Calculate average per year
  const years = Object.keys(yearCounts);
  if (years.length > 0) {
    const totalRecords = years.reduce((sum, year) => {
      return sum + yearCounts[year].yearXCount + yearCounts[year].yearOneCount;
    }, 0);
    const avgPerYear = Math.round(totalRecords / years.length);
    insights.push({ type: "avg_per_year", label: "Average per Year", value: avgPerYear.toString(), subtext: `across ${years.length} years` });
  }
  
  return insights;
};

// Export data to JSON/CSV
const exportData = (data, format = "json") => {
  if (!data) return;
  
  if (format === "json") {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `insight-tracker-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } else if (format === "csv") {
    const rows = [["Year", "Month", "Date", "Type", "Note", "Mood"]];
    for (const year of Object.keys(data)) {
      if (!/^\d{4}$/.test(year)) continue;
      for (let month in data[year]) {
        for (let day in data[year][month]) {
          const record = data[year][month][day];
          const val = getRecordValue(record);
          const type = val === "1" ? "Masturbated" : "Nightfall";
          rows.push([year, month, day, type, getRecordNote(record) || "", getRecordMood(record) || ""]);
        }
      }
    }
    const csv = rows.map((row) => row.map((cell) => (typeof cell === "string" && (cell.includes(",") || cell.includes('"')) ? `"${String(cell).replace(/"/g, '""')}"` : cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `insight-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

// Function to count total occurrences of "x" and 1 for each year and month
const countOccurrences = (data) => {
  let xCount = 0;
  let oneCount = 0;
  const yearCounts = {};
  const monthCounts = {};

  for (const year of Object.keys(data)) {
    if (!/^\d{4}$/.test(year)) continue;
    let yearXCount = 0;
    let yearOneCount = 0;
    for (let month in data[year]) {
      let monthXCount = 0;
      let monthOneCount = 0;
      for (let day in data[year][month]) {
        const value = getRecordValue(data[year][month][day]);
        if (value === "x") {
          xCount++;
          yearXCount++;
          monthXCount++;
        } else if (value == 1) {
          oneCount++;
          yearOneCount++;
          monthOneCount++;
        }
      }
      monthCounts[`${year}-${month}`] = { monthXCount, monthOneCount };
    }
    yearCounts[year] = { yearXCount, yearOneCount };
  }

  return { xCount, oneCount, yearCounts, monthCounts };
};

// Search and Filter Component
const SearchFilter = ({ onSearch, onFilterChange, filterYear, filterMonth, years, months }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="search-filter-section">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="filter-toggle-btn"
      >
        <span>⚙️</span>
        Filters
      </button>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Year</label>
            <select
              value={filterYear || ""}
              onChange={(e) => onFilterChange({ year: e.target.value || null })}
              className="filter-select"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Month</label>
            <select
              value={filterMonth || ""}
              onChange={(e) => onFilterChange({ month: e.target.value || null })}
              className="filter-select"
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

// Streaks Display Component
const StreaksDisplay = ({ currentStreak, longestStreak, longestStreakRange, isStreakAtRisk }) => {
  return (
    <div className="streaks-section">
      {isStreakAtRisk && (
        <div className="streak-at-risk">
          <span className="streak-at-risk-icon">⚠️</span>
          <span>Log today to keep your {currentStreak}-day streak!</span>
        </div>
      )}
      <div className="streak-card">
        <div className="streak-icon">🔥</div>
        <div className="streak-content">
          <div className="streak-label">Current Streak</div>
          <div className="streak-value">{currentStreak} days</div>
        </div>
      </div>
      <div className="streak-card">
        <div className="streak-icon">⭐</div>
        <div className="streak-content">
          <div className="streak-label">Longest Streak</div>
          <div className="streak-value">{longestStreak} days</div>
          {longestStreakRange && <div className="streak-range">{longestStreakRange}</div>}
        </div>
      </div>
    </div>
  );
};

// Export Component
const ExportSection = ({ onExport }) => {
  return (
    <div className="export-section">
      <button onClick={() => onExport("json")} className="export-btn">
        <span>📥</span>
        Export JSON
      </button>
      <button onClick={() => onExport("csv")} className="export-btn">
        <span>📊</span>
        Export CSV
      </button>
    </div>
  );
};

// Settings Modal with Change Password
const SettingsModal = ({ onClose, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedPassword = typeof localStorage !== "undefined" ? localStorage.getItem(PASSWORD_STORAGE_KEY) : null;
  const correctPassword = storedPassword || DEFAULT_PASSWORD;

  const handleChangePassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword !== correctPassword) {
      setError("Current password is incorrect.");
      return;
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
      setSuccess("Password changed. Use the new password next time you log in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => { setSuccess(""); onPasswordChanged(); }, 1500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button type="button" onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="settings-body">
          <form onSubmit={handleChangePassword} className="settings-form">
            <h3 className="settings-section-title">Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                className="form-input"
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                className="form-input"
                placeholder="New password (min 4 characters)"
                autoComplete="new-password"
                minLength={4}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                className="form-input"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
            {error && <div className="password-error">{error}</div>}
            {success && <div className="settings-success">{success}</div>}
            <button type="submit" className="submit-btn">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// This Month Summary Card
const ThisMonthSummary = ({ data, monthCounts, currentStreak }) => {
  if (!data || !monthCounts) return null;
  const now = new Date();
  const thisYear = now.getFullYear().toString();
  const thisMonth = now.toLocaleString("default", { month: "short" });
  const key = `${thisYear}-${thisMonth}`;
  const thisMonthData = monthCounts[key] || { monthXCount: 0, monthOneCount: 0 };
  const thisTotal = thisMonthData.monthXCount + thisMonthData.monthOneCount;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYear = lastMonthDate.getFullYear().toString();
  const lastMonth = lastMonthDate.toLocaleString("default", { month: "short" });
  const lastKey = `${lastYear}-${lastMonth}`;
  const lastMonthData = monthCounts[lastKey] || { monthXCount: 0, monthOneCount: 0 };
  const lastTotal = lastMonthData.monthXCount + lastMonthData.monthOneCount;

  const diff = thisTotal - lastTotal;
  const diffText = diff > 0 ? `${diff} more than last month` : diff < 0 ? `${Math.abs(diff)} fewer than last month` : "Same as last month";

  return (
    <div className="this-month-section">
      <div className="this-month-card">
        <h3 className="this-month-title">📅 This Month</h3>
        <div className="this-month-stats">
          <div className="this-month-main">
            <span className="this-month-value">{thisTotal}</span>
            <span className="this-month-label">records in {thisMonth}</span>
          </div>
          <div className="this-month-detail">
            {diffText}
          </div>
          {currentStreak > 0 && (
            <div className="this-month-streak">
              🔥 Current streak: <strong>{currentStreak} days</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Insights Component
const InsightsSection = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="insights-section">
      <h3 className="insights-title">📈 Key Insights</h3>
      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div key={index} className="insight-card">
            <div className="insight-label">{insight.label}</div>
            <div className="insight-value">{insight.value}</div>
            <div className="insight-subtext">{insight.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Beautiful Animated Stat Card Component
const StatCard = ({ label, value, color, icon, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`stat-card group ${isVisible ? "visible" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-glow" style={{ background: color }}></div>
    </div>
  );
};

// Modern Month Card Component
const MonthDisplay = ({ year, month, dates, monthCounts, onDelete }) => {
  const { monthXCount, monthOneCount } = monthCounts[`${year}-${month}`] || {
    monthXCount: 0,
    monthOneCount: 0,
  };
  const total = monthXCount + monthOneCount;
  const selfPercentage = total > 0 ? Math.round((monthOneCount / total) * 100) : 0;
  const naturalPercentage = total > 0 ? Math.round((monthXCount / total) * 100) : 0;

  return (
    <div className="month-card">
      <div className="month-header">
        <h3 className="month-title">{month}</h3>
        <div className="month-stats">
          <span className="stat-badge self-badge">{monthOneCount}</span>
          <span className="stat-badge natural-badge">{monthXCount}</span>
          <span className="stat-badge total-badge">{total}</span>
        </div>
      </div>

      <div className="month-progress">
        <div
          className="progress-bar self-progress"
          style={{ width: `${selfPercentage}%` }}
        ></div>
        <div
          className="progress-bar natural-progress"
          style={{ width: `${naturalPercentage}%` }}
        ></div>
      </div>

      <div className="month-dates">
        {Object.entries(dates).map(([date, record]) => {
          const value = getRecordValue(record);
          const note = getRecordNote(record);
          const mood = getRecordMood(record);
          return (
          <div key={date} className="date-item">
            <span className="date-number">{date}</span>
            <span className={`date-type ${value == 1 ? "type-self" : "type-natural"}`}>
              {value == 1 ? "Masturbated" : "Nightfall"}
            </span>
            {(note || mood) && (
              <span className="date-note-mood" title={[note, mood].filter(Boolean).join(" · ")}>
                {mood && <span className="date-mood">{mood}</span>}
                {note && <span className="date-note">{note}</span>}
              </span>
            )}
            <button
              onClick={() => onDelete(year, month, date)}
              className="delete-btn"
              title="Delete"
            >
              ×
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
};

// Yearly Overview Component
const YearlyOverview = ({ yearCounts, data }) => {
  if (!data || !yearCounts) return null;

  const sortedYears = Object.keys(yearCounts).sort((a, b) => parseInt(b) - parseInt(a));

  // Calculate averages
  const totalYears = sortedYears.length;
  const avgPerYear = totalYears > 0
    ? sortedYears.reduce((sum, year) => {
        const { yearXCount, yearOneCount } = yearCounts[year];
        return sum + yearXCount + yearOneCount;
      }, 0) / totalYears
    : 0;

  const avgMasturbated = totalYears > 0
    ? sortedYears.reduce((sum, year) => sum + yearCounts[year].yearOneCount, 0) / totalYears
    : 0;

  const avgNightfall = totalYears > 0
    ? sortedYears.reduce((sum, year) => sum + yearCounts[year].yearXCount, 0) / totalYears
    : 0;

  return (
    <div className="yearly-overview-section">
      <div className="yearly-overview-card">
        <h3 className="yearly-overview-title">
          <span className="yearly-icon">📅</span>
          Yearly Overview
        </h3>
        
        <div className="yearly-stats-grid">
          {sortedYears.map((year) => {
            const { yearXCount, yearOneCount } = yearCounts[year];
            const yearTotal = yearXCount + yearOneCount;
            const masturbatedPct = yearTotal > 0 ? Math.round((yearOneCount / yearTotal) * 100) : 0;
            const nightfallPct = yearTotal > 0 ? Math.round((yearXCount / yearTotal) * 100) : 0;

            return (
              <div key={year} className="yearly-stat-item">
                <div className="yearly-stat-header">
                  <h4 className="yearly-stat-year">{year}</h4>
                  <span className="yearly-stat-total">{yearTotal} total</span>
                </div>
                
                <div className="yearly-stat-details">
                  <div className="yearly-stat-detail">
                    <span className="yearly-stat-label">Masturbated:</span>
                    <span className="yearly-stat-value" style={{ color: "#10b981" }}>
                      {yearOneCount} ({masturbatedPct}%)
                    </span>
                  </div>
                  <div className="yearly-stat-detail">
                    <span className="yearly-stat-label">Nightfall:</span>
                    <span className="yearly-stat-value" style={{ color: "#ef4444" }}>
                      {yearXCount} ({nightfallPct}%)
                    </span>
                  </div>
                </div>

                <div className="yearly-stat-progress">
                  <div
                    className="yearly-progress-bar self-progress"
                    style={{ width: `${masturbatedPct}%` }}
                  ></div>
                  <div
                    className="yearly-progress-bar natural-progress"
                    style={{ width: `${nightfallPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {totalYears > 0 && (
          <div className="yearly-averages">
            <h4 className="yearly-averages-title">Yearly Averages</h4>
            <div className="yearly-averages-grid">
              <div className="yearly-average-item">
                <span className="yearly-average-label">Average Total per Year</span>
                <span className="yearly-average-value">{Math.round(avgPerYear)}</span>
              </div>
              <div className="yearly-average-item">
                <span className="yearly-average-label">Avg Masturbated per Year</span>
                <span className="yearly-average-value" style={{ color: "#10b981" }}>
                  {Math.round(avgMasturbated)}
                </span>
              </div>
              <div className="yearly-average-item">
                <span className="yearly-average-label">Avg Nightfall per Year</span>
                <span className="yearly-average-value" style={{ color: "#ef4444" }}>
                  {Math.round(avgNightfall)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stunning Year Display Component
const YearDisplay = ({ year, months, yearCounts, monthCounts, onDelete }) => {
  const { yearXCount, yearOneCount } = yearCounts;
  const total = yearXCount + yearOneCount;
  const [isExpanded, setIsExpanded] = useState(false);

  const monthOrder = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const sortedMonths = Object.entries(months).sort(
    ([monthA], [monthB]) =>
      monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
  );

  return (
    <div className="year-section">
      <div
        className="year-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="year-title-wrapper">
          <h2 className="year-title">{year}</h2>
          <div className="year-summary">
            <span className="summary-item self">
              <span className="summary-icon">✓</span>
              {yearOneCount}
            </span>
            <span className="summary-item natural">
              <span className="summary-icon">✗</span>
              {yearXCount}
            </span>
            <span className="summary-item total">
              <span className="summary-icon">●</span>
              {total}
            </span>
          </div>
        </div>
        <div className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="year-content">
          <div className="months-grid">
            {sortedMonths.map(([month, dates]) => (
              <MonthDisplay
                key={month}
                year={year}
                month={month}
                dates={dates}
                monthCounts={monthCounts}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Beautiful Add Record Form
const AddRecordForm = ({ onAdd }) => {
  // Get current date values
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
  const currentDay = currentDate.getDate().toString();

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [date, setDate] = useState(currentDay);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const moodOptions = [
    { value: "", label: "No mood" },
    { value: "Good", label: "😊 Good" },
    { value: "Okay", label: "😐 Okay" },
    { value: "Bad", label: "😔 Bad" },
    { value: "Anxious", label: "😟 Anxious" },
    { value: "Calm", label: "😌 Calm" },
    { value: "Stressed", label: "😤 Stressed" },
  ];

  const years = Array.from({ length: 31 }, (_, index) => 2020 + index);
  
  const months = [
    { value: "Jan", label: "Jan", icon: "❄️" },
    { value: "Feb", label: "Feb", icon: "💝" },
    { value: "Mar", label: "Mar", icon: "🌸" },
    { value: "Apr", label: "Apr", icon: "🌷" },
    { value: "May", label: "May", icon: "🌻" },
    { value: "Jun", label: "Jun", icon: "☀️" },
    { value: "Jul", label: "Jul", icon: "🔥" },
    { value: "Aug", label: "Aug", icon: "🌞" },
    { value: "Sep", label: "Sep", icon: "🍂" },
    { value: "Oct", label: "Oct", icon: "🎃" },
    { value: "Nov", label: "Nov", icon: "🍁" },
    { value: "Dec", label: "Dec", icon: "🎄" },
  ];
  
  // Get days in selected month and year
  const getDaysInMonth = (monthValue, yearValue) => {
    if (!monthValue || !yearValue) return Array.from({ length: 31 }, (_, i) => i + 1);
    const monthIndex = months.findIndex(m => m.value === monthValue);
    if (monthIndex === -1) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(yearValue, monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Update dates when month or year changes
  const dates = getDaysInMonth(month, year);
  
  // Reset date if it's invalid for the new month/year
  useEffect(() => {
    if (date && month && year) {
      const maxDate = getDaysInMonth(month, year).length;
      if (parseInt(date) > maxDate) {
        setDate("");
      }
    }
  }, [month, year]);
  
  const values = [
    { value: "1", label: "Masturbated", icon: "✓", color: "#10b981" },
    { value: "x", label: "Nightfall", icon: "✗", color: "#ef4444" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!year || !month || !date || !value) {
      alert("Please fill out all fields!");
      return;
    }
    onAdd(year, month, date, value, note.trim() || undefined, mood || undefined);
    const newDate = new Date();
    const newYear = newDate.getFullYear().toString();
    const newMonth = newDate.toLocaleString('default', { month: 'short' });
    const newDay = newDate.getDate().toString();
    setYear(newYear);
    setMonth(newMonth);
    setDate(newDay);
    setValue("");
    setNote("");
    setMood("");
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-add-btn"
        title="Add New Record"
      >
        <span className="add-icon">+</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Record</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-form">
              <div className="date-selection-group">
                <div className="form-group date-field">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value);
                      setDate(""); // Reset date when month changes
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map((monthOption) => (
                      <option key={monthOption.value} value={monthOption.value}>
                        {monthOption.icon} {monthOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group date-field">
                  <label className="form-label">
                    <span className="label-icon">📆</span>
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setDate(""); // Reset date when year changes
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((yearOption) => (
                      <option key={yearOption} value={yearOption}>
                        {yearOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group date-field">
                  <label className="form-label">
                    <span className="label-icon">🗓️</span>
                    Date
                  </label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-select"
                    required
                    disabled={!month || !year}
                  >
                    <option value="">
                      {month && year ? "Select Date" : "Select Month & Year first"}
                    </option>
                    {dates.map((dateOption) => (
                      <option key={dateOption} value={dateOption}>
                        {dateOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="type-buttons">
                  {values.map((valueOption) => (
                    <button
                      key={valueOption.value}
                      type="button"
                      onClick={() => setValue(valueOption.value)}
                      className={`type-button ${value === valueOption.value ? "active" : ""}`}
                      style={{
                        borderColor: value === valueOption.value ? valueOption.color : "transparent",
                        background: value === valueOption.value ? `${valueOption.color}15` : "transparent",
                      }}
                    >
                      <span style={{ color: valueOption.color }}>{valueOption.icon}</span>
                      {valueOption.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" value={value} required />
              </div>

              <div className="form-group">
                <label className="form-label">Mood (optional)</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="form-select"
                >
                  {moodOptions.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="form-input"
                  placeholder="Short note..."
                  maxLength={200}
                />
              </div>

              <button type="submit" className="submit-btn">
                Add Record
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xCount, setXCount] = useState(0);
  const [oneCount, setOneCount] = useState(0);
  const [yearCounts, setYearCounts] = useState({});
  const [monthCounts, setMonthCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, longestStreakRange: null, isStreakAtRisk: false });
  const [insights, setInsights] = useState([]);
  const [theme, setTheme] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem(THEME_STORAGE_KEY) : null) || "dark");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const updateCounts = (dataToCount) => {
    const { xCount, oneCount, yearCounts, monthCounts } =
      countOccurrences(dataToCount);
    setXCount(xCount);
    setOneCount(oneCount);
    setYearCounts(yearCounts);
    setMonthCounts(monthCounts);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const response = await readData();
          setData(response);
          updateCounts(response);
          const streakData = calculateStreaks(response);
          setStreaks(streakData);
        } catch (err) {
          setError("Error fetching data");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  // Update insights when counts change
  useEffect(() => {
    if (data && yearCounts && monthCounts) {
      const newInsights = getInsights(data, yearCounts, monthCounts);
      setInsights(newInsights);
    }
  }, [data, yearCounts, monthCounts]);

  const addRecord = async (year, month, date, value, note, mood) => {
    const recordPayload = note || mood ? { value, ...(note && { note }), ...(mood && { mood }) } : value;
    const newData = { [date]: recordPayload };
    const yearData = data[year] || {};
    let monthData = yearData[month] || {};
    let _data = { ...data };

    try {
      monthData = {
        ...monthData,
        ...newData,
      };
      _data[year] = {
        ...yearData,
        [month]: monthData,
      };

      await writeData(_data);
      const updatedData = await readData();
      setData(updatedData);
      updateCounts(updatedData);
      const streakData = calculateStreaks(updatedData);
      setStreaks(streakData);
    } catch (error) {
      console.error("Error adding record:", error);
      alert("Error adding record. Please try again.");
    }
  };

  const deleteRecord = async (year, month, date) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const updatedData = { ...data };
      delete updatedData[year][month][date];

      if (Object.keys(updatedData[year][month]).length === 0) {
        delete updatedData[year][month];
      }

      if (Object.keys(updatedData[year]).length === 0) {
        delete updatedData[year];
      }

      await writeData(updatedData);
      const refreshedData = await readData();
      setData(refreshedData);
      updateCounts(refreshedData);
      const streakData = calculateStreaks(refreshedData);
      setStreaks(streakData);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="particles"></div>
        <PasswordLogin onPasswordCorrect={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  if (loading)
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="particles"></div>
        <div className="loading-screen">
          <div className="loader"></div>
          <p className="loading-text">Loading your records...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="particles"></div>
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );

  const total = xCount + oneCount;
  const selfPercentage = total > 0 ? Math.round((oneCount / total) * 100) : 0;
  const naturalPercentage = total > 0 ? Math.round((xCount / total) * 100) : 0;

  return (
    <div className={`app-container theme-${theme}`}>
      <div className="background-gradient"></div>
      <div className="particles"></div>

      <header className="app-header">
        <div className="header-content">
          <div className="header-top">
            <h1 className="app-title">
              Private Tracker
            </h1>
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="theme-toggle"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="settings-btn"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
          <p className="app-subtitle">
            Log daily records, track streaks, and see trends over time — all private and in one place.
          </p>
        </div>
      </header>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onPasswordChanged={() => setSettingsOpen(false)}
        />
      )}

      <main className="app-main">
        {/* Search and Filter */}
        {data && (
          <SearchFilter
            onSearch={setSearchTerm}
            onFilterChange={(filters) => {
              if (filters.year !== undefined) setFilterYear(filters.year);
              if (filters.month !== undefined) setFilterMonth(filters.month);
            }}
            filterYear={filterYear}
            filterMonth={filterMonth}
            years={Object.keys(yearCounts).sort((a, b) => parseInt(b) - parseInt(a))}
            months={[
              { value: "Jan", label: "Jan" },
              { value: "Feb", label: "Feb" },
              { value: "Mar", label: "Mar" },
              { value: "Apr", label: "Apr" },
              { value: "May", label: "May" },
              { value: "Jun", label: "Jun" },
              { value: "Jul", label: "Jul" },
              { value: "Aug", label: "Aug" },
              { value: "Sep", label: "Sep" },
              { value: "Oct", label: "Oct" },
              { value: "Nov", label: "Nov" },
              { value: "Dec", label: "Dec" },
            ]}
          />
        )}

        {/* Export Section */}
        {data && (
          <ExportSection onExport={(format) => exportData(data, format)} />
        )}

        {/* Streaks Display */}
        {streaks.currentStreak > 0 || streaks.longestStreak > 0 || streaks.isStreakAtRisk ? (
          <StreaksDisplay
            currentStreak={streaks.currentStreak}
            longestStreak={streaks.longestStreak}
            longestStreakRange={streaks.longestStreakRange}
            isStreakAtRisk={streaks.isStreakAtRisk}
          />
        ) : null}

        {/* This Month Summary */}
        {data && (
          <ThisMonthSummary
            data={data}
            monthCounts={monthCounts}
            currentStreak={streaks.currentStreak}
          />
        )}

        {/* Insights Section */}
        {insights.length > 0 && <InsightsSection insights={insights} />}

        <div className="stats-section">
          <StatCard
            label="Total Masturbated"
            value={oneCount}
            color="#10b981"
            icon="✓"
            delay={100}
          />
          <StatCard
            label="Total Nightfall"
            value={xCount}
            color="#ef4444"
            icon="✗"
            delay={200}
          />
          <StatCard
            label="Overall Total"
            value={total}
            color="#3b82f6"
            icon="●"
            delay={300}
          />
        </div>

        <div className="overview-section">
          <div className="overview-card">
            <h3 className="overview-title">Overview</h3>
            <div className="overview-stats">
              <div className="overview-item">
                <div className="overview-label">Masturbated</div>
                <div className="overview-value" style={{ color: "#10b981" }}>
                  {selfPercentage}%
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-label">Nightfall</div>
                <div className="overview-value" style={{ color: "#ef4444" }}>
                  {naturalPercentage}%
                </div>
              </div>
            </div>
            <div className="overview-progress">
              <div
                className="progress-fill self-progress"
                style={{ width: `${selfPercentage}%` }}
              ></div>
              <div
                className="progress-fill natural-progress"
                style={{ width: `${naturalPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {data && (() => {
          // Filter data based on search and filters
          let filteredData = { ...data };
          
          if (filterYear) {
            filteredData = { [filterYear]: filteredData[filterYear] || {} };
          }
          
          if (filterMonth && Object.keys(filteredData).length > 0) {
            Object.keys(filteredData).forEach(year => {
              if (filteredData[year][filterMonth]) {
                filteredData[year] = { [filterMonth]: filteredData[year][filterMonth] };
              } else {
                delete filteredData[year];
              }
            });
          }
          
          // Apply search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            Object.keys(filteredData).forEach(year => {
              Object.keys(filteredData[year]).forEach(month => {
                Object.keys(filteredData[year][month]).forEach(day => {
                  const value = getRecordValue(filteredData[year][month][day]);
                  const type = value === "1" ? "masturbated" : "nightfall";
                  const dateStr = `${day} ${month} ${year}`.toLowerCase();
                  
                  if (!type.includes(searchLower) && !dateStr.includes(searchLower)) {
                    delete filteredData[year][month][day];
                  }
                });
                if (Object.keys(filteredData[year][month]).length === 0) {
                  delete filteredData[year][month];
                }
              });
              if (Object.keys(filteredData[year]).length === 0) {
                delete filteredData[year];
              }
            });
          }
          
          return (
            <>
              <YearlyOverview yearCounts={yearCounts} data={data} />
              
              <div className="years-section">
                {Object.entries(filteredData)
                  .reverse()
                  .filter(([year]) => !filterYear || year === filterYear)
                  .map(([year, months]) => (
                    <YearDisplay
                      key={year}
                      year={year}
                      months={months}
                      yearCounts={
                        yearCounts[year] || { yearXCount: 0, yearOneCount: 0 }
                      }
                      monthCounts={monthCounts}
                      onDelete={deleteRecord}
                    />
                  ))}
              </div>
            </>
          );
        })()}

        <AddRecordForm onAdd={addRecord} />
      </main>
    </div>
  );
}

export default App;
