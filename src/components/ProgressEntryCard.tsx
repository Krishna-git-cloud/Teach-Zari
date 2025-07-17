
import React from 'react';
import { Calendar, Users, BookOpen, FileText, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate } from '@/utils/dateUtils';
import { ProgressEntry } from '@/types/progressEntry';

interface ProgressEntryCardProps {
  entry: ProgressEntry;
  borderColor?: string;
}

const ProgressEntryCard: React.FC<ProgressEntryCardProps> = ({ 
  entry, 
  borderColor = 'border-l-blue-500' 
}) => {
  return (
    <Card className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDisplayDate(entry.date)} ({entry.day})</span>
            </Badge>
            <Badge variant="secondary">{entry.class}</Badge>
            {entry.volunteerName && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{entry.volunteerName}</span>
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Users className="h-4 w-4 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Students:</p>
                <p className="text-gray-700 text-sm">{entry.kidsTaught.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Topic Taught:</p>
                <p className="text-gray-700 text-sm">{entry.topicTaught}</p>
              </div>
            </div>
            
            {entry.homework && (
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Homework:</p>
                  <p className="text-gray-700 text-sm">{entry.homework}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressEntryCard;
