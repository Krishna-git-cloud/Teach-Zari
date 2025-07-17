
import React, { useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProgressEntry {
  id: string;
  date: Date;
  day: string;
  kidsTaught: string[];
  class: string;
  topicTaught: string;
  homework: string;
}

interface StudentEditModalProps {
  entry: ProgressEntry;
  onUpdate: (updatedEntry: ProgressEntry) => void;
  onClose: () => void;
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ entry, onUpdate, onClose }) => {
  const [date, setDate] = useState<Date>(entry.date);
  const [kidsTaught, setKidsTaught] = useState<string[]>(entry.kidsTaught);
  const [currentKid, setCurrentKid] = useState('');
  const [classValue, setClassValue] = useState(entry.class);
  const [topicTaught, setTopicTaught] = useState(entry.topicTaught);
  const [homework, setHomework] = useState(entry.homework);

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const addKid = (kidName: string) => {
    if (kidName.trim() && !kidsTaught.includes(kidName.trim())) {
      setKidsTaught([...kidsTaught, kidName.trim()]);
      setCurrentKid('');
    }
  };

  const removeKid = (kidToRemove: string) => {
    setKidsTaught(kidsTaught.filter(kid => kid !== kidToRemove));
  };

  const handleSave = () => {
    if (kidsTaught.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one student name.",
        variant: "destructive"
      });
      return;
    }

    if (!classValue.trim() || !topicTaught.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const updatedEntry: ProgressEntry = {
      ...entry,
      date,
      day: getDayName(date),
      kidsTaught,
      class: classValue,
      topicTaught,
      homework
    };

    onUpdate(updatedEntry);
    toast({
      title: "Entry Updated Successfully!",
      description: "The progress record has been updated."
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Edit Progress Entry</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Day</Label>
              <Input 
                value={getDayName(date)} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Students Input */}
          <div className="space-y-2">
            <Label htmlFor="kids">Students Taught *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {kidsTaught.map((kid, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{kid}</span>
                  <button
                    type="button"
                    onClick={() => removeKid(kid)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={currentKid}
                onChange={(e) => setCurrentKid(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKid(currentKid);
                  }
                }}
                placeholder="Type student name and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => addKid(currentKid)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Class */}
          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            <Input
              id="class"
              value={classValue}
              onChange={(e) => setClassValue(e.target.value)}
              placeholder="e.g., Grade 4A, Mathematics Advanced"
              required
            />
          </div>

          {/* Topic Taught */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic Taught *</Label>
            <Textarea
              id="topic"
              value={topicTaught}
              onChange={(e) => setTopicTaught(e.target.value)}
              placeholder="Describe the topic covered in today's lesson..."
              rows={3}
              required
            />
          </div>

          {/* Homework */}
          <div className="space-y-2">
            <Label htmlFor="homework">Homework Assignment</Label>
            <Textarea
              id="homework"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Describe homework assignments given..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEditModal;
