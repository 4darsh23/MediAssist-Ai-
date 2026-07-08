"use client";

import { Activity, Brain, Shield, Upload, ArrowRight, Heart, Eye, Scan } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { InfiniteGridBackground } from "@/components/ui/the-infinite-grid";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedCounter({ value, suffix = "" }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      <InfiniteGridBackground>
        {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">MedAssist AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition">Features</a>
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition">How It Works</a>
          <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition">About</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Sign In</Link>
          <Link href="/sign-up" className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">Get Started</Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            className="flex-1 space-y-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900"
            >
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Medical Image</span> Analysis
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-gray-500 max-w-xl"
            >
              Detect diseases early with powerful CNN models. Upload medical images, track your vitals, and get instant AI-powered analysis to help doctors make better decisions.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex items-center gap-4 pt-4"
            >
              <Link href="/scan" className="group px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                Start Free Analysis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium hover:-translate-y-0.5">Learn More</a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex items-center gap-8 pt-6"
            >
              <div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter value="10K+" /></p>
                <p className="text-sm text-gray-500">Scans Analyzed</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter value="95" suffix="%" /></p>
                <p className="text-sm text-gray-500">Accuracy Rate</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter value="500+" /></p>
                <p className="text-sm text-gray-500">Doctors Trust Us</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/10 rounded-3xl blur-3xl scale-110 animate-pulse" style={{ animationDuration: '4s' }} />

            {/* Main hero image */}
            <div className="relative w-full max-w-lg mx-auto">
              <img
                src="/images/hero-medical-ai.png"
                alt="AI-powered medical image analysis dashboard showing disease detection"
                className="w-full rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/20"
              />

              {/* Floating accent card - top right */}
              <motion.div
                className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-gray-100"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">95% Accuracy</p>
                    <p className="text-[10px] text-gray-400">CNN Model</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating accent card - bottom left */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-gray-100"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">EfficientNet-B0</p>
                    <p className="text-[10px] text-gray-400">Deep Learning</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.span variants={fadeUp} custom={0} className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">Features</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-gray-900">Everything You Need</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-500 mt-2 max-w-xl mx-auto">From AI image scanning to manual vitals tracking — all in one platform.</motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          {[
            {
              icon: Scan,
              title: "Skin Lesion Analysis",
              desc: "Detect melanoma, carcinoma and other skin conditions from dermoscopy images.",
              color: "text-pink-500",
              bg: "bg-pink-500/10",
              href: "/scan?type=skin-lesion",
            },
            {
              icon: Activity,
              title: "Chest X-Ray Analysis",
              desc: "Pneumonia detection from chest radiographs with high accuracy CNN models.",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              href: "/scan?type=chest-xray",
            },
            {
              icon: Eye,
              title: "Eye Disease Detection",
              desc: "Screen for diabetic retinopathy, glaucoma and cataracts from fundus images.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              href: "/scan?type=eye-disease",
            },
            {
              icon: Heart,
              title: "Vitals Tracking",
              desc: "Manually log blood pressure, heart rate, sugar levels and more. Track trends over time.",
              color: "text-red-500",
              bg: "bg-red-500/10",
              href: "/vitals",
            },
            {
              icon: Shield,
              title: "Doctor Dashboard",
              desc: "Doctors can manage patients, review AI results and add clinical notes.",
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              href: "/patients",
            },
            {
              icon: Upload,
              title: "Instant Reports",
              desc: "Generate downloadable PDF reports with AI analysis and recommendations.",
              color: "text-orange-500",
              bg: "bg-orange-500/10",
              href: "/reports",
            },
          ].map((feature, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}>
              <Link
                href={feature.href}
                className="group block p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.span variants={fadeUp} custom={0} className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">How It Works</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-gray-900">Three Simple Steps</motion.h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          {[
            {
              step: "01",
              title: "Upload Image",
              desc: "Drag and drop your medical image — X-ray, skin photo, or eye scan.",
            },
            {
              step: "02",
              title: "AI Analyzes",
              desc: "Our CNN model processes the image and classifies potential conditions.",
            },
            {
              step: "03",
              title: "Get Results",
              desc: "View predictions with confidence scores, heatmaps, and recommendations.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="text-center space-y-4 group"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {item.step}
              </motion.div>
              <h3 className="font-semibold text-xl text-gray-900">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center text-white relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

          <h2 className="text-3xl font-bold mb-4 relative z-10">Ready to Detect Diseases Early?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10">Join hundreds of doctors and patients using AI-powered analysis for better health outcomes.</p>
          <Link href="/sign-up" className="relative z-10 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium inline-flex items-center gap-2 shadow-lg hover:-translate-y-0.5">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">MedAssist AI</span>
            </div>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} MedAssist AI. For educational purposes. Not a medical device.</p>
          </div>
        </div>
      </footer>
      </InfiniteGridBackground>
    </div>
  );
}
