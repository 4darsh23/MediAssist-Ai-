"use client";

import { useState, useEffect } from "react";
import { Clock, Scan, Heart, Search, ChevronDown, Calendar, Brain, Activity, Eye, Droplets, Filter } from "lucide-react";

const defaultHistory = [
  { id: 1, type: "scan", category: "Chest X-Ray", result: "Normal", confidence: 94, date: "2025-07-05", time: "14:30", severity: "normal" },
  { id: 2, type: "vital", category: "Heart Rate", value: "72 bpm", date: "2025-07-05", time: "08:30", status: "normal" },
  { id: 3, type: "scan", category: "Skin Lesion", result: "Benign Keratosis", confidence: 89, date: "2025-07-04", time: "11:00", severity: "low" },
  { id: 4, type: "vital", category: "Blood Pressure", value: "120/80 mmHg", date: "2025-07-04", time: "08:35", status: "normal" },
  { id: 5, type: "scan", category: "Eye Disease", result: "Normal", confidence: 96, date: "2025-07-03", time: "09:15", severity: "normal" },
  { id: 6, type: "vital", category: "Blood Sugar", value: "95 mg/dL", date: "2025-07-03", time: "07:00", status: "normal" },
  { id: 7, type: "vital", category: "Heart Rate", value: "88 bpm", date: "2025-07-02", time: "18:00", status: "warning" },
  { id: 8, type: "scan", category: "Chest X-Ray", result: "Pneumonia Detected", confidence: 87, date: "2025-07-01", time: "10:00", severity: "high" },
  { id: 9, type: "vital", category: "Oxygen Level", value: "98%", date: "2025-07-01", time: "08:30", status: "normal" },
  { id: 10, type: "vital", category: "Blood Pressure", value: "145/92 mmHg", date: "2025-06-30", time: "20:00", status: "warning" },
  { id: 11, type: "scan", category: "Skin Lesion", result: "Melanocytic Nevi", confidence: 91, date: "2025-06-28", time: "15:00", severity: "normal" },
  { id: 12, type: "vital", category: "Temperature", value: "98.4°F", date: "2025-06-28", time: "09:00", status: "normal" },
];

function getSeverityBadge(severity) {
  switch (severity) {
    case "normal": return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" };
    case "low": return { label: "Low Risk", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15" };
    case "moderate": return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/15" };
    case "high": return { label: "High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15" };
    default: return { label: "Unknown", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-500/15" };
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "normal": return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" };
    case "warning": return { label: "Warning", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/15" };
    case "danger": return { label: "Critical", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15" };
    default: return { label: "Logged", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15" };
  }
}

function getTypeIcon(type, category) {
  if (type === "scan") {
    if (category.includes("Skin")) return Scan;
    if (category.includes("Eye")) return Eye;
    return Brain;
  }
  if (category.includes("Heart")) return Heart;
  if (category.includes("Blood")) return Droplets;
  return Activity;
}

function groupByDate(items) {
  const groups = {};
  items.forEach((item) => {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  });
  return groups;
}

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyItems, setHistoryItems] = useState(defaultHistory);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      // 1. Fetch scans
      const scansRes = await fetch("/api/history");
      const scansData = await scansRes.json();
      const mappedScans = (scansData.predictions || []).map((scan) => ({
        id: `scan-${scan.id}`,
        type: "scan",
        category: scan.scanType,
        result: scan.disease,
        confidence: scan.confidence,
        date: new Date(scan.createdAt).toISOString().split("T")[0],
        time: new Date(scan.createdAt).toTimeString().slice(0, 5),
        severity: scan.severity,
      }));

      // 2. Fetch vitals
      const vitalsRes = await fetch("/api/vitals");
      const vitalsData = await vitalsRes.json();
      const mappedVitals = (vitalsData.vitals || []).map((vital) => ({
        id: `vital-${vital.id}`,
        type: "vital",
        category: vital.type.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        value: vital.secondary ? `${vital.value}/${vital.secondary} ${vital.unit}` : `${vital.value} ${vital.unit}`,
        date: new Date(vital.recordedAt).toISOString().split("T")[0],
        time: new Date(vital.recordedAt).toTimeString().slice(0, 5),
        status: vital.status,
      }));

      // Merge and sort by date desc, then time desc
      const merged = [...mappedScans, ...mappedVitals];
      if (merged.length > 0) {
        merged.sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeB - dateTimeA;
        });
        setHistoryItems(merged);
      }
    } catch (error) {
      console.error("Error loading history timeline:", error);
    }
  };

  const filtered = historyItems.filter((item) => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.result && item.result.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.value && item.value.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Timeline of all your scans and vitals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All" },
            { id: "scan", label: "Scans" },
            { id: "vital", label: "Vitals" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {formatDateLabel(date)}
              </h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="space-y-3 ml-2 border-l-2 border-gray-200 dark:border-gray-700 pl-6 relative">
              {items.map((item) => {
                const Icon = getTypeIcon(item.type, item.category);
                const badge = item.type === "scan"
                  ? getSeverityBadge(item.severity)
                  : getStatusBadge(item.status);

                return (
                  <div
                    key={item.id}
                    className="relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[33px] w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-400" />

                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === "scan" ? "bg-blue-500/10 dark:bg-blue-500/20" : "bg-red-500/10 dark:bg-red-500/20"}`}>
                        <Icon className={`w-5 h-5 ${item.type === "scan" ? "text-blue-500" : "text-red-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                          <span className="mx-1">•</span>
                          {item.type === "scan" ? "AI Scan" : "Manual Entry"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.type === "scan" ? item.result : item.value}
                      </span>
                      {item.type === "scan" && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">({item.confidence}%)</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No history found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
