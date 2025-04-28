import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function StudentEvents() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch all events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Filter events by date
  const selectedDateEvents = eventsData?.events?.filter((event: any) => {
    if (!date) return false;
    const eventDate = new Date(event.startDate);
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  });
  
  // Get dates with events for calendar highlighting
  const eventDates = eventsData?.events?.map((event: any) => new Date(event.startDate)) || [];
  
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Events</h2>
        <p className="text-neutral-600">View upcoming seminars, workshops, and college events.</p>
      </div>
      
      <Tabs defaultValue="calendar">
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  modifiers={{
                    event: eventDates,
                  }}
                  modifiersClassNames={{
                    event: "bg-primary text-primary-foreground",
                  }}
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">
                  {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                </h3>
                
                <div className="space-y-4">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                        <div className="flex mb-2">
                          <div className="w-12 h-14 bg-neutral-200 rounded-lg mr-3"></div>
                          <div className="flex-1">
                            <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : selectedDateEvents?.length > 0 ? (
                    selectedDateEvents.map((event: any) => (
                      <div key={event.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 bg-primary-light bg-opacity-10 rounded-lg p-3 mr-3 text-center">
                            <span className="block text-lg font-bold text-primary">
                              {format(new Date(event.startDate), 'd')}
                            </span>
                            <span className="block text-xs text-primary">
                              {format(new Date(event.startDate), 'MMM')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-800">{event.title}</h4>
                            <p className="text-sm text-neutral-600 mb-1">{event.location}</p>
                            <div className="flex items-center text-sm text-neutral-500">
                              <span className="material-icons text-xs mr-1">schedule</span>
                              <span>
                                {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-neutral-600 mt-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <span className="material-icons text-4xl mb-2">event_busy</span>
                      <p>No events scheduled for this date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Upcoming Events</h3>
              
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="border-b border-neutral-200 pb-4 mb-4 animate-pulse">
                    <div className="flex">
                      <div className="w-12 h-14 bg-neutral-200 rounded-lg mr-3"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : eventsData?.events?.length > 0 ? (
                eventsData.events
                  .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((event: any) => (
                    <div key={event.id} className="border-b border-neutral-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex">
                        <div className="flex-shrink-0 bg-primary-light bg-opacity-10 rounded-lg p-3 mr-3 text-center">
                          <span className="block text-lg font-bold text-primary">
                            {format(new Date(event.startDate), 'd')}
                          </span>
                          <span className="block text-xs text-primary">
                            {format(new Date(event.startDate), 'MMM')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <h4 className="font-medium text-neutral-800 mr-2">{event.title}</h4>
                            {new Date(event.startDate) < new Date() ? (
                              <Badge variant="outline" className="text-neutral-500">Past</Badge>
                            ) : new Date(event.startDate).toDateString() === new Date().toDateString() ? (
                              <Badge className="bg-green-500">Today</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-neutral-600 mb-1">{event.location}</p>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-xs mr-1">schedule</span>
                            <span>
                              {format(new Date(event.startDate), 'PPP')} · {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-neutral-600 mt-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <span className="material-icons text-4xl mb-2">event_busy</span>
                  <p>No upcoming events found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
