import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
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
const MonthDisplay = ({ year, month, dates, monthCounts, onDelete }) => {
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
        <span className="text-green-500">
          {" "}
          [Self F: {monthOneCount}]
        </span> |{" "}
        <span className="text-red-500">[Natural N: {monthXCount}]</span> |
        Total:{" "}
        <span className="font-bold text-blue-500">
          {monthXCount + monthOneCount}
        </span>
      </h3>
      <ul className="list-disc list-inside">
        {Object.entries(dates).map(([date, value]) => (
          <li key={date} className="flex items-center gap-4 p-2 border-b">
            <span>
              Date: {date} - {value == 1 ? "Self F" : "Natural N"}
            </span>
            <button
              onClick={() => onDelete(year, month, date)}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component to display the full data structure
const YearDisplay = ({ year, months, yearCounts, monthCounts, onDelete }) => {
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
        {year} <span className="text-green-500">[Self F: {yearOneCount}]</span>{" "}
        | <span className="text-red-500">[Natural N: {yearXCount}]</span> |
        Total:{" "}
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
        className="gap-4"
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
                onDelete={onDelete}
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

  const years = Array.from({ length: 31 }, (_, index) => 2020 + index);
  const months = [
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
  const dates = Array.from({ length: 31 }, (_, index) => index + 1);
  const values = [
    { value: "1", label: "Self F" },
    { value: "x", label: "Natural N" },
  ];

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
    <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Add New Record</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border p-2 rounded w-full"
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

        <div>
          <label className="block text-sm font-medium mb-1">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2 rounded w-full"
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

        <div>
          <label className="block text-sm font-medium mb-1">Date:</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded w-full"
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

        <div>
          <label className="block text-sm font-medium mb-1">Type:</label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Type</option>
            {values.map((valueOption) => (
              <option key={valueOption.value} value={valueOption.value}>
                {valueOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add Record
          </button>
        </div>
      </form>
    </div>
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

  // Helper function to update all counts
  const updateCounts = (dataToCount) => {
    const { xCount, oneCount, yearCounts, monthCounts } =
      countOccurrences(dataToCount);
    setXCount(xCount);
    setOneCount(oneCount);
    setYearCounts(yearCounts);
    setMonthCounts(monthCounts);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await readData(); // Assuming this returns your JSON object
        setData(response);
        updateCounts(response); // Update counts
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
      updateCounts(updatedData); // Update counts after adding

      alert("Record added successfully!");
    } catch (error) {
      console.error("Error adding record:", error);
      alert("Error adding record. Please try again.");
    }
  };

  const deleteRecord = async (year, month, date) => {
    try {
      const updatedData = { ...data };

      // Delete the specific date
      delete updatedData[year][month][date];

      // If month becomes empty, remove it
      if (Object.keys(updatedData[year][month]).length === 0) {
        delete updatedData[year][month];
      }

      // If year becomes empty, remove it
      if (Object.keys(updatedData[year]).length === 0) {
        delete updatedData[year];
      }

      // Save the updated data to the backend
      await writeData(updatedData);

      // Refresh the data from the backend to ensure consistency
      const refreshedData = await readData();
      setData(refreshedData);
      updateCounts(refreshedData); // Update counts after deletion

      alert("Record deleted successfully!");
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Data Tracker</h1>

      <AddRecordForm onAdd={addRecord} />

      {data && (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <div className="text-lg">
              <span className="text-green-600 font-semibold">
                Total Self F: {oneCount}
              </span>{" "}
              |{" "}
              <span className="text-red-600 font-semibold">
                Total Natural N: {xCount}
              </span>{" "}
              |{" "}
              <span className="text-blue-600 font-bold">
                Overall Total: {xCount + oneCount}
              </span>
            </div>
          </div>

          <Grid container spacing={2}>
            {/* Reversed data entries to show the last year first */}
            {Object.entries(data)
              .reverse()
              .map(([year, months]) => (
                <Grid item xs={12} key={year}>
                  <YearDisplay
                    year={year}
                    months={months}
                    yearCounts={
                      yearCounts[year] || { yearXCount: 0, yearOneCount: 0 }
                    }
                    monthCounts={monthCounts}
                    onDelete={deleteRecord}
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
