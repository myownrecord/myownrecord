import React, { useEffect, useState } from "react";
import { colors, Grid } from "@mui/material";
import { readData, writeData } from "./apis/api"; // Assuming this fetches your data

// Function to count total occurrences of "x" and 1 for each year and month
const countOccurrences = (data) => {
  let xCount = 0;
  let oneCount = 0;
  const yearCounts = {};
  const monthCounts = {};

  // Iterate through the data
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
      // Store monthly counts
      monthCounts[`${year}-${month}`] = { monthXCount, monthOneCount };
    }
    yearCounts[year] = { yearXCount, yearOneCount }; // Store yearly counts
  }

  return { xCount, oneCount, yearCounts, monthCounts };
};

// Component to display individual months and their dates
const MonthDisplay = ({ year, month, dates, monthCounts }) => {
  const { monthXCount, monthOneCount } = monthCounts[`${year}-${month}`] || {
    monthXCount: 0,
    monthOneCount: 0,
  };

  return (
    <div
      className="ma-2 p-3 border rounded shadow"
      style={{ height: "320px", overflowY: "auto" }}
    >
      <h3 className="text-lg font-semibold capitalize">
        {month}
        <span className="text-green-500"> [S : {monthXCount}]</span>|{" "}
        <span className="text-red-500">[N : {monthOneCount}]</span>| Total:{" "}
        <span className="font-bold text-blue-500">
          {monthXCount + monthOneCount}
        </span>
      </h3>
      <ul className="list-disc list-inside">
        {Object.entries(dates).map(([date, value]) => (
          <li key={date}>
            Date: {date} - {value == 1 ? "Self" : "Natural"}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component to display the full data structure
const YearDisplay = ({ year, months, yearCounts, monthCounts }) => {
  const { yearXCount, yearOneCount } = yearCounts;

  // Define the order of months
  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="p-6 border rounded shadow gap-4">
      <h2 className="text-xl font-bold mb-4">
        {year} <span className="text-green-500">[S : {yearXCount}]</span> |{" "}
        <span className="text-red-500">[N : {yearOneCount}]</span> | Total:{" "}
        <span className="font-bold text-blue-500">
          {yearXCount + yearOneCount}
        </span>
      </h2>
      <Grid
        container
        spacing={1}
        wrap="wrap"
        alignItems="center"
        justifyContent="center"
        className="gap-4 "
      >
        {Object.entries(months)
          // Sort months based on predefined order
          .sort(
            ([monthA], [monthB]) =>
              monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
          )
          .map(([month, dates]) => (
            <Grid item sm={2} key={month}>
              <MonthDisplay
                year={year}
                month={month}
                dates={dates}
                monthCounts={monthCounts}
              />
            </Grid>
          ))}
      </Grid>
    </div>
  );
};

const AddRecordForm = ({ onAdd }) => {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");

  const years = Array.from({ length: 7 }, (_, index) => 2024 + index);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const dates = Array.from({ length: 31 }, (_, index) => index + 1);
  const values = ["1", "x"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!year || !month || !date || !value) {
      alert("Please fill out all fields!");
      return;
    }
    onAdd(year, month, date, value); // Call the add function
    setYear("");
    setMonth("");
    setDate("");
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mt-2">
        <label>Year:</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-1 ml-4"
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
      <div className="mt-2">
        <label>Month:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-1 ml-4"
          required
        >
          <option value="">Select Month</option>
          {months.map((monthOption, index) => (
            <option key={index} value={monthOption}>
              {monthOption}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2">
        <label>Date:</label>
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-1 ml-4"
          required
        >
          <option value="">Select Date</option>
          {dates.map((dateOption) => (
            <option key={dateOption} value={dateOption}>
              {dateOption}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2">
        <label>Value:</label>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border p-1 ml-4"
          required
        >
          <option value="">Select Value</option>
          {values.map((valueOption) => (
            <option key={valueOption} value={valueOption}>
              {valueOption}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-blue-500 text-white p-2 mt-2">
        Add Record
      </button>
    </form>
  );
};



function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xCount, setXCount] = useState(0);
  const [oneCount, setOneCount] = useState(0);
  const [yearCounts, setYearCounts] = useState({});
  const [monthCounts, setMonthCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await readData(); // Assuming this returns your JSON object
        setData(response);

        // Count occurrences of "x" and "1"
        const { xCount, oneCount, yearCounts, monthCounts } =
          countOccurrences(response);
        setXCount(xCount);
        setOneCount(oneCount);
        setYearCounts(yearCounts);
        setMonthCounts(monthCounts);
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      const updatedData = await readData(); // Refresh data
      setData(updatedData);
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Data Viewer</h1>
      <AddRecordForm onAdd={addRecord} />
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {data && (
        <>
          <div className="mb-4 text-lg font-bold">
            <span className="text-green-500">Total Self: {xCount}</span> |{" "}
            <span className="text-red-500">Total Natural {oneCount}</span>|
            Overall Total:{" "}
            <span className="font-bold text-blue-500">{xCount + oneCount}</span>
          </div>
          <Grid container spacing={1}>
            {/* Reversed data entries to show the last year first */}
            {Object.entries(data)
              .reverse()
              .map(([year, months]) => (
                <Grid item sm={12} key={year}>
                  <YearDisplay
                    year={year}
                    months={months}
                    yearCounts={yearCounts[year]}
                    monthCounts={monthCounts}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </div>
  );
}

export default App;
