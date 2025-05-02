import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { departments, years } from "@/lib/utils";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description?: string;
    location: string;
    startDate: string | Date;
    endDate: string | Date;
    facultyId?: number;
    departmentId?: number;
    year?: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSameDay = 
    startDate.getDate() === endDate.getDate() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  // Get department and year labels if available
  const departmentLabel = event.departmentId 
    ? departments.find(d => d.value === event.departmentId?.toString())?.label || "All Departments" 
    : "All Departments";
  
  const yearLabel = event.year 
    ? years.find(y => y.value === event.year)?.label || "All Years" 
    : "All Years";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex border-b">
          <div className="bg-primary text-primary-foreground p-3 text-center flex flex-col justify-center min-w-16">
            <div className="text-lg font-semibold">{format(startDate, 'dd')}</div>
            <div className="text-sm">{format(startDate, 'MMM')}</div>
          </div>
          <div className="p-4 flex-1">
            <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
            <div className="flex items-center text-sm text-neutral-600 mb-1">
              <span className="material-icons text-base mr-1">location_on</span>
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <span className="material-icons text-base mr-1">schedule</span>
              <span>
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                {!isSameDay && ` (${format(endDate, 'MMM dd')})`}
              </span>
            </div>
            {event.description && (
              <p className="text-sm mt-2 text-neutral-700">{event.description}</p>
            )}
          </div>
        </div>
        <div className="px-4 py-2 bg-neutral-50 text-sm flex justify-between">
          <div>
            <span className="text-neutral-500">For:</span> {departmentLabel}
          </div>
          <div>
            <span className="text-neutral-500">Year:</span> {yearLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}