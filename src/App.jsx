import React, { useEffect, useState } from "react";
import { readData, writeData } from "./apis/api";

// Password Login Component
const PasswordLogin = ({ onPasswordCorrect }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const correctPassword = "asyncHide098";

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
          <h1 className="password-title">Insight Tracker</h1>
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

// Function to count total occurrences of "x" and 1 for each year and month
const countOccurrences = (data) => {
  let xCount = 0;
  let oneCount = 0;
  const yearCounts = {};
  const monthCounts = {};

  for (let year in data) {
    let yearXCount = 0;
    let yearOneCount = 0;
    for (let month in data[year]) {
      let monthXCount = 0;
      let monthOneCount = 0;
      for (let day in data[year][month]) {
        const value = data[year][month][day];
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
        {Object.entries(dates).map(([date, value]) => (
          <div key={date} className="date-item">
            <span className="date-number">{date}</span>
            <span className={`date-type ${value == 1 ? "type-self" : "type-natural"}`}>
              {value == 1 ? "Masturbated" : "Nightfall"}
            </span>
            <button
              onClick={() => onDelete(year, month, date)}
              className="delete-btn"
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
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
  const [isOpen, setIsOpen] = useState(false);

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
    onAdd(year, month, date, value);
    // Reset to current date after submission
    const newDate = new Date();
    const newYear = newDate.getFullYear().toString();
    const newMonth = newDate.toLocaleString('default', { month: 'short' });
    const newDay = newDate.getDate().toString();
    setYear(newYear);
    setMonth(newMonth);
    setDate(newDay);
    setValue("");
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
        } catch (err) {
          setError("Error fetching data");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  const addRecord = async (year, month, date, value) => {
    const newData = { [date]: value };
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
    <div className="app-container">
      <div className="background-gradient"></div>
      <div className="particles"></div>

      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📊</span>
            Insight Tracker
          </h1>
          <p className="app-subtitle">Your personal insights, beautifully organized</p>
        </div>
      </header>

      <main className="app-main">
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

        {data && (
          <>
            <YearlyOverview yearCounts={yearCounts} data={data} />
            
            <div className="years-section">
            {Object.entries(data)
              .reverse()
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
        )}

        <AddRecordForm onAdd={addRecord} />
      </main>
    </div>
  );
}

export default App;
