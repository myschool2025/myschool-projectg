
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Search,
  Link as LinkIcon,
  Filter
} from "lucide-react";

// Mock Resources Data
const resourcesData = {
  books: [
    { id: 1, title: 'Mathematics Textbook', subject: 'Mathematics', class: 'Class 9', type: 'PDF', size: '15.2 MB', url: '#' },
    { id: 2, title: 'Physics Fundamentals', subject: 'Physics', class: 'Class 9', type: 'PDF', size: '12.8 MB', url: '#' },
    { id: 3, title: 'English Literature', subject: 'English', class: 'Class 9', type: 'PDF', size: '10.5 MB', url: '#' },
    { id: 4, title: 'History of Bangladesh', subject: 'History', class: 'Class 9', type: 'PDF', size: '14.3 MB', url: '#' },
  ],
  notes: [
    { id: 1, title: 'Algebra Formulas', subject: 'Mathematics', class: 'Class 9', type: 'PDF', size: '2.4 MB', url: '#' },
    { id: 2, title: 'Chemistry Lab Notes', subject: 'Chemistry', class: 'Class 9', type: 'PDF', size: '3.7 MB', url: '#' },
    { id: 3, title: 'Grammar Rules', subject: 'English', class: 'Class 9', type: 'DOCX', size: '1.8 MB', url: '#' },
    { id: 4, title: 'Biology Diagrams', subject: 'Biology', class: 'Class 9', type: 'PDF', size: '5.2 MB', url: '#' },
  ],
  videos: [
    { id: 1, title: 'Introduction to Calculus', subject: 'Mathematics', class: 'Class 9', duration: '45:20', url: '#' },
    { id: 2, title: 'Chemical Reactions', subject: 'Chemistry', class: 'Class 9', duration: '32:15', url: '#' },
    { id: 3, title: 'Photosynthesis Process', subject: 'Biology', class: 'Class 9', duration: '28:40', url: '#' },
    { id: 4, title: 'Sentence Structure', subject: 'English', class: 'Class 9', duration: '22:30', url: '#' },
  ]
};

const StudentResourcesCard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filterResources = (resources: any[]) => {
    if (!searchTerm) return resources;
    return resources.filter(resource => 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Resource Item Component
  const ResourceItem = ({ item, type }: { item: any, type: string }) => {
    return (
      <motion.div 
        variants={itemVariants}
        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2 mt-1">
              {type === 'books' && <BookOpen className="h-4 w-4 text-blue-600" />}
              {type === 'notes' && <FileText className="h-4 w-4 text-blue-600" />}
              {type === 'videos' && <Video className="h-4 w-4 text-blue-600" />}
            </div>
            <div>
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.subject} • {item.class}</p>
              {type === 'videos' ? (
                <p className="text-xs text-gray-400 mt-1">Duration: {item.duration}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">{item.type} • {item.size}</p>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
            {type === 'videos' ? <LinkIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>Learning Resources</CardTitle>
          <CardDescription>
            Access study materials, notes, and educational videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="books">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="books" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Books</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Videos</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="books" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filterResources(resourcesData.books).map(book => (
                <ResourceItem key={book.id} item={book} type="books" />
              ))}
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filterResources(resourcesData.notes).map(note => (
                <ResourceItem key={note.id} item={note} type="notes" />
              ))}
            </TabsContent>
            
            <TabsContent value="videos" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filterResources(resourcesData.videos).map(video => (
                <ResourceItem key={video.id} item={video} type="videos" />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentResourcesCard;
