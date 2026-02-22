"use client";

import { useState } from "react";
import { FileText, Download, Share2, Eye, Plus, Search, ChevronDown, X, Calendar, User, Scan, Heart, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const demoReports = [
  {
    id: "RPT-2025-001",
    title: "Skin Lesion Analysis Report",
    type: "scan",
    patient: "John Doe",
    date: "2025-05-15",
    result: "Benign Keratosis",
    confidence: 92,
    severity: "low",
    status: "completed",
    vitals: {
      heartRate: { value: 72, unit: "bpm", status: "normal" },
      bloodPressure: { value: "120/80", unit: "mmHg", status: "normal" },
      bloodSugar: { value: 95, unit: "mg/dL", status: "normal" },
      oxygen: { value: 98, unit: "%", status: "normal" },
    },
    recommendations: ["No immediate concerns detected", "Continue regular skin checkups", "Monitor any changes in size or color", "Use sunscreen daily"],
  },
  {
    id: "RPT-2025-002",
    title: "Weekly Vitals Summary",
    type: "vitals",
    patient: "Self",
    date: "2025-05-14",
    result: "All Normal",
    severity: "normal",
    status: "completed",
    vitals: {
      heartRate: { value: 75, unit: "bpm", status: "normal" },
      bloodPressure: { value: "118/78", unit: "mmHg", status: "normal" },
      bloodSugar: { value: 110, unit: "mg/dL", status: "normal" },
      oxygen: { value: 97, unit: "%", status: "normal" },
    },
    recommendations: ["All vitals within normal range", "Keep maintaining healthy lifestyle", "Next checkup recommended in 1 week"],
  },
  {
    id: "RPT-2025-003",
    title: "Chest X-Ray Analysis Report",
    type: "scan",
    patient: "Jane Smith",
    date: "2025-05-13",
    result: "Pneumonia Detected",
    confidence: 87,
    severity: "high",
    status: "completed",
    vitals: {
      heartRate: { value: 95, unit: "bpm", status: "warning" },
      bloodPressure: { value: "135/88", unit: "mmHg", status: "warning" },
      bloodSugar: { value: 120, unit: "mg/dL", status: "normal" },
      oxygen: { value: 93, unit: "%", status: "warning" },
    },
    recommendations: ["Immediate consultation with pulmonologist recommended", "Start prescribed antibiotics", "Rest and hydration advised", "Follow-up X-ray in 2 weeks"],
  },
  {
    id: "RPT-2025-004",
    title: "Dengue Outbreak Alert Report",
    type: "outbreak",
    patient: "Region: Mumbai",
    date: "2025-05-12",
    result: "High Risk",
    severity: "high",
    status: "completed",
    vitals: null,
    recommendations: ["Cases predicted to increase by 20% next week", "Increase mosquito control measures", "Alert local health authorities", "Stock up on dengue testing kits"],
  },
  {
    id: "RPT-2025-005",
    title: "Eye Disease Screening Report",
    type: "scan",
    patient: "Mike Johnson",
    date: "2025-05-10",
    result: "Normal",
    confidence: 95,
    severity: "normal",
    status: "completed",
    vitals: {
      heartRate: { value: 68, unit: "bpm", status: "normal" },
      bloodPressure: { value: "115/75", unit: "mmHg", status: "normal" },
      bloodSugar: { value: 90, unit: "mg/dL", status: "normal" },
      oxygen: { value: 99, unit: "%", status: "normal" },
    },
    recommendations: ["No eye diseases detected", "Continue annual eye checkups", "Maintain healthy screen time habits"],
  },
];

function getTypeIcon(type) {
  switch (type) {
    case "scan":
      return Scan;
    case "vitals":
      return Heart;
    case "outbreak":
      return TrendingUp;
    default:
      return FileText;
  }
}

function getTypeColor(type) {
  switch (type) {
    case "scan":
      return { color: "text-blue-500", bg: "bg-blue-50" };
    case "vitals":
      return { color: "text-red-500", bg: "bg-red-50" };
    case "outbreak":
      return { color: "text-orange-500", bg: "bg-orange-50" };
    default:
      return { color: "text-gray-500", bg: "bg-gray-50" };
  }
}

function getSeverityBadge(severity) {
  switch (severity) {
    case "normal":
    case "low":
      return { label: severity === "normal" ? "Normal" : "Low Risk", color: "text-emerald-600", bg: "bg-emerald-50" };
    case "moderate":
      return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50" };
    case "high":
      return { label: "High Risk", color: "text-red-600", bg: "bg-red-50" };
    default:
      return { label: "Unknown", color: "text-gray-600", bg: "bg-gray-50" };
  }
}

function getVitalStatusColor(status) {
  switch (status) {
    case "normal":
      return "text-emerald-500";
    case "warning":
      return "text-yellow-500";
    case "danger":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

function getVitalStatusIcon(status) {
  switch (status) {
    case "normal":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "danger":
      return AlertTriangle;
    default:
      return CheckCircle;
  }
}

export default function ReportsPage() {
  const [reports] = useState(demoReports);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((report) => {
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) || report.patient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">View and download your medical reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium text-sm">
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "scan", "vitals", "outbreak"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterType === type ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          const TypeIcon = getTypeIcon(report.type);
          const typeColor = getTypeColor(report.type);
          const severity = getSeverityBadge(report.severity);

          return (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${typeColor.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${typeColor.color}`} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {report.patient}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {report.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-gray-700">{report.result}</span>
                      {report.confidence && <span className="text-xs text-gray-400">({report.confidence}% confidence)</span>}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severity.bg} ${severity.color}`}>{severity.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="View Report"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reports found</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedReport.id} • {selectedReport.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">{selectedReport.patient.charAt(0)}</div>
                <div>
                  <p className="font-medium text-gray-900">{selectedReport.patient}</p>
                  <p className="text-xs text-gray-500">Report generated on {selectedReport.date}</p>
                </div>
              </div>

              {/* Scan Results */}
              {selectedReport.type === "scan" && (
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">Scan Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Prediction</p>
                      <p className="font-medium text-gray-900">{selectedReport.result}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="font-medium text-gray-900">{selectedReport.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Severity</p>
                      <p className={`font-medium ${getSeverityBadge(selectedReport.severity).color}`}>{getSeverityBadge(selectedReport.severity).label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedReport.type}</p>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Confidence Level</span>
                      <span className="text-xs font-medium text-gray-700">{selectedReport.confidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${selectedReport.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vitals */}
              {selectedReport.vitals && (
                <div className="p-4 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">Vitals Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedReport.vitals).map(([key, vital]) => {
                      const StatusIcon = getVitalStatusIcon(vital.status);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                            <p className="font-medium text-gray-900">
                              {vital.value} {vital.unit}
                            </p>
                          </div>
                          <StatusIcon className={`w-4 h-4 ${getVitalStatusColor(vital.status)}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="p-4 border border-gray-200 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {selectedReport.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-yellow-50 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">This is an AI-generated report for educational purposes only. Always consult a qualified healthcare professional for medical advice and diagnosis.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
