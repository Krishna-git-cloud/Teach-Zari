"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// ✅ Match DB column names
type DBProfile = {
  id: string;
  name: string;
  classname: string | null;
  school: string | null;
  phone: string | null;
  created_at?: string;
};

type ProgressRow = {
  class: string | null;
  kids_taught: string[] | null;
};

// ✅ Keep consistent with DB
type MergedProfile = {
  id?: string;
  name: string;
  classname: string;
  school: string;
  phone: string;
};

const ProfileTab: React.FC = () => {
  const [profiles, setProfiles] = useState<MergedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ school: string; phone: string }>({
    school: "",
    phone: "",
  });
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 🔍 Search + filter state
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  // -------- Fetch & Merge --------
  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg("");

    // 1) Load saved profiles
    const { data: savedProfiles, error: pErr } = await supabase
      .from("kid_profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (pErr) {
      setErrorMsg(`Error loading kid_profiles: ${pErr.message}`);
    }

    // 2) Load progress entries with names & class
    const { data: progress, error: eErr } = await supabase
      .from("progress_entries")
      .select("class, kids_taught");

    if (eErr) {
      setErrorMsg((prev) =>
        prev
          ? `${prev}\nError loading progress_entries: ${eErr.message}`
          : `Error loading progress_entries: ${eErr.message}`
      );
    }

    // Build a name -> class map
    const nameToClass = new Map<string, string>();
    (progress as ProgressRow[] | null)?.forEach((row) => {
      const cls = row.class ?? "";
      (row.kids_taught ?? []).forEach((kid) => {
        const key = kid.trim();
        if (!key) return;
        if (!nameToClass.has(key) || !nameToClass.get(key)) {
          nameToClass.set(key, cls);
        }
      });
    });

    // Merge names from both
    const allNames = new Set<string>(Array.from(nameToClass.keys()));
    (savedProfiles as DBProfile[] | null)?.forEach(({ name }) =>
      allNames.add(name)
    );

    const merged: MergedProfile[] = Array.from(allNames)
      .map((name) => {
        const saved = (savedProfiles as DBProfile[] | null)?.find(
          (p) => p.name === name
        );
        return {
          id: saved?.id,
          name,
          classname: saved?.classname ?? nameToClass.get(name) ?? "",
          school: saved?.school ?? "",
          phone: saved?.phone ?? "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    setProfiles(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    // Realtime changes
    const channel = supabase
      .channel("kid_profiles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kid_profiles" },
        fetchAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -------- Edit & Save --------
  const startEdit = (kid: MergedProfile) => {
    setEditingId(kid.id ?? `NEW:${kid.name}`);
    setEditData({
      school: kid.school || "",
      phone: kid.phone || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ school: "", phone: "" });
  };

  const saveEdit = async (kid: MergedProfile) => {
    setErrorMsg("");
    try {
      if (kid.id) {
        // Update existing
        const { error } = await supabase
          .from("kid_profiles")
          .update({
            school: editData.school,
            phone: editData.phone,
            classname: kid.classname ?? null,
          })
          .eq("id", kid.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("kid_profiles").insert({
          name: kid.name,
          classname: kid.classname ?? null,
          school: editData.school,
          phone: editData.phone,
        });

        if (error) throw error;
      }

      cancelEdit();
      await fetchAll();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save profile");
    }
  };

  // -------- Stats --------
  const totalWithContacts = useMemo(
    () => profiles.filter((p) => p.school || p.phone).length,
    [profiles]
  );

  // -------- Filters --------
  const resetFilters = () => {
    setSearch("");
    setClassFilter("all");
  };

  const filteredProfiles = profiles.filter((kid) => {
    const matchesSearch =
      kid.name.toLowerCase().includes(search.toLowerCase()) ||
      kid.school.toLowerCase().includes(search.toLowerCase()) ||
      kid.phone.toLowerCase().includes(search.toLowerCase());

    const matchesClass =
      classFilter === "all" || kid.classname === classFilter;

    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(
    new Set(profiles.map((p) => p.classname).filter(Boolean))
  );

  if (loading) return <p className="p-4">Loading profiles…</p>;

  return (
    <div className="space-y-4 p-2 md:p-4">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* 🔍 Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by name, school, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls!}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={resetFilters} variant="outline">
            Reset
          </Button>
        </div>

        {/* Badges */}
<div className="flex items-center gap-2">
  <Badge variant="outline">Total: {filteredProfiles.length}</Badge>
  <Badge variant="secondary">
    With contacts: {filteredProfiles.filter((p) => p.school || p.phone).length}
  </Badge>
</div>
</div>

      {errorMsg && (
        <div className="text-sm text-red-600 whitespace-pre-wrap">
          {errorMsg}
        </div>
      )}

      {/* Profiles grid */}
      {filteredProfiles.length === 0 ? (
        <p className="text-gray-500">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfiles.map((kid) => {
            const isEditing = editingId === (kid.id ?? `NEW:${kid.name}`);
            return (
              <Card
                key={kid.id ?? kid.name}
                className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition"
              >
               {/* Profile Header */}
<div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/30 text-lg font-bold shadow">
      {kid.name.charAt(0).toUpperCase()}
    </div>
    <div>
      <h2 className="text-lg font-semibold truncate">{kid.name}</h2>
    </div>
  </div>

  {/* Highlighted Class Badge */}
  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-blue-700 shadow-md">
    {kid.classname || "Class N/A"}
  </span>
</div>


                {/* Profile Content */}
                <CardContent className="p-4 space-y-3 text-sm">
                  {isEditing ? (
                    <>
                      <Input
                        placeholder="School"
                        value={editData.school}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            school: e.target.value,
                          }))
                        }
                        className="rounded-xl border-blue-200 shadow-sm focus:ring-2 focus:ring-blue-400"
                      />
                      <Input
                        placeholder="Phone"
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="rounded-xl border-blue-200 shadow-sm focus:ring-2 focus:ring-blue-400"
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          onClick={() => saveEdit(kid)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-medium">School:</span>{" "}
                        {kid.school || (
                          <span className="text-gray-500">Not added</span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {kid.phone ? (
                          <a
                            href={`tel:${kid.phone}`}
                            className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition cursor-pointer"
                            title="Click to call"
                          >
                            {kid.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not added</span>
                        )}
                      </p>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(kid)}
                        className="mt-2 rounded-lg"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileTab;  
