"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Upload, FileImage, Activity, Calendar, AlertCircle, Download, Share2, Clock, TrendingUp, Heart } from "lucide-react";

export default function PatientPage() {
  const { user, isLoaded } = useUser();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanType, setScanType] = useState("chest-xray");
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    lastDiagnosis: null,
    healthScore: 0,
    nextCheckup: null,
  });

  // Fetch patient data on load
  useEffect(() => {
    if (isLoaded && user) {
      fetchDiagnosisHistory();
      fetchPatientStats();
    }
  }, [isLoaded, user]);

  // Fetch diagnosis history
  const fetchDiagnosisHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setDiagnosisHistory(data.predictions || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Fetch patient stats
  const fetchPatientStats = async () => {
    try {
      const response = await fetch("/api/stats/patient");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/dicom"].includes(file.type)) {
        alert("Only JPEG, PNG, and DICOM files are allowed");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit image for analysis
  const handleSubmitAnalysis = async () => {
    if (!selectedImage) {
      alert("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("scanType", scanType);
      formData.append("symptoms", symptoms);

      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setDiagnosisResult(result.prediction);
        fetchDiagnosisHistory();
        fetchPatientStats();
      } else {
        alert("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDiagnosisResult(null);
  };

  // Download report as PDF
  const handleDownloadReport = async (predictionId) => {
    try {
      const response = await fetch(`/api/reports/${predictionId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnosis-report-${predictionId}.pdf`;
      a.click();
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  // Get severity color
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

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Section 1: Patient Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            <img
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{user?.fullName || "Patient"}</h1>
              <p className="text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>Patient ID: {user?.id?.slice(0, 8)}</span>
                <span>Member since: {new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Edit Profile</button>
          </div>
        </div>

        {/* Section 2: Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileImage className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Scans</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalScans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Diagnosis</p>
                <p className="text-lg font-bold text-gray-800">{stats.lastDiagnosis || "No scans yet"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Health Score</p>
                <p className="text-2xl font-bold text-gray-800">{stats.healthScore}/100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Checkup</p>
                <p className="text-lg font-bold text-gray-800">{stats.nextCheckup || "Not scheduled"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Upload New Scan */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upload New Scan</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("imageInput").click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your medical image here</p>
                  <p className="text-sm text-gray-400">or click to browse (JPEG, PNG, DICOM - Max 10MB)</p>
                </>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/jpeg,image/png,image/dicom"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Scan Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scan Type</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="chest-xray">Chest X-Ray</option>
                  <option value="skin-lesion">Skin Lesion</option>
                  <option value="retinal-scan">Retinal Scan</option>
                  <option value="blood-smear">Blood Smear</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe any symptoms you are experiencing..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <button
                onClick={handleSubmitAnalysis}
                disabled={!selectedImage || isAnalyzing}
                className={`w-full py-3 rounded-lg text-white font-semibold transition ${!selectedImage || isAnalyzing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </span>
                ) : (
                  "Submit for Analysis"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Latest Diagnosis Result */}
        {diagnosisResult && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Diagnosis Result</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image */}
              <div>
                <img
                  src={imagePreview}
                  alt="Analyzed"
                  className="w-full rounded-lg"
                />
              </div>

              {/* Result Details */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Detected Disease</p>
                  <p className="text-2xl font-bold text-gray-800">{diagnosisResult.disease}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Confidence Score</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${getConfidenceColor(diagnosisResult.confidence)}`}
                        style={{ width: `${diagnosisResult.confidence}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-800">{diagnosisResult.confidence}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Severity Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(diagnosisResult.severity)}`}>{diagnosisResult.severity}</span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{diagnosisResult.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Recommended Actions</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {diagnosisResult.recommendations?.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleDownloadReport(diagnosisResult.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    <Share2 className="w-4 h-4" />
                    Share with Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Diagnosis History Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Diagnosis History</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option value="chest-xray">Chest X-Ray</option>
                <option value="skin-lesion">Skin Lesion</option>
                <option value="retinal-scan">Retinal Scan</option>
                <option value="blood-smear">Blood Smear</option>
              </select>
            </div>
          </div>

          {diagnosisHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Image</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Scan Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Disease</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Confidence</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Severity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosisHistory.map((record, index) => (
                    <tr
                      key={record.id || index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">{new Date(record.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <img
                          src={record.imageUrl}
                          alt="Scan"
                          className="w-12 h-12 rounded object-cover"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{record.scanType}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{record.disease}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{record.confidence}%</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(record.severity)}`}>{record.severity}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadReport(record.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No diagnosis history yet</p>
              <p className="text-sm text-gray-400">Upload your first scan to get started</p>
            </div>
          )}
        </div>

        {/* Section 6: Health Tips */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Health Tip of the Day</h3>
              <p className="text-white/90">Regular health checkups can help detect diseases early. Upload your medical scans regularly for AI-powered monitoring and stay ahead of potential health issues.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
