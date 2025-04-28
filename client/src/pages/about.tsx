import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">About Us</h2>
        <p className="text-neutral-600">Learn more about CollegeConnect and our mission.</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About CollegeConnect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                CollegeConnect is a comprehensive student and faculty management system designed to streamline
                academic processes and enhance communication between students and faculty members.
              </p>
              
              <h3 className="text-lg font-semibold mt-4">Our Mission</h3>
              <p>
                Our mission is to create a seamless digital environment where students and faculty can
                efficiently manage their academic responsibilities, track attendance, access course materials,
                and stay informed about college events.
              </p>
              
              <h3 className="text-lg font-semibold mt-4">Key Features</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Department and subject management for students</li>
                <li>Course management and note uploads for faculty</li>
                <li>QR code-based attendance tracking</li>
                <li>Event creation and management</li>
                <li>Real-time notifications for important updates</li>
                <li>Comprehensive attendance reporting</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>For Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  CollegeConnect helps students stay organized and on top of their academic responsibilities.
                  With features tailored specifically for students, you can:
                </p>
                
                <ul className="list-disc pl-5 space-y-1">
                  <li>View and manage your department and subject information</li>
                  <li>Track your attendance across all subjects</li>
                  <li>Access course materials and notes uploaded by faculty</li>
                  <li>Mark your attendance via QR code scanning</li>
                  <li>Stay updated on college events and activities</li>
                  <li>Receive notifications for important announcements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>For Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  CollegeConnect provides faculty members with powerful tools to efficiently manage their
                  teaching responsibilities and student interactions:
                </p>
                
                <ul className="list-disc pl-5 space-y-1">
                  <li>Create and manage courses with detailed information</li>
                  <li>Upload and organize course materials for students</li>
                  <li>Create and manage timetables for your courses</li>
                  <li>Generate QR codes for efficient attendance tracking</li>
                  <li>Create and publish events for students</li>
                  <li>View detailed attendance reports and analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                For any inquiries, support, or feedback regarding CollegeConnect, please reach out to us:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold">Email</h4>
                  <p>support@collegeconnect.edu</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Technical Support</h4>
                  <p>techsupport@collegeconnect.edu</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Office Hours</h4>
                  <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
