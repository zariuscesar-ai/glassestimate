"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Loader2,
  ArrowLeft,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { DocumentAnalysis } from "@/lib/ai";

type Tab = "summary" | "risks" | "clauses" | "obligations" | "dates";

export default function DashboardPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setAnalysis(null);
    setText("");
    setLoading(true);

    try {
      // Plain text files: read directly in browser
      if (f.type === "text/plain" || f.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setText((e.target?.result as string) || "");
          setLoading(false);
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setLoading(false);
        };
        reader.readAsText(f);
        return;
      }

      // PDF and DOCX: send to server for extraction
      const formData = new FormData();
      formData.append("file", f);

      const res = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to extract text");
        setLoading(false);
        return;
      }

      setText(json.data.text);
    } catch (err) {
      setError("Failed to process file. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleAnalyze = async () => {
    if (!text || text.length < 100) {
      setError("Please provide at least 100 characters of document text.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 50000) }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Analysis failed");
      }
      setAnalysis(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "low":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "Summary", icon: <FileText className="w-4 h-4" /> },
    {
      id: "risks",
      label: `Risks (${analysis?.riskFlags.length || 0})`,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: "clauses",
      label: `Key Clauses (${analysis?.keyClauses.length || 0})`,
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "obligations",
      label: "Obligations",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "dates",
      label: "Dates",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-xs text-amber-800 max-w-4xl mx-auto">
          ⚠️ <strong>AI-Assisted Estimation:</strong> GlassEstimate provides pricing estimates based on your inputs and rates. Always verify final pricing before presenting to clients.{" "}
          <Link href="/disclaimer" className="underline hover:text-amber-900 font-medium">Full Disclaimer</Link>
        </p>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">GlassEstimate</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!analysis && (
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 bg-white"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-1">
                {isDragActive
                  ? "Drop your document here"
                  : "Drag & drop a legal document"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PDF, DOCX, or TXT (max 10MB)
              </p>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Select file
              </button>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            )}

            {/* Text input area (for pasting) */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or paste document text directly:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your contract, lease, NDA, or any legal document text here..."
                rows={12}
                className="w-full rounded-lg border border-gray-300 p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
              <p className="mt-1 text-xs text-gray-500">
                {text.length} characters (min 100 required)
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || text.length < 100}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing document...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Analyze Document
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {analysis && (
          <div className="animate-fade-in">
            {/* Tab bar */}
            <div className="flex gap-1 mb-8 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              {/* Summary Tab */}
              {activeTab === "summary" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Executive Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {analysis.summary}
                  </p>
                  {analysis.recommendations && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Recommendations
                      </h3>
                      <p className="text-blue-800 text-sm whitespace-pre-line">
                        {analysis.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Risks Tab */}
              {activeTab === "risks" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Risk Assessment
                  </h2>
                  {analysis.riskFlags.length === 0 ? (
                    <p className="text-gray-500">No significant risks detected.</p>
                  ) : (
                    <div className="space-y-4">
                      {analysis.riskFlags.map((risk, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-4 rounded-lg border",
                            severityColor(risk.severity)
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                severityBadge(risk.severity)
                              )}
                            >
                              {risk.severity}
                            </span>
                            <span className="font-semibold text-sm">
                              {risk.clause}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{risk.explanation}</p>
                          <p className="text-sm font-medium">
                            💡 <span className="opacity-80">Suggestion:</span>{" "}
                            {risk.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clauses Tab */}
              {activeTab === "clauses" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Key Clauses
                  </h2>
                  <div className="space-y-4">
                    {analysis.keyClauses.map((clause, i) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {i + 1}. {clause.title}
                          {clause.page && (
                            <span className="text-sm text-gray-500 ml-2">
                              (p. {clause.page})
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {clause.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Obligations Tab */}
              {activeTab === "obligations" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Party Obligations
                  </h2>
                  {analysis.obligations.length === 0 ? (
                    <p className="text-gray-500">No obligations identified.</p>
                  ) : (
                    <div className="space-y-3">
                      {analysis.obligations.map((ob, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="min-w-[100px]">
                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase">
                              {ob.party}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              {ob.description}
                            </p>
                            {ob.deadline && (
                              <p className="text-xs text-gray-500 mt-1">
                                ⏰ Deadline: {ob.deadline}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dates Tab */}
              {activeTab === "dates" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Important Dates
                  </h2>
                  {analysis.dates.length === 0 ? (
                    <p className="text-gray-500">No key dates identified.</p>
                  ) : (
                    <div className="space-y-3">
                      {analysis.dates.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {d.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              {d.date} — {d.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* New analysis button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setFile(null);
                  setText("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Analyze another document
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
