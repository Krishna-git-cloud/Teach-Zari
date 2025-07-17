
import React from 'react';
import { Search, Users, GraduationCap, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilters } from '@/types/progressEntry';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  availableClasses: string[];
  availableVolunteers: string[];
  suggestions: string[];
  showSuggestions: boolean;
  onSelectSuggestion: (suggestion: string) => void;
}

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableClasses,
  availableVolunteers
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-indigo-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Search & Filter Records</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Student Name Search */}
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student name..."
            value={filters.studentName}
            onChange={(e) => onFiltersChange({ ...filters, studentName: e.target.value })}
            className="flex-1"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-4 w-4 text-gray-400" />
          <Select
            value={filters.className}
            onValueChange={(value) => onFiltersChange({ ...filters, className: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Volunteer Filter */}
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <Select
            value={filters.volunteerName}
            onValueChange={(value) => onFiltersChange({ ...filters, volunteerName: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by volunteer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Volunteers</SelectItem>
              {availableVolunteers.map((volunteer) => (
                <SelectItem key={volunteer} value={volunteer}>
                  {volunteer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {(filters.studentName || filters.className || filters.volunteerName) && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFiltersComponent;
