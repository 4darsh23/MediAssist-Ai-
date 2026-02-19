"use client";

import { useState } from "react";
import { Heart, Droplets, Thermometer, Wind, Weight, Moon, Pill, Plus, X, TrendingUp, TrendingDown, Minus } from "lucide-react";

const vitalTypes = [
  {
    id: "heart-rate",
    name: "Heart Rate",
    icon: Heart,
    unit: "bpm",
    color: "text-red-500",
    bg: "bg-red-500/10",
    min: 60,
    max: 100,
  },
  {
    id: "blood-pressure",
    name: "Blood Pressure",
    icon: Droplets,
    unit: "mmHg",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    min: 90,
    max: 120,
    hasSecondary: true,
    secondaryMin: 60,
    secondaryMax: 80,
  },
  {
    id: "blood-sugar",
    name: "Blood Sugar",
    icon: Droplets,
    unit: "mg/dL",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    min: 70,
    max: 140,
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: Thermometer,
    unit: "°F",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    min: 97,
    max: 99,
  },
  {
    id: "oxygen",
    name: "Oxygen Level",
    icon: Wind,
    unit: "%",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    min: 95,
    max: 100,
  },
  {
    id: "weight",
    name: "Weight",
    icon: Weight,
    unit: "kg",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    min: 0,
    max: 999,
  },
  {
    id: "sleep",
    name: "Sleep",
    icon: Moon,
    unit: "hrs",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    min: 7,
    max: 9,
  },
  {
    id: "medication",
    name: "Medication",
    icon: Pill,
    unit: "",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    isText: true,
  },
];

// Demo data
const initialEntries = [
  {
    id: 1,
    type: "heart-rate",
    value: 72,
    date: "2025-05-15",
    time: "08:30",
    notes: "Morning resting",
  },
  {
    id: 2,
    type: "blood-pressure",
    value: 120,
    secondary: 80,
    date: "2025-05-15",
    time: "08:35",
    notes: "After waking up",
  },
  {
    id: 3,
    type: "blood-sugar",
    value: 95,
    date: "2025-05-15",
    time: "07:00",
    notes: "Fasting",
  },
  {
    id: 4,
    type: "temperature",
    value: 98.4,
    date: "2025-05-15",
    time: "09:00",
    notes: "",
  },
  {
    id: 5,
    type: "oxygen",
    value: 98,
    date: "2025-05-15",
    time: "08:30",
    notes: "",
  },
  {
    id: 6,
    type: "heart-rate",
    value: 88,
    date: "2025-05-14",
    time: "18:00",
    notes: "After exercise",
  },
  {
    id: 7,
    type: "blood-pressure",
    value: 145,
    secondary: 92,
    date: "2025-05-14",
    time: "20:00",
    notes: "Evening reading",
  },
  {
    id: 8,
    type: "sleep",
    value: 7.5,
    date: "2025-05-14",
    time: "07:00",
    notes: "Slept well",
  },
];

function getStatus(type, value, secondary) {
  const vital = vitalTypes.find((v) => v.id === type);
  if (!vital || vital.isText) return { label: "Logged", color: "text-blue-500", bg: "bg-blue-50" };

  if (vital.hasSecondary) {
    if (value > 140 || secondary > 90) return { label: "High", color: "text-red-500", bg: "bg-red-50" };
    if (value < 90 || secondary < 60) return { label: "Low", color: "text-yellow-500", bg: "bg-yellow-50" };
    return { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-50" };
  }

  if (value > vital.max) return { label: "High", color: "text-red-500", bg: "bg-red-50" };
  if (value < vital.min) return { label: "Low", color: "text-yellow-500", bg: "bg-yellow-50" };
  return { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-50" };
}

function getTrend(type, entries) {
  const filtered = entries.filter((e) => e.type === type);
  if (filtered.length < 2) return "stable";
  const last = filtered[0].value;
  const prev = filtered[1].value;
  if (last > prev) return "up";
  if (last < prev) return "down";
  return "stable";
}

export default function VitalsPage() {
  const [entries, setEntries] = useState(initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    value: "",
    secondary: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: "",
    textValue: "",
  });

  const getLatestEntry = (typeId) => {
    return entries.find((e) => e.type === typeId);
  };

  const handleAddEntry = () => {
    if (!selectedType) return;

    const vital = vitalTypes.find((v) => v.id === selectedType);
    const newEntry = {
      id: Date.now(),
      type: selectedType,
      value: vital.isText ? 0 : parseFloat(formData.value),
      secondary: formData.secondary ? parseFloat(formData.secondary) : undefined,
      date: formData.date,
      time: formData.time,
      notes: vital.isText ? formData.textValue : formData.notes,
    };

    setEntries([newEntry, ...entries]);
    setShowModal(false);
    setSelectedType(null);
    setFormData({
      value: "",
      secondary: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
      textValue: "",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vitals</h1>
          <p className="text-gray-500 mt-1">Track and monitor your health metrics</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Reading
        </button>
      </div>

      {/* Vital Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {vitalTypes.map((vital) => {
          const latest = getLatestEntry(vital.id);
          const status = latest ? getStatus(vital.id, latest.value, latest.secondary) : null;
          const trend = getTrend(vital.id, entries);

          return (
            <div
              key={vital.id}
              className="p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${vital.bg} flex items-center justify-center`}>
                  <vital.icon className={`w-5 h-5 ${vital.color}`} />
                </div>
                {trend === "up" && <TrendingUp className="w-4 h-4 text-red-400" />}
                {trend === "down" && <TrendingDown className="w-4 h-4 text-blue-400" />}
                {trend === "stable" && <Minus className="w-4 h-4 text-gray-300" />}
              </div>

              <p className="text-sm text-gray-500 mb-1">{vital.name}</p>

              {latest ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {vital.hasSecondary ? `${latest.value}/${latest.secondary}` : latest.value}
                    <span className="text-sm font-normal text-gray-400 ml-1">{vital.unit}</span>
                  </p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${status.bg} ${status.color}`}>{status.label}</span>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-2">No readings yet</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Entries</h2>

        <div className="space-y-3">
          {entries.map((entry) => {
            const vital = vitalTypes.find((v) => v.id === entry.type);
            const status = getStatus(entry.type, entry.value, entry.secondary);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${vital.bg} flex items-center justify-center`}>
                    <vital.icon className={`w-5 h-5 ${vital.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vital.name}</p>
                    <p className="text-xs text-gray-500">
                      {entry.date} at {entry.time}
                      {entry.notes ? ` • ${entry.notes}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {vital.hasSecondary ? `${entry.value}/${entry.secondary}` : entry.value} {vital.unit}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Vital Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{selectedType ? "Add Reading" : "Select Vital Type"}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedType(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Step 1: Select Type */}
            {!selectedType && (
              <div className="grid grid-cols-2 gap-3">
                {vitalTypes.map((vital) => (
                  <button
                    key={vital.id}
                    onClick={() => setSelectedType(vital.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg ${vital.bg} flex items-center justify-center`}>
                      <vital.icon className={`w-4 h-4 ${vital.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{vital.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Enter Value */}
            {selectedType && (
              <div className="space-y-4">
                {(() => {
                  const vital = vitalTypes.find((v) => v.id === selectedType);
                  return (
                    <>
                      {/* Back button */}
                      <button
                        onClick={() => setSelectedType(null)}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        ← Change type
                      </button>

                      {/* Selected type badge */}
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg ${vital.bg} flex items-center justify-center`}>
                          <vital.icon className={`w-4 h-4 ${vital.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{vital.name}</span>
                      </div>

                      {/* Value Input */}
                      {vital.isText ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                          <textarea
                            value={formData.textValue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                textValue: e.target.value,
                              })
                            }
                            placeholder="Enter medication or details..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                          />
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{vital.hasSecondary ? "Systolic (top)" : "Value"}</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={formData.value}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    value: e.target.value,
                                  })
                                }
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{vital.unit}</span>
                            </div>
                          </div>

                          {vital.hasSecondary && (
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic (bottom)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={formData.secondary}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      secondary: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{vital.unit}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date & Time */}
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                date: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                time: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      {!vital.isText && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                          <input
                            type="text"
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notes: e.target.value,
                              })
                            }
                            placeholder="e.g. After morning walk"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setSelectedType(null);
                          }}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddEntry}
                          className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium"
                        >
                          Save Entry
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
