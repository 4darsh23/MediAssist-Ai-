import { Activity, Brain, Shield, Upload, ArrowRight, Heart, Eye, Scan } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">MedAssist AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            About
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Sign In</button>
          <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">🧠 Powered by AI & Deep Learning</span>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              AI-Powered <span className="text-blue-500">Medical Image</span> Analysis
            </h1>

            <p className="text-lg text-gray-500 max-w-xl">Detect diseases early with powerful CNN models. Upload medical images, track your vitals, and get instant AI-powered analysis to help doctors make better decisions.</p>

            <div className="flex items-center gap-4 pt-4">
              <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 font-medium">
                Start Free Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Learn More</button>
            </div>

            <div className="flex items-center gap-8 pt-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">10K+</p>
                <p className="text-sm text-gray-500">Scans Analyzed</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">95%</p>
                <p className="text-sm text-gray-500">Accuracy Rate</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-500">Doctors Trust Us</p>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex-1 relative">
            <div className="w-full max-w-md mx-auto aspect-square rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto animate-pulse">
                  <Brain className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">AI Disease Detection</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">Features</span>
          <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">From AI image scanning to manual vitals tracking — all in one platform.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Scan,
              title: "Skin Lesion Analysis",
              desc: "Detect melanoma, carcinoma and other skin conditions from dermoscopy images.",
              color: "text-pink-500",
              bg: "bg-pink-500/10",
            },
            {
              icon: Activity,
              title: "Chest X-Ray Analysis",
              desc: "Pneumonia detection from chest radiographs with high accuracy CNN models.",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Eye,
              title: "Eye Disease Detection",
              desc: "Screen for diabetic retinopathy, glaucoma and cataracts from fundus images.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              icon: Heart,
              title: "Vitals Tracking",
              desc: "Manually log blood pressure, heart rate, sugar levels and more. Track trends over time.",
              color: "text-red-500",
              bg: "bg-red-500/10",
            },
            {
              icon: Shield,
              title: "Doctor Dashboard",
              desc: "Doctors can manage patients, review AI results and add clinical notes.",
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              icon: Upload,
              title: "Instant Reports",
              desc: "Generate downloadable PDF reports with AI analysis and recommendations.",
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">How It Works</span>
          <h2 className="text-3xl font-bold text-gray-900">Three Simple Steps</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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
            <div
              key={i}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl font-bold mx-auto">{item.step}</div>
              <h3 className="font-semibold text-xl text-gray-900">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Detect Diseases Early?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join hundreds of doctors and patients using AI-powered analysis for better health outcomes.</p>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium inline-flex items-center gap-2">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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
            <p className="text-sm text-gray-500">© 2025 MedAssist AI. For educational purposes. Not a medical device.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
