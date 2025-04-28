import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description?: string;
    location: string;
    startDate: string | Date;
    endDate: string | Date;
  }
}

export default function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const month = format(startDate, 'MMM').toUpperCase();
  const day = format(startDate, 'd');
  
  return (
    <div className="border-b border-neutral-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex">
        <div className="flex-shrink-0 bg-accent-light bg-opacity-10 rounded-lg p-3 mr-3 text-center">
          <span className="block text-lg font-bold text-accent">{day}</span>
          <span className="block text-xs text-accent">{month}</span>
        </div>
        <div>
          <h4 className="font-medium text-neutral-800">{event.title}</h4>
          <p className="text-sm text-neutral-600 mb-1">{event.location}</p>
          <div className="flex items-center text-sm text-neutral-500">
            <span className="material-icons text-xs mr-1">schedule</span>
            <span>
              {format(startDate, 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
            </span>
          </div>
          {event.description && (
            <p className="text-sm text-neutral-600 mt-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
