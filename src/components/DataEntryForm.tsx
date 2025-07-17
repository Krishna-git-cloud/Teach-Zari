
import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ProgressEntry } from '@/types/progressEntry';

interface FormSection {
  id: string;
  kidsTaught: string[];
  class: string;
  topicTaught: string;
  homework: string;
}

interface DataEntryFormProps {
  onAddEntry: (entry: Omit<ProgressEntry, 'id'>) => Promise<ProgressEntry>;
  existingEntries: ProgressEntry[];
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ onAddEntry, existingEntries }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [volunteerName, setVolunteerName] = useState('');
  const [sections, setSections] = useState<FormSection[]>([
    {
      id: '1',
      kidsTaught: [],
      class: '',
      topicTaught: '',
      homework: ''
    }
  ]);
  const [currentKids, setCurrentKids] = useState<{[key: string]: string}>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  const [submitting, setSubmitting] = useState(false);

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const allStudents = [...new Set(existingEntries.flatMap(entry => 
    entry.kidsTaught.map(name => {
      const allNames = existingEntries.flatMap(e => e.kidsTaught);
      return allNames.find(n => n.toLowerCase() === name.toLowerCase()) || name;
    })
  ))];

  const normalizeStudentName = (name: string): string => {
    const existingName = allStudents.find(existing => 
      existing.toLowerCase() === name.toLowerCase()
    );
    return existingName || name;
  };

  const handleKidInput = (sectionId: string, value: string) => {
    setCurrentKids(prev => ({ ...prev, [sectionId]: value }));
    if (value.length > 0) {
      const section = sections.find(s => s.id === sectionId);
      const filtered = allStudents.filter(student => 
        student.toLowerCase().includes(value.toLowerCase()) &&
        !section?.kidsTaught.some(taught => taught.toLowerCase() === student.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(prev => ({ ...prev, [sectionId]: true }));
    } else {
      setShowSuggestions(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const addKid = (sectionId: string, kidName: string) => {
    if (kidName.trim()) {
      const normalizedName = normalizeStudentName(kidName.trim());
      setSections(prev => prev.map(section => {
        if (section.id === sectionId) {
          const isAlreadyAdded = section.kidsTaught.some(existing => 
            existing.toLowerCase() === normalizedName.toLowerCase()
          );
          if (!isAlreadyAdded) {
            return { ...section, kidsTaught: [...section.kidsTaught, normalizedName] };
          }
        }
        return section;
      }));
      setCurrentKids(prev => ({ ...prev, [sectionId]: '' }));
      setShowSuggestions(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const removeKid = (sectionId: string, kidToRemove: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, kidsTaught: section.kidsTaught.filter(kid => kid !== kidToRemove) };
      }
      return section;
    }));
  };

  const updateSection = (sectionId: string, field: keyof FormSection, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, [field]: value };
      }
      return section;
    }));
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: Date.now().toString(),
      kidsTaught: [],
      class: '',
      topicTaught: '',
      homework: ''
    };
    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(section => section.id !== sectionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSections = sections.filter(section => 
      section.kidsTaught.length > 0 && section.class.trim() && section.topicTaught.trim()
    );

    if (validSections.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least one complete section with students, class, and topic.",
        variant: "destructive"
      });
      return;
    }

    if (!volunteerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the volunteer name.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Create entries for each valid section
      for (const section of validSections) {
        const entry = {
          date,
          day: getDayName(date),
          volunteerName: volunteerName.trim(),
          kidsTaught: section.kidsTaught,
          class: section.class,
          topicTaught: section.topicTaught,
          homework: section.homework
        };
        await onAddEntry(entry);
      }
      
      // Reset form
      setVolunteerName('');
      setSections([{
        id: '1',
        kidsTaught: [],
        class: '',
        topicTaught: '',
        homework: ''
      }]);
      setCurrentKids({});
      
      toast({
        title: "Entries Added Successfully!",
        description: `${validSections.length} progress entry(ies) logged.`
      });
    } catch (error) {
      console.error('Error submitting entries:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Log Daily Academic Progress</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm sm:text-base",
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
                  className="bg-gray-50 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Volunteer Name */}
            <div className="space-y-2">
              <Label htmlFor="volunteer">Volunteer Name *</Label>
              <Input
                id="volunteer"
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Enter volunteer name"
                className="text-sm sm:text-base"
                disabled={submitting}
                required
              />
            </div>

            {/* Dynamic Sections */}
            {sections.map((section, index) => (
              <Card key={section.id} className="border-2 border-dashed border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-blue-700">Progress Entry {index + 1}</span>
                    </div>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                        className="text-red-600 hover:bg-red-100 p-1 sm:p-2"
                        disabled={submitting}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-0">
                  {/* Students Input */}
                  <div className="space-y-2">
                    <Label>Students Taught *</Label>
                    <div className="relative">
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                        {section.kidsTaught.map((kid, kidIndex) => (
                          <span
                            key={kidIndex}
                            className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2"
                          >
                            <span>{kid}</span>
                            <button
                              type="button"
                              onClick={() => removeKid(section.id, kid)}
                              className="text-blue-600 hover:text-blue-800"
                              disabled={submitting}
                            >
                              <X className="h-2 w-2 sm:h-3 sm:w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Input
                          value={currentKids[section.id] || ''}
                          onChange={(e) => handleKidInput(section.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKid(section.id, currentKids[section.id] || '');
                            }
                          }}
                          placeholder="Type student name"
                          className="flex-1 text-sm sm:text-base"
                          disabled={submitting}
                        />
                        <Button
                          type="button"
                          onClick={() => addKid(section.id, currentKids[section.id] || '')}
                          variant="outline"
                          size="sm"
                          className="px-2 sm:px-3"
                          disabled={submitting}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      {/* Suggestions Dropdown */}
                      {showSuggestions[section.id] && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-32 sm:max-h-40 overflow-y-auto">
                          {suggestions.map((student, suggestionIndex) => (
                            <button
                              key={suggestionIndex}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md text-sm sm:text-base"
                              onClick={() => addKid(section.id, student)}
                              disabled={submitting}
                            >
                              {student}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Input
                      value={section.class}
                      onChange={(e) => updateSection(section.id, 'class', e.target.value)}
                      placeholder="e.g., 4th"
                      className="text-sm sm:text-base"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Topic Taught */}
                  <div className="space-y-2">
                    <Label>Topic Taught *</Label>
                    <Textarea
                      value={section.topicTaught}
                      onChange={(e) => updateSection(section.id, 'topicTaught', e.target.value)}
                      placeholder="Describe the topic covered in today's lesson..."
                      rows={2}
                      className="text-sm sm:text-base"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Homework */}
                  <div className="space-y-2">
                    <Label>Homework Assignment</Label>
                    <Textarea
                      value={section.homework}
                      onChange={(e) => updateSection(section.id, 'homework', e.target.value)}
                      placeholder="Describe homework assignments given..."
                      rows={2}
                      className="text-sm sm:text-base"
                      disabled={submitting}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addSection}
                className="flex items-center justify-center space-x-2 order-2 sm:order-1"
                disabled={submitting}
              >
                <Plus className="h-4 w-4" />
                <span>Add Section</span>
              </Button>
              
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex-1 order-1 sm:order-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Progress Entries'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataEntryForm;
