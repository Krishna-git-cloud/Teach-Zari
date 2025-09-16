import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { 
  Calendar, 
  BookOpen, 
  Users, 
  Clock, 
  Target,
  Download,
  X,
  BarChart3,
  FileText,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { ProgressEntry } from '@/types/progressEntry';
import { formatDisplayDate } from '@/utils/dateUtils';
import { calculateStudentStats, exportStudentReportToExcel, exportStudentReportToPDF } from '@/utils/reportExport';
interface StudentProgressReportProps {
  studentName: string;
  entries: ProgressEntry[];
  onClose: () => void;
}

const StudentProgressReport: React.FC<StudentProgressReportProps> = ({
  studentName,
  entries,
  onClose
}) => {
  // Calculate simple statistics
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalSessions: 0,
        uniqueVolunteers: 0,
        uniqueTopics: 0,
        volunteers: [],
        topics: [],
        homework: [],
        recentActivity: 0
      };
    }

    // Basic counts
    const totalSessions = entries.length;
    const uniqueVolunteers = new Set(entries.map(e => e.volunteerName).filter(Boolean)).size;
    const uniqueTopics = new Set(entries.map(e => e.topicTaught)).size;

    // Recent activity
    const lastSession = new Date(Math.max(...entries.map(e => e.date.getTime())));
    const daysSinceLastSession = Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

    // Get unique volunteers with session counts
    const volunteerMap = new Map<string, number>();
    entries.forEach(entry => {
      if (entry.volunteerName) {
        volunteerMap.set(entry.volunteerName, (volunteerMap.get(entry.volunteerName) || 0) + 1);
      }
    });
    const volunteers = Array.from(volunteerMap.entries())
      .map(([name, count]) => ({ name, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions);

    // Get unique topics with session counts
    const topicMap = new Map<string, number>();
    entries.forEach(entry => {
      topicMap.set(entry.topicTaught, (topicMap.get(entry.topicTaught) || 0) + 1);
    });
    const topics = Array.from(topicMap.entries())
      .map(([name, count]) => ({ name, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions);

    // Get all homework assignments
    const homework = entries
      .filter(entry => entry.homework && entry.homework.trim())
      .map(entry => ({
        date: entry.date,
        homework: entry.homework,
        volunteer: entry.volunteerName,
        topic: entry.topicTaught
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      totalSessions,
      uniqueVolunteers,
      uniqueTopics,
      volunteers,
      topics,
      homework,
      recentActivity: daysSinceLastSession
    };
  }, [entries]);

  // Export functions
  const handleExportExcel = () => {
    const reportData = calculateStudentStats(studentName, entries);
    exportStudentReportToExcel(reportData);
  };

  const handleExportPDF = () => {
    const reportData = calculateStudentStats(studentName, entries);
    exportStudentReportToPDF(reportData);
  };

  return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
<div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b">
  {/* Title & buttons */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6">
    {/* Title */}
    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
      <BarChart3 className="h-6 w-6" />
      <div>
        <h2 className="text-2xl font-bold">Progress Report</h2>
        <p className="text-blue-100">{studentName}</p>
      </div>
    </div>

    {/* Export Buttons */}
    <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportExcel}
        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
      >
        <Download className="h-4 w-4 mr-1" /> Excel
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportPDF}
        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
      >
        <Download className="h-4 w-4 mr-1" /> PDF
      </Button>
    </div>
  </div>

  {/* Floating X Button */}
  <Button
    variant="ghost"
    size="sm"
    onClick={onClose}
    className="absolute top-2 right-2 text-white hover:bg-white/20 p-1 rounded-full"
  >
    <X className="h-4 w-4" />
  </Button>
</div>


        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Volunteers</p>
                      <p className="text-2xl font-bold text-green-600">{stats.uniqueVolunteers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Topics Covered</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.uniqueTopics}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {stats.recentActivity === 0 ? 'Today' : 
                     stats.recentActivity === 1 ? 'Yesterday' : 
                     `${stats.recentActivity} days ago`}
                  </div>
                  <p className="text-sm text-gray-600">
                    Last session was {stats.recentActivity === 0 ? 'today' : 
                    stats.recentActivity === 1 ? 'yesterday' : 
                    `${stats.recentActivity} days ago`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Volunteers List */}
           <Card>
  <Collapsible>
    <CardHeader>
      <CollapsibleTrigger className="w-full flex items-center justify-between">
      <CardTitle className="flex items-center space-x-2 text-base font-semibold text-gray-600">
  <UserCheck className="h-4 w-4 text-gray-600" />
  <span>Volunteers Who Taught {studentName}</span>
</CardTitle>

   <span className="text-sm text-gray-500">▼</span>
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent>
      <CardContent>
        {stats.volunteers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No volunteer data available</p>
        ) : (
          <div className="space-y-3">
            {stats.volunteers.map((volunteer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{volunteer.name}</p>
                    <p className="text-sm text-gray-600">Volunteer</p>
                  </div>
                </div>
                <Badge variant="secondary">{volunteer.sessions} sessions</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>


            {/* Topics List */}
           <Card>
  <Collapsible>
    <CardHeader>
      <CollapsibleTrigger className="w-full flex items-center justify-between">
       <CardTitle className="flex items-center space-x-2 text-base font-semibold text-gray-600">
  <GraduationCap className="h-4 w-4 text-gray-600" />
  <span>Topics Taught to {studentName}</span>
</CardTitle>


        <span className="text-sm text-gray-500">▼</span>
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent>
      <CardContent>
        {stats.topics.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No topic data available</p>
        ) : (
          <div className="space-y-3">
            {stats.topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{topic.name}</p>
                    <p className="text-sm text-gray-600">Subject</p>
                  </div>
                </div>
                <Badge variant="secondary">{topic.sessions} times</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>


            {/* Homework List */}
           <Card>
  <Collapsible>
    <CardHeader>
      <CollapsibleTrigger className="w-full flex items-center justify-between">
       <CardTitle className="flex items-center space-x-2 text-base font-semibold text-gray-600">
  <FileText className="h-4 w-4 text-gray-600" />
  <span>Homework Given to {studentName}</span>
</CardTitle>

        <span className="text-sm text-gray-500">▼</span>
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent>
      <CardContent>
        {stats.homework.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No homework assignments found</p>
        ) : (
          <div className="space-y-3">
            {stats.homework.map((assignment, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-orange-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {formatDisplayDate(assignment.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {assignment.volunteer}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {assignment.topic}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{assignment.homework}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>

            {/* Recent Sessions */}
           <Card>
  <Collapsible>
    <CardHeader>
      <CollapsibleTrigger className="w-full flex items-center justify-between">
      <CardTitle className="flex items-center space-x-2 text-base font-semibold text-gray-600">
  <Target className="h-4 w-4 text-gray-600" />
  <span>Recent Sessions</span>
</CardTitle>


        <span className="text-sm text-gray-500">▼</span>
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent>
      <CardContent>
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{index + 1}</Badge>
                <div>
                  <p className="font-medium">{entry.topicTaught}</p>
                  <p className="text-sm text-gray-600">
                    {formatDisplayDate(entry.date)} • {entry.volunteerName} •{" "}
                    {entry.class}
                  </p>
                </div>
              </div>
              {entry.homework && <Badge variant="secondary">Homework</Badge>}
            </div>
          ))}
        </div>
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressReport;
