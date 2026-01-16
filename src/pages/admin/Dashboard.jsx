"use client"

import { useState, useEffect } from "react"
import { BarChart3, CheckCircle2, Clock, ListTodo, Users, AlertTriangle, Filter } from 'lucide-react'
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

export default function AdminDashboard() {
  const [dashboardType, setDashboardType] = useState("checklist")
  const [taskView, setTaskView] = useState("recent")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStaff, setFilterStaff] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // State for department data
  const [departmentData, setDepartmentData] = useState({
    allTasks: [],
    staffMembers: [],
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    barChartData: [],
    pieChartData: [],
    // Add new counters for delegation mode
    completedRatingOne: 0,
    completedRatingTwo: 0,
    completedRatingThreePlus: 0
  })

  // Store the current date for overdue calculation
  const [currentDate, setCurrentDate] = useState(new Date())

  // New state for date range filtering
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
    filtered: false
  });

  // State to store filtered statistics
  const [filteredDateStats, setFilteredDateStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  });

  // Helper function to format date from ISO format to DD/MM/YYYY
  const formatLocalDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return formatDateToDDMMYYYY(date);
  };

  // Function to filter tasks by date range
  const filterTasksByDateRange = () => {
    // Validate dates
    if (!dateRange.startDate || !dateRange.endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      alert("Start date must be before end date");
      return;
    }

    // Filter tasks within the date range
    const filteredTasks = departmentData.allTasks.filter(task => {
      const taskStartDate = parseDateFromDDMMYYYY(task.taskStartDate);
      if (!taskStartDate) return false;

      return taskStartDate >= startDate && taskStartDate <= endDate;
    });

    // Count statistics
    let totalTasks = filteredTasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredTasks.forEach(task => {
      if (task.status === 'completed') {
        completedTasks++;
      } else {
        // Task is not completed
        pendingTasks++; // All incomplete tasks count as pending

        if (task.status === 'overdue') {
          overdueTasks++; // Only past dates (excluding today) count as overdue
        }
      }
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    // Update filtered stats
    setFilteredDateStats({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate
    });

    // Set filtered flag to true
    setDateRange(prev => ({ ...prev, filtered: true }));
  };

  // Format date as DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Parse DD/MM/YYYY to Date object
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  // Function to check if a date is in the past
  const isDateInPast = (dateStr) => {
    const date = parseDateFromDDMMYYYY(dateStr)
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Function to check if a date is today
  const isDateToday = (dateStr) => {
    const date = parseDateFromDDMMYYYY(dateStr)
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date.getTime() === today.getTime()
  }

  // Function to check if a date is tomorrow
  const isDateTomorrow = (dateStr) => {
    const date = parseDateFromDDMMYYYY(dateStr)
    if (!date) return false
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return date.getTime() === tomorrow.getTime()
  }

  // Function to check if a date is in the future (from tomorrow onwards)
  const isDateFuture = (dateStr) => {
    const date = parseDateFromDDMMYYYY(dateStr)
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }

  // Safe access to cell value
  const getCellValue = (row, index) => {
    if (!row || !row.c || index >= row.c.length) return null
    const cell = row.c[index]
    return cell && 'v' in cell ? cell.v : null
  }

  // Parse Google Sheets Date format into a proper date string
  const parseGoogleSheetsDate = (dateStr) => {
    if (!dateStr) return ''

    // Debug log for date parsing
    console.log(`Parsing date: "${dateStr}" (type: ${typeof dateStr})`);

    if (typeof dateStr === 'string' && dateStr.startsWith('Date(')) {
      // Handle Google Sheets Date(year,month,day) format
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateStr)
      if (match) {
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) // 0-indexed in Google's format
        const day = parseInt(match[3], 10)

        // Format as DD/MM/YYYY
        const formatted = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        console.log(`Converted Google Sheets date to: ${formatted}`);
        return formatted;
      }
    }

    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // Normalize to DD/MM/YYYY format
      const parts = dateStr.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const normalized = `${day}/${month}/${year}`;
      console.log(`Normalized date to: ${normalized}`);
      return normalized;
    }

    // Handle Date objects
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
      const formatted = formatDateToDDMMYYYY(dateStr);
      console.log(`Converted Date object to: ${formatted}`);
      return formatted;
    }

    // If we get here, try to parse as a date and format
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        const formatted = formatDateToDDMMYYYY(date);
        console.log(`Parsed generic date to: ${formatted}`);
        return formatted;
      }
    } catch (e) {
      console.error("Error parsing date:", e)
    }

    // Return original if parsing fails
    console.log(`Failed to parse date, returning original: ${dateStr}`);
    return dateStr
  }

  // Modified fetch function to support both checklist and delegation
  const fetchDepartmentData = async () => {
    // For delegation mode, always use "DELEGATION" sheet
    // For checklist mode, use "Checklist" as default sheet
    const sheetName = dashboardType === "delegation" ? "DELEGATION" : "Checklist";

    try {
      // Debug: Log which sheet we're fetching
      console.log(`Fetching data for dashboard type: ${dashboardType}, sheet: ${sheetName}`);

      const response = await fetch(`https://docs.google.com/spreadsheets/d/1kj73QqY84zEONVqjOJCcewO1YHEHQKZFgWRo4J9tPeQ/gviz/tq?tqx=out:json&sheet=${sheetName}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${sheetName} sheet data: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);

      // Debug: Log the fetched data structure
      console.log(`Fetched data from ${sheetName}:`, {
        totalRows: data.table.rows.length,
        firstFewRows: data.table.rows.slice(0, 3).map((row, idx) => ({
          rowIndex: idx,
          rowData: row.c ? row.c.map(cell => cell?.v) : row
        }))
      });

      // Get current user details
      const username = sessionStorage.getItem('username');
      const userRole = sessionStorage.getItem('role');

      // Initialize counters
      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;
      let overdueTasks = 0;

      // Add new counters for delegation mode
      let completedRatingOne = 0;
      let completedRatingTwo = 0;
      let completedRatingThreePlus = 0;

      // Monthly data for bar chart
      const monthlyData = {
        Jan: { completed: 0, pending: 0 },
        Feb: { completed: 0, pending: 0 },
        Mar: { completed: 0, pending: 0 },
        Apr: { completed: 0, pending: 0 },
        May: { completed: 0, pending: 0 },
        Jun: { completed: 0, pending: 0 },
        Jul: { completed: 0, pending: 0 },
        Aug: { completed: 0, pending: 0 },
        Sep: { completed: 0, pending: 0 },
        Oct: { completed: 0, pending: 0 },
        Nov: { completed: 0, pending: 0 },
        Dec: { completed: 0, pending: 0 }
      };

      // Status data for pie chart
      const statusData = {
        Completed: 0,
        Pending: 0,
        Overdue: 0
      };

      // Staff tracking map
      const staffTrackingMap = new Map();

      // Get today's date for comparison (only used for checklist mode)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get tomorrow's date for comparison (only used for checklist mode)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Process row data
      const processedRows = data.table.rows.map((row, rowIndex) => {
        // Skip header row
        if (rowIndex === 0) return null;

        // Debug: Log row processing for first few rows
        if (rowIndex <= 5) {
          console.log(`Processing row ${rowIndex + 1} (sheet row ${rowIndex + 1}):`, row);
        }

        // For non-admin users, filter by username in Column E (index 4) - "Name"
        const assignedTo = getCellValue(row, 4) || 'Unassigned';
        const isUserMatch = userRole === 'admin' ||
          assignedTo.toLowerCase() === username.toLowerCase();

        // Debug: Log user matching for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: assignedTo="${assignedTo}", username="${username}", userRole="${userRole}", isMatch=${isUserMatch}`);
        }

        // If not a match and not admin, skip this row
        if (!isUserMatch) {
          if (rowIndex <= 5) console.log(`Row ${rowIndex + 1}: Skipped due to user mismatch`);
          return null;
        }

        // Check column B for valid task row - "Task ID"
        const taskId = getCellValue(row, 1); // Column B (index 1)

        // Debug: Log task ID for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: taskId="${taskId}" (type: ${typeof taskId})`);
        }

        // More lenient validation - allow any non-empty value as task ID
        if (taskId === null || taskId === undefined || taskId === '' ||
          (typeof taskId === 'string' && taskId.trim() === '')) {
          if (rowIndex <= 5) console.log(`Row ${rowIndex + 1}: Skipped due to empty/null task ID`);
          return null;
        }

        // Convert task ID to string for consistency
        const taskIdStr = String(taskId).trim();

        // Get task start date from Column G (index 6) - "Task Start Date"
        let taskStartDateValue = getCellValue(row, 6);
        const taskStartDate = taskStartDateValue ? parseGoogleSheetsDate(String(taskStartDateValue)) : '';

        // Debug: Log task start date for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: taskStartDateValue="${taskStartDateValue}", parsed="${taskStartDate}"`);
        }

        // UPDATED: Different date filtering logic for delegation vs checklist
        if (dashboardType === "delegation") {
          // For DELEGATION mode: Process ALL tasks with valid task IDs, no date filtering
          if (!taskId || taskId === null || taskId === undefined || taskId === '' ||
            (typeof taskId === 'string' && taskId.trim() === '')) {
            if (rowIndex <= 5) console.log(`Row ${rowIndex + 1}: Skipped due to invalid task ID in delegation mode`);
            return null;
          }
        } else {
          // For CHECKLIST mode: Keep existing date filtering logic
          const taskStartDateObj = parseDateFromDDMMYYYY(taskStartDate);

          if (rowIndex <= 5) {
            console.log(`Row ${rowIndex + 1}: taskStartDateObj=${taskStartDateObj}, today=${today}, tomorrow=${tomorrow}, isValid=${!!taskStartDateObj}`);
          }

          // Process tasks that have a valid start date and are due up to tomorrow (include tomorrow's tasks)
          if (!taskStartDateObj || taskStartDateObj > tomorrow) {
            if (rowIndex <= 5) console.log(`Row ${rowIndex + 1}: Skipped due to invalid/far future date (beyond tomorrow)`);
            return null; // Skip tasks beyond tomorrow
          }
        }

        // Get completion data based on dashboard type
        let completionDateValue, completionDate;
        if (dashboardType === "delegation") {
          // For delegation: Column L (index 11) - "Actual"
          completionDateValue = getCellValue(row, 11);
        } else {
          // For checklist: Column K (index 10) - "Actual"
          completionDateValue = getCellValue(row, 10);
        }

        completionDate = completionDateValue ? parseGoogleSheetsDate(String(completionDateValue)) : '';

        // Debug: Log completion date for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: completionDateValue="${completionDateValue}", parsed="${completionDate}"`);
        }

        // Track staff details
        if (!staffTrackingMap.has(assignedTo)) {
          staffTrackingMap.set(assignedTo, {
            name: assignedTo,
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            progress: 0
          });
        }

        // Get additional task details
        const taskDescription = getCellValue(row, 5) || 'Untitled Task'; // Column F - "Task Description"
        const frequency = getCellValue(row, 7) || 'one-time'; // Column H - "Freq"

        // UPDATED: Determine task status for display purposes - restored overdue logic for delegation
        let status = 'pending';

        if (completionDate && completionDate !== '') {
          status = 'completed';
        } else if (isDateInPast(taskStartDate) && !isDateToday(taskStartDate)) {
          // For both modes: past dates (excluding today) = overdue
          status = 'overdue';
        } else {
          // For both modes: today or future dates = pending
          status = 'pending';
        }

        // Debug: Log status determination for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: status="${status}", completionDate="${completionDate}", dashboardType="${dashboardType}"`);
        }

        // Create the task object
        const taskObj = {
          id: taskIdStr,
          title: taskDescription,
          assignedTo,
          taskStartDate,
          dueDate: taskStartDate, // Keep for compatibility
          status,
          frequency
        };

        // Debug: Log task object for first few rows
        if (rowIndex <= 5) {
          console.log(`Row ${rowIndex + 1}: Created task object:`, taskObj);
        }

        // Update staff member totals
        const staffData = staffTrackingMap.get(assignedTo);
        staffData.totalTasks++;

        // UPDATED: Count for dashboard cards - different logic for delegation vs checklist
        if (dashboardType === "delegation") {
          // For DELEGATION mode: Count ALL valid tasks, no date restrictions
          totalTasks++;

          if (status === 'completed') {
            completedTasks++;
            staffData.completedTasks++;
            statusData.Completed++;

            // For delegation mode, count by rating
            const ratingValue = getCellValue(row, 17); // Column R - "Pending Color Code"
            if (ratingValue === 1) {
              completedRatingOne++;
            } else if (ratingValue === 2) {
              completedRatingTwo++;
            } else if (ratingValue > 2) {
              completedRatingThreePlus++;
            }

            // Update monthly data for completed tasks
            const completedMonth = parseDateFromDDMMYYYY(completionDate);
            if (completedMonth) {
              const monthName = completedMonth.toLocaleString('default', { month: 'short' });
              if (monthlyData[monthName]) {
                monthlyData[monthName].completed++;
              }
            }
          } else {
            // Task is not completed - apply counting logic for both modes
            staffData.pendingTasks++;

            if (isDateInPast(taskStartDate) && !isDateToday(taskStartDate)) {
              // Past dates (excluding today) = overdue
              overdueTasks++;
              statusData.Overdue++;
            }

            // All incomplete tasks (including overdue + today) = pending
            pendingTasks++;
            statusData.Pending++;

            // Update monthly data for pending tasks
            const monthName = (dashboardType === "delegation" ? new Date() : today).toLocaleString('default', { month: 'short' });
            if (monthlyData[monthName]) {
              monthlyData[monthName].pending++;
            }
          }
        } else {
          // For CHECKLIST mode: Keep existing logic with date restrictions
          const taskStartDateObj = parseDateFromDDMMYYYY(taskStartDate);
          const shouldCountInStats = taskStartDateObj <= today;

          if (shouldCountInStats) {
            totalTasks++;

            if (status === 'completed') {
              completedTasks++;
              staffData.completedTasks++;
              statusData.Completed++;

              // Update monthly data for completed tasks
              const completedMonth = parseDateFromDDMMYYYY(completionDate);
              if (completedMonth) {
                const monthName = completedMonth.toLocaleString('default', { month: 'short' });
                if (monthlyData[monthName]) {
                  monthlyData[monthName].completed++;
                }
              }
            } else {
              staffData.pendingTasks++;

              if (isDateInPast(taskStartDate) && !isDateToday(taskStartDate)) {
                // Past dates (excluding today) = overdue
                overdueTasks++;
                statusData.Overdue++;
              }

              // All incomplete tasks (including overdue + today) = pending
              pendingTasks++;
              statusData.Pending++;

              // Update monthly data for pending tasks
              const monthName = today.toLocaleString('default', { month: 'short' });
              if (monthlyData[monthName]) {
                monthlyData[monthName].pending++;
              }
            }
          }
        }

        return taskObj;
      }).filter(task => task !== null);

      // Debug: Log processing summary
      console.log(`Processing summary for ${sheetName}:`);
      console.log(`  Dashboard type: ${dashboardType}`);
      console.log(`  Total rows in sheet: ${data.table.rows.length}`);
      console.log(`  Rows after filtering: ${processedRows.length}`);
      console.log(`  Total tasks counted: ${totalTasks}`);
      console.log(`  Completed tasks: ${completedTasks}`);
      console.log(`  Pending tasks: ${pendingTasks}`);
      console.log(`  Overdue tasks: ${overdueTasks}`);
      console.log(`  Completed Rating 1: ${completedRatingOne}`);
      console.log(`  Completed Rating 2: ${completedRatingTwo}`);
      console.log(`  Completed Rating 3+: ${completedRatingThreePlus}`);

      // Calculate completion rate
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

      // Convert monthly data to chart format
      const barChartData = Object.entries(monthlyData).map(([name, data]) => ({
        name,
        completed: data.completed,
        pending: data.pending
      }));

      // Convert status data to pie chart format
      const pieChartData = [
        { name: "Completed", value: statusData.Completed, color: "#22c55e" },
        { name: "Pending", value: statusData.Pending, color: "#facc15" },
        { name: "Overdue", value: statusData.Overdue, color: "#ef4444" }
      ];

      // Process staff tracking map
      const staffMembers = Array.from(staffTrackingMap.values()).map(staff => {
        const progress = staff.totalTasks > 0
          ? Math.round((staff.completedTasks / staff.totalTasks) * 100)
          : 0;

        return {
          id: staff.name.replace(/\s+/g, '-').toLowerCase(),
          name: staff.name,
          email: `${staff.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          totalTasks: staff.totalTasks,
          completedTasks: staff.completedTasks,
          pendingTasks: staff.pendingTasks,
          progress
        };
      });

      // Update department data state
      setDepartmentData({
        allTasks: processedRows,
        staffMembers,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        barChartData,
        pieChartData,
        completedRatingOne,
        completedRatingTwo,
        completedRatingThreePlus
      });

    } catch (error) {
      console.error(`Error fetching ${sheetName} sheet data:`, error);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [dashboardType]);

  // When dashboard loads, set current date
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Filter tasks based on the filter criteria
  const filteredTasks = departmentData.allTasks.filter((task) => {
    // Filter by status
    if (filterStatus !== "all" && task.status !== filterStatus) return false;

    // Filter by staff
    if (filterStaff !== "all" && task.assignedTo !== filterStaff) return false;

    // Filter by search query
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();

      if (typeof task.title === 'string' && task.title.toLowerCase().includes(query)) {
        return true;
      }

      if ((typeof task.id === 'string' && task.id.toLowerCase().includes(query)) ||
        (typeof task.id === 'number' && task.id.toString().includes(query))) {
        return true;
      }

      if (typeof task.assignedTo === 'string' && task.assignedTo.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    }

    return true;
  });

  // UPDATED: Get tasks by view with updated delegation logic
  const getTasksByView = (view) => {
    const viewFilteredTasks = filteredTasks.filter((task) => {
      // Skip completed tasks in all views
      if (task.status === "completed") return false;

      // Apply date-based filtering
      const taskStartDate = parseDateFromDDMMYYYY(task.taskStartDate);
      if (!taskStartDate) return false;

      switch (view) {
        case "recent":
          if (dashboardType === "delegation") {
            // For DELEGATION: Show only today's tasks (pending only)
            return isDateToday(task.taskStartDate);
          } else {
            // For CHECKLIST: Show tasks due today (pending only)
            return isDateToday(task.taskStartDate);
          }
        case "upcoming":
          if (dashboardType === "delegation") {
            // For DELEGATION: Show all future tasks (from tomorrow onwards, excluding today)
            return isDateFuture(task.taskStartDate);
          } else {
            // For CHECKLIST: Show tasks due tomorrow only
            return isDateTomorrow(task.taskStartDate);
          }
        case "overdue":
          if (dashboardType === "delegation") {
            // For DELEGATION: Show all past date pending tasks (excluding today)
            return isDateInPast(task.taskStartDate) && !isDateToday(task.taskStartDate);
          } else {
            // For CHECKLIST: Show tasks with start dates in the past (excluding today)
            return isDateInPast(task.taskStartDate) && !isDateToday(task.taskStartDate);
          }
        default:
          return true;
      }
    });

    return viewFilteredTasks;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 hover:bg-green-600 text-white"
      case "pending":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "overdue":
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case "one-time":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "daily":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "weekly":
        return "bg-purple-500 hover:bg-purple-600 text-white"
      case "fortnightly":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      case "monthly":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "quarterly":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "yearly":
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  // Tasks Overview Chart Component
  const TasksOverviewChart = () => {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={departmentData.barChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" fontSize={12} stroke="#888888" tickLine={false} axisLine={false} />
          <YAxis fontSize={12} stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Tasks Completion Chart Component
  const TasksCompletionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={departmentData.pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
            {departmentData.pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // Staff Tasks Table Component
  const StaffTasksTable = () => {
    return (
      <div className="rounded-md border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Tasks
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departmentData.staffMembers.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-[100px] bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${staff.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{staff.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {staff.progress >= 80 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Excellent
                    </span>
                  ) : staff.progress >= 60 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Good
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Needs Improvement
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-500">Admin Dashboard</h1>
          {/* <div className="flex items-center gap-2">
            {/* Dashboard Type Selection 
            <select
              value={dashboardType}
              onChange={(e) => {
                setDashboardType(e.target.value);
              }}
              className="w-[140px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="checklist">Checklist</option>
              <option value="delegation">Delegation</option>
            </select>
          </div> */}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-700">{departmentData.totalTasks}</div>
              <p className="text-xs text-blue-600">
                {dashboardType === "delegation"
                  ? "All tasks in delegation sheet"
                  : "Total tasks in checklist (up to today)"
                }
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-green-700">
                {dashboardType === "delegation" ? "Completed Once" : "Completed Tasks"}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">
                {dashboardType === "delegation" ? departmentData.completedRatingOne : departmentData.completedTasks}
              </div>
              <p className="text-xs text-green-600">
                {dashboardType === "delegation" ? "Tasks completed once" : "Total completed till date"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-amber-700">
                {dashboardType === "delegation" ? "Completed Twice" : "Pending Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-amber-700">
                {dashboardType === "delegation" ? departmentData.completedRatingTwo : departmentData.pendingTasks}
              </div>
              <p className="text-xs text-amber-600">
                {dashboardType === "delegation" ? "Tasks completed twice" : "Including today + overdue"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-50 to-red-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-red-700">
                {dashboardType === "delegation" ? "Completed 3+ Times" : "Overdue Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-4 w-4 text-red-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-red-700">
                {dashboardType === "delegation" ? departmentData.completedRatingThreePlus : departmentData.overdueTasks}
              </div>
              <p className="text-xs text-red-600">
                {dashboardType === "delegation" ? "Tasks completed 3+ times" : "Past due (excluding today)"}
              </p>
            </div>
          </div>
        </div>

        {/* Task Navigation Tabs - Restored to 3 tabs for both modes */}
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-3">
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("recent")}
            >
              {dashboardType === "delegation" ? "Today Tasks" : "Recent Tasks"}
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("upcoming")}
            >
              {dashboardType === "delegation" ? "Future Tasks" : "Upcoming Tasks"}
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("overdue")}
            >
              Overdue Tasks
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-4 md:flex-row mb-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Search Tasks
                </label>
                <input
                  id="search"
                  placeholder="Search by task title or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2 md:w-[180px]">
                <label htmlFor="staff-filter" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Staff
                </label>
                <select
                  id="staff-filter"
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Staff</option>
                  {departmentData.staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {getTasksByView(taskView).length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <p>No tasks found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Start Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getTasksByView(taskView).map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.taskStartDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}
                          >
                            {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>



      </div>
    </AdminLayout>
  )
}