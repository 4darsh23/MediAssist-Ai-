"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Scan, Heart, FileText, ArrowRight, TrendingUp, TrendingDown,
  Brain, Clock, CalendarDays, Zap, Plus, Eye, Shield
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// Default demo data used as a fallback if the DB is empty
const defaultRecentScans = [
  { id: 1, type: "Chest X-Ray", result: "Normal", confidence: 94, date: "Today, 2:30 PM", severity: "normal" },
  { id: 2, type: "Skin Lesion", result: "Benign Keratosis", confidence: 89, date: "Yesterday, 11:00 AM", severity: "low" },
  { id: 3, type: "Eye Disease", result: "Normal", confidence: 96, date: "Jul 3, 9:15 AM", severity: "normal" },
];

const defaultRecentVitals = [
  { type: "Heart Rate", value: "72", unit: "bpm", status: "normal", icon: Heart, color: "text-red-500", bg: "bg-red-500/10 dark:bg-red-500/20" },
  { type: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
  { type: "Oxygen", value: "98", unit: "%", status: "normal", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getSeverityBadge(severity) {
  switch (severity) {
    case "normal":
      return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" };
    case "low":
      return { label: "Low Risk", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15" };
    case "moderate":
      return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/15" };
    case "high":
      return { label: "High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15" };
    default:
      return { label: "Unknown", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-500/15" };
  }
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalScans: "24",
    healthScore: "92",
    reports: "12",
    nextCheckup: "Jul 15",
  });
  const [recentScans, setRecentScans] = useState(defaultRecentScans);
  const [recentVitals, setRecentVitals] = useState(defaultRecentVitals);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded && user) {
      fetchDashboardData();
    }
  }, [mounted, isLoaded, user]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch("/api/stats/patient");
      const statsData = await statsRes.json();
      if (statsData && statsData.totalScans !== undefined) {
        setStats({
          totalScans: statsData.totalScans.toString(),
          healthScore: statsData.healthScore.toString(),
          reports: statsData.totalScans.toString(), // Simplify reports count to equal total scans
          nextCheckup: statsData.nextCheckup,
        });
      }

      // 2. Fetch Recent Scans
      const scansRes = await fetch("/api/history");
      const scansData = await scansRes.json();
      if (scansData && scansData.predictions && scansData.predictions.length > 0) {
        const mappedScans = scansData.predictions.slice(0, 3).map((scan) => ({
          id: scan.id,
          type: scan.scanType,
          result: scan.disease,
          confidence: scan.confidence,
          date: new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          severity: scan.severity,
        }));
        setRecentScans(mappedScans);
      }

      // 3. Fetch Recent Vitals
      const vitalsRes = await fetch("/api/vitals");
      const vitalsData = await vitalsRes.json();
      if (vitalsData && vitalsData.vitals && vitalsData.vitals.length > 0) {
        const vitalConfig = {
          "heart-rate": { icon: Heart, color: "text-red-500", bg: "bg-red-500/10 dark:bg-red-500/20" },
          "blood-pressure": { icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
          "blood-sugar": { icon: Droplets, color: "text-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/20" },
          "oxygen": { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
        };

        const mappedVitals = vitalsData.vitals.slice(0, 3).map((v) => {
          const config = vitalConfig[v.type] || { icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" };
          return {
            type: v.type.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            value: v.secondary ? `${v.value}/${v.secondary}` : v.value.toString(),
            unit: v.unit,
            status: v.status,
            icon: config.icon,
            color: config.color,
            bg: config.bg,
          };
        });
        setRecentVitals(mappedVitals);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        className="mb-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.h1
          variants={fadeUp}
          custom={0}
          className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
        >
          {getGreeting()}, {user?.firstName || "there"} 👋
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={1}
          className="text-gray-500 dark:text-gray-400 mt-1"
        >
          Here&apos;s your health overview for today.
        </motion.p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {[
          { label: "Total Scans", value: stats.totalScans, change: "All recorded", trend: "up", icon: Scan, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
          { label: "Health Score", value: `${stats.healthScore}/100`, change: "Computed from scans", trend: "up", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
          { label: "Reports", value: stats.reports, change: "PDFs available", trend: "stable", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/20" },
          { label: "Next Checkup", value: stats.nextCheckup, change: "Recommended window", trend: "stable", icon: CalendarDays, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/20" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            custom={i}
            className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/30 transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
              {stat.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "New Scan", desc: "Upload a medical image for AI analysis", icon: Scan, href: "/scan", gradient: "from-blue-500 to-indigo-600" },
            { label: "Log Vitals", desc: "Record your health metrics", icon: Heart, href: "/vitals", gradient: "from-pink-500 to-rose-600" },
            { label: "View Reports", desc: "Download and share your reports", icon: FileText, href: "/reports", gradient: "from-purple-500 to-violet-600" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group relative p-5 rounded-2xl bg-gradient-to-br ${action.gradient} text-white overflow-hidden hover:-translate-y-0.5 transition-all hover:shadow-lg`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <action.icon className="w-8 h-8 mb-3 opacity-90" />
              <h3 className="font-semibold text-lg">{action.label}</h3>
              <p className="text-sm text-white/80 mt-1">{action.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Recent Scans
            </h2>
            <Link href="/history" className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentScans.map((scan) => {
              const badge = getSeverityBadge(scan.severity);
              return (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                      <Scan className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {scan.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{scan.result}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                      {scan.confidence}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Latest Vitals */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Latest Vitals
            </h2>
            <Link href="/vitals" className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
              Log New <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentVitals.map((vital) => (
              <div
                key={vital.type}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${vital.bg} flex items-center justify-center`}>
                    <vital.icon className={`w-5 h-5 ${vital.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{vital.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {vital.value} <span className="text-sm font-normal text-gray-400">{vital.unit}</span>
                  </p>
                  <span className="text-xs text-emerald-500 font-medium">Normal</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mini health tip */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Log your vitals regularly for better health trend analysis and early anomaly detection.
            </p>
          </div>
        </motion.div>
      </div>

      {/* AI Model Info Banner */}
      <motion.div
        className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI-Powered Medical Analysis
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Using EfficientNet-B0 CNN with 5.3M parameters • ONNX Runtime Web • Browser-based inference
            </p>
          </div>
          <Link
            href="/scan"
            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-sm inline-flex items-center gap-2 whitespace-nowrap"
          >
            Start Analysis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
