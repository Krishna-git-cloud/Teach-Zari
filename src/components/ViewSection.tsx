
import React, { useState, useMemo } from 'react';
import { Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SearchFiltersComponent from './SearchFilters';
import ProgressEntryCard from './ProgressEntryCard';
import { ProgressEntry, SearchFilters } from '@/types/progressEntry';

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

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <SearchFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        availableClasses={availableClasses}
        availableVolunteers={availableVolunteers}
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
                <button
                  onClick={() => handleStudentSelect('all')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedStudent === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">All Students Overview</span>
                    <Badge variant={selectedStudent === 'all' ? 'secondary' : 'outline'}>
                      {filteredEntries.length} entries
                    </Badge>
                  </div>
                </button>

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
                        <ProgressEntryCard key={entry.id} entry={entry} borderColor="border-l-purple-500" />
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
                        <ProgressEntryCard key={entry.id} entry={entry} borderColor="border-l-blue-500" />
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
  );
};

export default ViewSection;
