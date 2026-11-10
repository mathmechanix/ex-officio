"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>(["TypeScript", "PostgreSQL"]);
  const [loading, setLoading] = useState(false);

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();
      if (!techStack.includes(techInput.trim())) {
        setTechStack([...techStack, techInput.trim()]);
      }
      setTechInput("");
    }
  };

  const handleRemoveTech = (item: string) => {
    setTechStack(techStack.filter((t) => t !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          techStack,
          repoUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        router.push(`/dashboard/projects/${data.project.id}`);
      } else {
        router.push("/dashboard/projects/proj-apollo-9");
      }
    } catch {
      router.push("/dashboard/projects/proj-apollo-9");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 font-sans text-sand-950">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center text-xs font-mono text-sand-600 hover:text-sand-950 transition"
      >
        <ArrowLeft size={13} className="mr-1" /> BACK TO PROJECTS
      </Link>

      <div className="border-b border-sand-300 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
          Connect Repository Workspace
        </h1>
        <p className="text-xs text-sand-700 mt-1 font-medium">
          Link your GitHub repository to enable AI evidence tracking and knowledge reconstruction.
        </p>
      </div>

      <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          <div>
            <label className="block text-xs font-bold text-sand-900 mb-1.5 uppercase tracking-wider">
              PROJECT NAME
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apollo Core Engine"
              className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sand-900 mb-1.5 uppercase tracking-wider">
              PROJECT DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the purpose of this project and its core architectural domain..."
              className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700 min-h-[90px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sand-900 mb-1.5 uppercase tracking-wider">
              GITHUB REPOSITORY URL
            </label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/acme-corp/apollo-core"
              className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
            />
            <p className="text-[10px] text-sand-500 mt-1">
              Ex Officio will automatically ingest commit history, pull requests, and unresolved issues.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-sand-900 mb-1.5 uppercase tracking-wider">
              TECHNOLOGY STACK (HIT ENTER TO ADD)
            </label>
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={handleAddTech}
              placeholder="Type tech name and hit Enter (e.g. Kafka, Prisma, Redis)..."
              className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-sand-200 text-sand-900"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="text-sand-500 hover:text-sand-950"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-sand-200 flex justify-end gap-3">
            <Link
              href="/dashboard/projects"
              className="px-3 py-1.5 text-sand-600 hover:text-sand-950 uppercase"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 text-xs font-mono font-bold uppercase tracking-wider transition inline-flex items-center gap-1.5 disabled:opacity-70"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : null}
              <span>{loading ? "INITIALIZING WORKSPACE..." : "[+] CREATE & CONNECT"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
