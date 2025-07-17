
import React, { useState, useMemo } from 'react';
import { Download, Calendar, FileText, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ProgressEntry } from '@/types/progressEntry';

interface ExportDataProps {
  entries: ProgressEntry[];
}

const ExportData: React.FC<ExportDataProps> = ({ entries }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [exportType, setExportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

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

  const getFilteredEntries = (studentFilter?: string) => {
    let filteredByDate = entries;
    
    if (exportType === 'daily') {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);
      filteredByDate = entries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      );
    } else {
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      filteredByDate = entries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      );
    }

    if (studentFilter) {
      return filteredByDate.filter(entry => 
        entry.kidsTaught.includes(studentFilter)
      );
    }

    return filteredByDate;
  };

  const generateCSVContent = (entriesData: ProgressEntry[], studentFilter?: string) => {
    // Group entries by student
    const studentGroups = new Map<string, ProgressEntry[]>();
    
    entriesData.forEach(entry => {
      entry.kidsTaught.forEach(student => {
        if (!studentFilter || student === studentFilter) {
          if (!studentGroups.has(student)) {
            studentGroups.set(student, []);
          }
          studentGroups.get(student)!.push(entry);
        }
      });
    });

    let csvContent = '';
    
    // Add header
    csvContent += 'Student Name,Date,Day,Volunteer Name,Class,Topic Taught,Homework\n';
    
    // Add data for each student
    studentGroups.forEach((studentEntries, studentName) => {
      studentEntries
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .forEach(entry => {
          const row = [
            `"${studentName}"`,
            `"${format(entry.date, 'yyyy-MM-dd')}"`,
            `"${entry.day}"`,
            `"${entry.volunteerName || ''}"`,
            `"${entry.class}"`,
            `"${entry.topicTaught.replace(/"/g, '""')}"`,
            `"${(entry.homework || '').replace(/"/g, '""')}"`
          ].join(',');
          csvContent += row + '\n';
        });
    });

    return csvContent;
  };

  const downloadCSV = (studentFilter?: string) => {
    const filteredEntries = getFilteredEntries(studentFilter);
    
    if (filteredEntries.length === 0) {
      toast({
        title: "No Data",
        description: `No progress entries found for the selected ${exportType === 'daily' ? 'date' : 'month'}${studentFilter ? ` and student ${studentFilter}` : ''}.`,
        variant: "destructive"
      });
      return;
    }

    const csvContent = generateCSVContent(filteredEntries, studentFilter);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const dateStr = exportType === 'daily' 
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(selectedDate, 'yyyy-MM');
      
      const fileName = studentFilter
        ? `${studentFilter.replace(/\s+/g, '_')}_progress_${dateStr}.csv`
        : `progress_entries_${dateStr}.csv`;
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `${filteredEntries.length} entries exported successfully${studentFilter ? ` for ${studentFilter}` : ''}.`
      });
    }
  };

  const getAllEntriesPreview = () => {
    const filteredEntries = getFilteredEntries();
    const uniqueStudents = new Set<string>();
    filteredEntries.forEach(entry => {
      entry.kidsTaught.forEach(student => uniqueStudents.add(student));
    });
    return { entries: filteredEntries, students: uniqueStudents.size };
  };

  const getStudentEntriesPreview = (student: string) => {
    const filteredEntries = getFilteredEntries(student);
    return filteredEntries.length;
  };

  const allEntriesPreview = getAllEntriesPreview();

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Progress Data</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all">Export All Students</TabsTrigger>
              <TabsTrigger value="individual">Export Individual Student</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Export Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Export Type</label>
                <div className="flex space-x-4">
                  <Button
                    variant={exportType === 'daily' ? 'default' : 'outline'}
                    onClick={() => setExportType('daily')}
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Daily</span>
                  </Button>
                  <Button
                    variant={exportType === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setExportType('monthly')}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Monthly</span>
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Select {exportType === 'daily' ? 'Date' : 'Month'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        exportType === 'daily' 
                          ? format(selectedDate, "PPP")
                          : format(selectedDate, "MMMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Preview Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-gray-900">Export Preview - All Students</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{allEntriesPreview.entries.length} Total Entries</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>{allEntriesPreview.students} Unique Students</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>
                      {exportType === 'daily' 
                        ? format(selectedDate, 'MMM dd, yyyy')
                        : format(selectedDate, 'MMMM yyyy')
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={() => downloadCSV()}
                disabled={allEntriesPreview.entries.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All Students as CSV
              </Button>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              {/* Student Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a student to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStudents.map(student => (
                      <SelectItem key={student} value={student}>
                        {student} ({getStudentEntriesPreview(student)} entries)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Export Type</label>
                <div className="flex space-x-4">
                  <Button
                    variant={exportType === 'daily' ? 'default' : 'outline'}
                    onClick={() => setExportType('daily')}
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Daily</span>
                  </Button>
                  <Button
                    variant={exportType === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setExportType('monthly')}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Monthly</span>
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Select {exportType === 'daily' ? 'Date' : 'Month'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        exportType === 'daily' 
                          ? format(selectedDate, "PPP")
                          : format(selectedDate, "MMMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Preview Information for Individual Student */}
              {selectedStudent && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-gray-900">Export Preview - {selectedStudent}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>{getStudentEntriesPreview(selectedStudent)} Entries</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span>{selectedStudent}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span>
                        {exportType === 'daily' 
                          ? format(selectedDate, 'MMM dd, yyyy')
                          : format(selectedDate, 'MMMM yyyy')
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Button for Individual Student */}
              <Button
                onClick={() => selectedStudent && downloadCSV(selectedStudent)}
                disabled={!selectedStudent || getStudentEntriesPreview(selectedStudent) === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {selectedStudent ? `Export ${selectedStudent}'s Progress` : 'Select Student to Export'}
              </Button>
            </TabsContent>
          </Tabs>

          {/* No data message */}
          {allStudents.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              No students found. Add some progress entries first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
