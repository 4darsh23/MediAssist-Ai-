"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Activity, TrendingUp, TrendingDown, Users, FileImage, AlertTriangle, Download, RefreshCw, Filter, Calendar, MapPin, Clock, Heart, Thermometer, Eye, Droplet, ChevronDown, Bell, Share2 } from "lucide-react";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Color palette for charts
  const COLORS = {
    primary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    purple: "#8B5CF6",
    pink: "#EC4899",
    cyan: "#06B6D4",
    orange: "#F97316",
  };

  const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

  // Sample data - Replace with actual API calls
  const overviewStats = {
    totalToday: 156,
    todayChange: 12.5,
    totalWeek: 1248,
    weekChange: 8.3,
    totalMonth: 5420,
    monthChange: -2.1,
    activeDiseases: 12,
    avgConfidence: 94.2,
    criticalCases: 23,
  };

  const diseaseDistribution = [
    { name: "Pneumonia", value: 324, color: "#3B82F6" },
    { name: "Tuberculosis", value: 256, color: "#10B981" },
    { name: "Malaria", value: 198, color: "#F59E0B" },
    { name: "Dengue", value: 167, color: "#EF4444" },
    { name: "Diabetic Retinopathy", value: 145, color: "#8B5CF6" },
    { name: "Skin Cancer", value: 112, color: "#EC4899" },
    { name: "COVID-19", value: 89, color: "#06B6D4" },
    { name: "Others", value: 67, color: "#F97316" },
  ];

  const dailyTrends = [
    { date: "Mon", pneumonia: 45, tuberculosis: 32, malaria: 28, dengue: 22 },
    { date: "Tue", pneumonia: 52, tuberculosis: 38, malaria: 31, dengue: 25 },
    { date: "Wed", pneumonia: 48, tuberculosis: 35, malaria: 29, dengue: 28 },
    { date: "Thu", pneumonia: 61, tuberculosis: 42, malaria: 35, dengue: 31 },
    { date: "Fri", pneumonia: 55, tuberculosis: 39, malaria: 33, dengue: 27 },
    { date: "Sat", pneumonia: 67, tuberculosis: 45, malaria: 38, dengue: 35 },
    { date: "Sun", pneumonia: 58, tuberculosis: 41, malaria: 34, dengue: 29 },
  ];

  const weeklyComparison = [
    { day: "Mon", thisWeek: 127, lastWeek: 112 },
    { day: "Tue", thisWeek: 146, lastWeek: 128 },
    { day: "Wed", thisWeek: 140, lastWeek: 135 },
    { day: "Thu", thisWeek: 169, lastWeek: 142 },
    { day: "Fri", thisWeek: 154, lastWeek: 148 },
    { day: "Sat", thisWeek: 185, lastWeek: 156 },
    { day: "Sun", thisWeek: 162, lastWeek: 145 },
  ];

  const severityDistribution = [
    { name: "Low", value: 542, color: "#10B981" },
    { name: "Moderate", value: 389, color: "#F59E0B" },
    { name: "High", value: 234, color: "#F97316" },
    { name: "Critical", value: 83, color: "#EF4444" },
  ];

  const ageGroupData = [
    { ageGroup: "0-10", cases: 89 },
    { ageGroup: "11-20", cases: 156 },
    { ageGroup: "21-30", cases: 287 },
    { ageGroup: "31-40", cases: 342 },
    { ageGroup: "41-50", cases: 298 },
    { ageGroup: "51-60", cases: 245 },
    { ageGroup: "60+", cases: 198 },
  ];

  const genderDistribution = [
    { name: "Male", value: 680, color: "#3B82F6" },
    { name: "Female", value: 548, color: "#EC4899" },
    { name: "Other", value: 20, color: "#8B5CF6" },
  ];

  const scanTypeData = [
    { type: "Chest X-Ray", count: 456 },
    { type: "Skin Lesion", count: 312 },
    { type: "Retinal Scan", count: 234 },
    { type: "Blood Smear", count: 189 },
    { type: "Other", count: 57 },
  ];

  const confidenceDistribution = [
    { range: "0-50%", count: 12 },
    { range: "51-60%", count: 28 },
    { range: "61-70%", count: 67 },
    { range: "71-80%", count: 145 },
    { range: "81-90%", count: 389 },
    { range: "91-100%", count: 607 },
  ];

  const hourlyActivity = [
    { hour: "12 AM", count: 12 },
    { hour: "3 AM", count: 8 },
    { hour: "6 AM", count: 34 },
    { hour: "9 AM", count: 156 },
    { hour: "12 PM", count: 189 },
    { hour: "3 PM", count: 167 },
    { hour: "6 PM", count: 145 },
    { hour: "9 PM", count: 87 },
  ];

  const topDiseases = [
    { rank: 1, disease: "Pneumonia", cases: 324, percentage: 25.9, trend: "up", severity: "High" },
    { rank: 2, disease: "Tuberculosis", cases: 256, percentage: 20.5, trend: "up", severity: "High" },
    { rank: 3, disease: "Malaria", cases: 198, percentage: 15.9, trend: "down", severity: "Moderate" },
    { rank: 4, disease: "Dengue", cases: 167, percentage: 13.4, trend: "up", severity: "Moderate" },
    { rank: 5, disease: "Diabetic Retinopathy", cases: 145, percentage: 11.6, trend: "stable", severity: "Low" },
  ];

  const regionalData = [
    { region: "Maharashtra", cases: 345, percentage: 27.6 },
    { region: "Delhi", cases: 234, percentage: 18.7 },
    { region: "Karnataka", cases: 189, percentage: 15.1 },
    { region: "Tamil Nadu", cases: 167, percentage: 13.4 },
    { region: "Gujarat", cases: 145, percentage: 11.6 },
    { region: "Others", cases: 168, percentage: 13.6 },
  ];

  const liveFeed = [
    { id: 1, time: "2 mins ago", disease: "Pneumonia", severity: "High", location: "Mumbai", confidence: 94 },
    { id: 2, time: "5 mins ago", disease: "Malaria", severity: "Moderate", location: "Delhi", confidence: 89 },
    { id: 3, time: "8 mins ago", disease: "Tuberculosis", severity: "High", location: "Chennai", confidence: 92 },
    { id: 4, time: "12 mins ago", disease: "Dengue", severity: "Low", location: "Bangalore", confidence: 87 },
    { id: 5, time: "15 mins ago", disease: "Skin Cancer", severity: "Critical", location: "Pune", confidence: 96 },
  ];

  const outbreakAlerts = [
    { id: 1, disease: "Dengue", region: "Maharashtra", cases: 45, threshold: 30, level: "Warning" },
    { id: 2, disease: "Malaria", region: "Gujarat", cases: 62, threshold: 40, level: "Critical" },
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call
        // const response = await fetch(`/api/analytics?range=${selectedTimeRange}&disease=${selectedDisease}&region=${selectedRegion}`);
        // const data = await response.json();
        // setAnalyticsData(data);

        // Simulating API delay
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedTimeRange, selectedDisease, selectedRegion, selectedSeverity]);

  // Live feed auto-refresh
  useEffect(() => {
    if (liveUpdates) {
      const interval = setInterval(() => {
        // Fetch latest predictions
        // fetchLatestPredictions();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [liveUpdates]);

  // Get severity badge color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Export data as CSV
  const handleExportCSV = () => {
    // Implementation for CSV export
    alert("Exporting data as CSV...");
  };

  // Export data as PDF
  const handleExportPDF = () => {
    // Implementation for PDF export
    alert("Generating PDF report...");
  };

  // Share dashboard
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Dashboard link copied to clipboard!");
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Epidemiological Analytics</h1>
            <p className="text-gray-500 mt-1">Real-time disease surveillance and outbreak monitoring</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Disease</label>
                <select
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Diseases</option>
                  <option value="pneumonia">Pneumonia</option>
                  <option value="tuberculosis">Tuberculosis</option>
                  <option value="malaria">Malaria</option>
                  <option value="dengue">Dengue</option>
                  <option value="covid19">COVID-19</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Regions</option>
                  <option value="maharashtra">Maharashtra</option>
                  <option value="delhi">Delhi</option>
                  <option value="karnataka">Karnataka</option>
                  <option value="tamilnadu">Tamil Nadu</option>
                  <option value="gujarat">Gujarat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setSelectedTimeRange("7days");
                  setSelectedDisease("all");
                  setSelectedRegion("all");
                  setSelectedSeverity("all");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Reset Filters
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Apply Filters</button>
            </div>
          </div>
        )}

        {/* Section 1: Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-800">{overviewStats.totalToday}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${overviewStats.todayChange >= 0 ? "text-red-500" : "text-green-500"}`}>
                {overviewStats.todayChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overviewStats.todayChange)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-gray-800">{overviewStats.totalWeek}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${overviewStats.weekChange >= 0 ? "text-red-500" : "text-green-500"}`}>
                {overviewStats.weekChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overviewStats.weekChange)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-800">{overviewStats.totalMonth}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${overviewStats.monthChange >= 0 ? "text-red-500" : "text-green-500"}`}>
                {overviewStats.monthChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overviewStats.monthChange)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Diseases</p>
                <p className="text-2xl font-bold text-gray-800">{overviewStats.activeDiseases}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-800">{overviewStats.avgConfidence}%</p>
              </div>
              <Heart className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Cases</p>
                <p className="text-2xl font-bold text-red-600">{overviewStats.criticalCases}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Section 2: Outbreak Alerts */}
        {outbreakAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-800">Outbreak Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outbreakAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg p-4 border border-red-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{alert.disease}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.level === "Critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{alert.level}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {alert.region}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.cases} cases detected (Threshold: {alert.threshold})
                  </p>
                  <button className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">Send Alert to Health Authorities</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Disease Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Disease Distribution</h3>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Trends Line Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Disease Trends</h3>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pneumonia"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="tuberculosis"
                  stroke="#10B981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="malaria"
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="dengue"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4: Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Comparison Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Comparison</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <BarChart data={weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="thisWeek"
                  fill="#3B82F6"
                  name="This Week"
                />
                <Bar
                  dataKey="lastWeek"
                  fill="#D1D5DB"
                  name="Last Week"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Distribution Donut Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Severity Distribution</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age Group Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Age Group Distribution</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <BarChart
                data={ageGroupData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="ageGroup"
                  type="category"
                />
                <Tooltip />
                <Bar
                  dataKey="cases"
                  fill="#8B5CF6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 5: Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gender Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Gender Distribution</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Scan Type Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Scan Type Analysis</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <BarChart data={scanTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#06B6D4"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">AI Confidence Distribution</h3>
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <AreaChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  fill="#10B98133"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 6: Hourly Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hourly Activity Pattern</h3>
          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <AreaChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8B5CF6"
                fill="#8B5CF633"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Section 7: Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 5 Diseases Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Detected Diseases</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Rank</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Disease</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Cases</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">%</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Trend</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {topDiseases.map((item) => (
                    <tr
                      key={item.rank}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 text-sm font-bold text-gray-800">#{item.rank}</td>
                      <td className="py-3 px-2 text-sm text-gray-800">{item.disease}</td>
                      <td className="py-3 px-2 text-sm text-gray-800">{item.cases}</td>
                      <td className="py-3 px-2 text-sm text-gray-800">{item.percentage}%</td>
                      <td className="py-3 px-2">{getTrendIcon(item.trend)}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>{item.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Distribution Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Regional Distribution</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Region</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Cases</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Percentage</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 text-sm text-gray-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {item.region}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-800">{item.cases}</td>
                      <td className="py-3 px-2 text-sm text-gray-800">{item.percentage}%</td>
                      <td className="py-3 px-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 8: Live Feed */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-800">Live Diagnosis Feed</h3>
              <span className="flex items-center gap-1 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Auto-refresh</label>
              <button
                onClick={() => setLiveUpdates(!liveUpdates)}
                className={`w-12 h-6 rounded-full transition ${liveUpdates ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${liveUpdates ? "translate-x-6" : "translate-x-0.5"}`}></div>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liveFeed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 w-20">{item.time}</span>
                  <span className="font-medium text-gray-800">{item.disease}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>{item.severity}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {item.location}
                  </span>
                  <span className="text-sm font-medium text-green-600">{item.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9: Quick Actions Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-xl">AI-Powered Epidemiological Surveillance</h3>
              <p className="text-white/80 mt-1">Real-time monitoring of disease patterns across India</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition">
                <Bell className="w-4 h-4" />
                Set Up Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
