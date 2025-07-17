
export interface ProgressEntry {
  id: string;
  date: Date;
  day: string;
  volunteerName: string;
  kidsTaught: string[];
  class: string;
  topicTaught: string;
  homework: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  studentName: string;
  className: string;
  volunteerName: string;
}
