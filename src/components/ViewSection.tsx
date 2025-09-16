import React, { useState, useMemo } from 'react';
import { Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SearchFiltersComponent from './SearchFilters';
import ProgressEntryCard from './ProgressEntryCard';
import StudentProgressReport from './StudentProgressReport';
import { ProgressEntry, SearchFilters } from '@/types/progressEntry';
import { KidProfile } from '@/types/kidProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Calendar from "react-calendar"; 

import { supabase } from "@/integrations/supabase/client";
import ProfileTab from "@/components/ProfileTab";
interface ViewSectionProps {
  entries: ProgressEntry[];
  onUpdateEntry: (id: string, updatedEntry: Partial<ProgressEntry>) => void;
  isAdmin?: boolean;
}

const ViewSection: React.FC<ViewSectionProps> = ({ entries, onUpdateEntry, isAdmin = false }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    studentName: '',
    className: '',
    volunteerName: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [kidProfiles, setKidProfiles] = useState<Record<string, KidProfile>>({});
  const [editingProfile, setEditingProfile] = useState<KidProfile | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportStudent, setReportStudent] = useState<string>('');


  // Get all unique students
  const allStudents = useMemo(() => {
    const studentSet = new Set<string>();
    entries.forEach(entry => {
      entry.kidsTaught.forEach(name => {
        studentSet.add(name);
      });
    });
    return Array.from(studentSet).sort();
  }, [entries]);

  const allKidProfiles = useMemo(() => {
  const profileMap: Record<string, KidProfile> = { ...kidProfiles };

  entries.forEach(entry => {
    entry.kidsTaught.forEach(name => {
      if (!profileMap[name]) {
       profileMap[name] = {
  id: `temp-${name}`,   // fake id
  name,
  className: entry.class || "Unknown",
};

      }
    });
  });

  return Object.values(profileMap).sort((a, b) => a.name.localeCompare(b.name));
}, [entries, kidProfiles]);
  const handleSaveProfile = async (name: string, updates: Partial<KidProfile>) => {
    try {
      const existing = kidProfiles[name];

      if (existing && !existing.id.startsWith("temp-")) {
        // ✅ Update existing in DB
        const { data, error } = await supabase
          .from("kid_profiles")
          .update(updates)
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error) throw error;

        setKidProfiles((prev) => ({
          ...prev,
          [name]: data,
        }));

        return data as KidProfile;
      } else {
        // ✅ Insert new profile
        const newProfile = { name, ...updates };
        const { data, error } = await supabase
          .from("kid_profiles")
          .insert(newProfile)
          .select("*")
          .single();

        if (error) throw error;

        setKidProfiles((prev) => ({
          ...prev,
          [name]: data,
        }));

        return data as KidProfile;
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      return null;
    }
  };

  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    entries.forEach(entry => {
      if (entry.class) classSet.add(entry.class);
    });
    return Array.from(classSet).sort();
  }, [entries]);

 const availableVolunteers = useMemo(() => {
  const volunteerMap = new Map<string, string>();

  entries.forEach(entry => {
    if (entry.volunteerName) {
      const lowerName = entry.volunteerName.toLowerCase();
      if (!volunteerMap.has(lowerName)) {
        // Preserve original casing of first occurrence
        volunteerMap.set(lowerName, entry.volunteerName);
      }
    }
  });

  return Array.from(volunteerMap.values()).sort((a, b) => a.localeCompare(b));
}, [entries]);

  // Get entries for a specific student
  const getStudentEntries = (studentName: string) => {
    return entries.filter(entry => 
      entry.kidsTaught.includes(studentName)
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  // Enhanced filtering logic for all entries with letter-by-letter search
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Student name search - letter by letter matching
      if (filters.studentName && filters.studentName.trim()) {
        const searchTerm = filters.studentName.toLowerCase().trim();
        const hasMatchingStudent = entry.kidsTaught.some(student => 
          student.toLowerCase().includes(searchTerm)
        );
        if (!hasMatchingStudent) return false;
      }
      
      // Class filter
      if (filters.className && entry.class !== filters.className) {
        return false;
      }
      
    if (
  filters.volunteerName &&
  entry.volunteerName?.toLowerCase() !== filters.volunteerName.toLowerCase()
) {
  return false;
}

      return true;
    });
  }, [entries, filters]);

  // Filter students based on search term for individual student view
  const filteredStudents = useMemo(() => {
    if (!filters.studentName || !filters.studentName.trim()) {
      return allStudents;
    }
    const searchTerm = filters.studentName.toLowerCase().trim();
    return allStudents.filter(student => 
      student.toLowerCase().includes(searchTerm)
    );
  }, [allStudents, filters.studentName]);

  // Pagination for all entries
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredEntries.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredEntries, currentPage, entriesPerPage]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Reset to 'all' view when searching to show filtered results
    if (newFilters.studentName && newFilters.studentName.trim()) {
      setSelectedStudent('all');
    }
  };

  const handleClearFilters = () => {
    setFilters({ studentName: '', className: '', volunteerName: '' });
    setCurrentPage(1);
    setSelectedStudent('all');
  };

  const handleStudentSelect = (student: string) => {
    setSelectedStudent(student);
  };

  const handleViewReport = (studentName: string) => {
    setReportStudent(studentName);
    setShowReport(true);
  };

  const handleCloseReport = () => {
    setShowReport(false);
    setReportStudent('');
  };
// Check if a volunteer hasn't added an entry in the last 14 days
const isVolunteerInactive = (volunteerName: string): boolean => {
  if (!volunteerName) return false;

  // Get all entries for this volunteer
  const volunteerEntries = entries.filter(
    (entry) => entry.volunteerName?.toLowerCase() === volunteerName.toLowerCase()
  );

  if (volunteerEntries.length === 0) return true; // No entries at all

  // Find latest entry date
  const latestDate = volunteerEntries.reduce((latest, entry) => {
  const entryDate = new Date(entry.date);   // ✅ convert to Date
  return entryDate > latest ? entryDate : latest;
}, new Date(0));

  // Compare with 14 days ago
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  return latestDate < fourteenDaysAgo;
};
const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<"count" | "lastUpdated">("count");

const { toast } = useToast();

// normalize a date to local "YYYY-MM-DD"
const getLocalYMD = (input: string | Date) => {
  const d = new Date(input);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// format a Date object to DD/MM/YY
const formatDDMMYY = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear().toString().slice(-2);
  return `${d}/${m}/${y}`;
};

// prepare sorted volunteer data (unique local days, count, lastUpdated)
const volunteerData = useMemo(() => {
  const data = availableVolunteers.map((vol) => {
    const volEntries = entries.filter((e) => e.volunteerName === vol);

    // unique days in local timezone
    const uniqueDays = Array.from(new Set(volEntries.map((e) => getLocalYMD(e.date))));
    const count = uniqueDays.length;

    // lastUpdated computed from local-midnight timestamps
    let lastUpdated = "—";
    if (uniqueDays.length > 0) {
      const latestTs = Math.max(
        ...uniqueDays.map((d) => {
          const [y, m, day] = d.split("-").map(Number);
          return new Date(y, m - 1, day).getTime(); // local midnight
        })
      );
      lastUpdated = formatDDMMYY(new Date(latestTs));
    }

    return { vol, count, lastUpdated };
  });

  // Apply sorting toggle
  data.sort((a, b) => {
    if (sortBy === "count") return b.count - a.count;
    if (sortBy === "lastUpdated") {
      const aTime = a.lastUpdated === "—" ? 0 : (() => {
        const [d, m, y] = a.lastUpdated.split("/").map(Number);
        return new Date(2000 + y, m - 1, d).getTime(); // convert DD/MM/YY back to Date
      })();
      const bTime = b.lastUpdated === "—" ? 0 : (() => {
        const [d, m, y] = b.lastUpdated.split("/").map(Number);
        return new Date(2000 + y, m - 1, d).getTime();
      })();
      return bTime - aTime; // latest first
    }
    return 0;
  });

  return data;
}, [availableVolunteers, entries, sortBy]);

// set of attended local-day strings for the selected volunteer (used by the calendar)
const attendedDaysForSelectedVolunteer = useMemo(() => {
  if (!selectedVolunteer) return new Set<string>();
  const volEntries = entries.filter((e) => e.volunteerName === selectedVolunteer);
  return new Set(volEntries.map((e) => getLocalYMD(e.date)));
}, [selectedVolunteer, entries]);

  return (
    <>
      <Tabs defaultValue="records" className="space-y-6">
      {/* Tabs header */}
      <TabsList className="bg-gray-100 p-1 rounded-lg">
        <TabsTrigger value="records">Progress records</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
      </TabsList>

      <TabsContent value="records">
        <div className="space-y-6">
      {/* Search and Filter Section */}
      <SearchFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        availableClasses={availableClasses}
        availableVolunteers={availableVolunteers}
        isVolunteerInactive={isVolunteerInactive}
        suggestions={[]}
        showSuggestions={false}
        onSelectSuggestion={() => {}}
      />

      {/* Records Display with Student Grid */}
      <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Progress Records</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {allStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No progress entries found. Start by adding some records!
            </p>
          ) : (
            <div className="space-y-6">
              {/* Student Selection Section */}
              <div className="space-y-4">
                {/* All Students Button */}
               <div className="w-full">
  <button
    onClick={() => handleStudentSelect('all')}
    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
      selectedStudent === 'all'
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600'
        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
    }`}
  >
    <span className="font-medium">All Students Overview</span>
    <Badge variant={selectedStudent === 'all' ? 'secondary' : 'outline'}>
      {filteredEntries.length} entries
    </Badge>
  </button>
</div>


                {/* Collapsible Individual Students */}
                <Collapsible open={isStudentListOpen} onOpenChange={setIsStudentListOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between hover:bg-gray-50"
                    >
                      <span className="font-medium">
                        Individual Students 
                        {filters.studentName && ` (${filteredStudents.length} matching)`}
                      </span>
                      {isStudentListOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-3">
                    {/* Students Tags Grid */}
                    <div className="flex flex-wrap gap-2">
                      {filteredStudents.map(student => {
                        const studentEntries = getStudentEntries(student);
                        return (
                          <button
                            key={student}
                            onClick={() => handleStudentSelect(student)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border ${
                              selectedStudent === student
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <span className="truncate max-w-24">{student}</span>
                            <Badge 
                              variant={selectedStudent === student ? 'secondary' : 'outline'}
                              className="text-xs px-1.5 py-0.5 min-w-0 h-4"
                            >
                              {studentEntries.length}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                    {filteredStudents.length === 0 && filters.studentName && (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        No students found matching "{filters.studentName}"
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Selected Content */}
              <div className="space-y-4">
                {selectedStudent === 'all' ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {filters.studentName || filters.className || filters.volunteerName 
                        ? 'Filtered Results' 
                        : 'All Students Progress'
                      }
                    </h3>
                    <div className="space-y-4">
                      {paginatedEntries.map((entry) => (
                       <ProgressEntryCard 
  key={entry.id} 
  entry={entry} 
  borderColor={isVolunteerInactive(entry.volunteerName || '') 
    ? "border-l-red-500" 
    : "border-l-purple-500"}
  inactiveVolunteer={isVolunteerInactive(entry.volunteerName || '')}
  onViewReport={handleViewReport}
/>

                      ))}
                    </div>
                    
                    {filteredEntries.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No entries found matching your search criteria.
                      </p>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Progress for {selectedStudent}
                      </h3>
                      <Badge variant="secondary">{getStudentEntries(selectedStudent).length} total entries</Badge>
                    </div>
                    <div className="space-y-4">
                      {getStudentEntries(selectedStudent).map((entry) => (
                        <ProgressEntryCard 
  key={entry.id} 
  entry={entry} 
  borderColor={isVolunteerInactive(entry.volunteerName || '') 
    ? "border-l-red-500" 
    : "border-l-purple-500"}
  inactiveVolunteer={isVolunteerInactive(entry.volunteerName || '')}
  onViewReport={handleViewReport}
/>

                      ))}
                    </div>
                    {getStudentEntries(selectedStudent).length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No progress entries found for {selectedStudent}.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
     </TabsContent>
 

<TabsContent value="profiles">
  <ProfileTab />
</TabsContent>
      <TabsContent value="resources">
  <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-xl">
    <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-t-lg">
      <CardTitle className="text-lg md:text-xl">Resources</CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
      {/* Embed Container */}
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <iframe
          src="https://drive.google.com/embeddedfolderview?id=1L5SNtN9l4Yf8ANyW5uVa3MVUBneANL7V#grid"
          className="w-full h-[300px] md:h-[500px] border-0"
          allowFullScreen
        ></iframe>

        {/* Gradient overlay for style */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      {/* Fallback / Button */}
      <div className="text-center">
        <a
          href="https://drive.google.com/drive/folders/1L5SNtN9l4Yf8ANyW5uVa3MVUBneANL7V"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
        >
          <span>📂 Open in Google Drive</span>
        </a>
      </div>
    </CardContent>
  </Card>
</TabsContent>



         {/* ✅ Tabs closed cleanly */}
    </Tabs>

    {/* Student Progress Report Modal */}
    {showReport && reportStudent && (
      <StudentProgressReport
        studentName={reportStudent}
        entries={getStudentEntries(reportStudent)}
        onClose={handleCloseReport}
      />
    )}
    </>
  );
};

export default ViewSection;
