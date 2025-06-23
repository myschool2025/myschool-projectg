import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, Settings, UserCheck, CheckCircle } from 'lucide-react';
import classesData from '@/lib/classes.json';

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const FeeManagementTour = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">ফি ম্যানেজমেন্ট গাইড</h1>
          <p className="text-lg text-gray-600 mt-2">
            আমাদের নতুন ফি ম্যানেজমেন্ট সিস্টেম কীভাবে ব্যবহার করবেন তার একটি সম্পূর্ণ গাইড।
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign />
              ভূমিকা
            </CardTitle>
            <CardDescription>
              এই সিস্টেমটি তিনটি প্রধান অংশে বিভক্ত: ফি সেটিংস, কাস্টম ছাত্র ফি, এবং ফি সংগ্রহ। এই তিনটি অংশ একসাথে কাজ করে আপনার প্রতিষ্ঠানের ফি ব্যবস্থাপনাকে সহজ ও স্বয়ংক্রিয় করে তোলে।
            </CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <Settings className="text-blue-500" />
                <span className="font-semibold text-lg">ধাপ ১: ফি সেটিংস (Fee Settings)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-10 text-gray-700">
              <p className="mb-4">
                এখানে আপনি আপনার প্রতিষ্ঠানের জন্য সব ধরনের সাধারণ ফি কাঠামো তৈরি করবেন। যেমন - মাসিক বেতন, পরিবহন ফি, বইয়ের ফি ইত্যাদি।
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Fee Type:</strong> ফির ধরণ নির্দিষ্ট করুন (যেমন: `monthly_fee`, `transport_fee`)। এটি সিস্টেমকে ফি সনাক্ত করতে সাহায্য করে।</li>
                <li><strong>Description:</strong> ফির একটি সহজবোধ্য বিবরণ দিন (যেমন: "মাসিক বেতন", "পরিবহন খরচ")।</li>
                <li><strong>Class:</strong> যদি ফি কোনো নির্দিষ্ট ক্লাসের জন্য হয়, তাহলে সেটি নির্বাচন করুন। খালি রাখলে এটি সব ক্লাসের জন্য প্রযোজ্য হবে।</li>
                <li><strong>Amount:</strong> ফির পরিমাণ নির্ধারণ করুন।</li>
                <li><strong>Active From/To:</strong> কোন তারিখ থেকে কোন তারিখ পর্যন্ত এই ফি কাঠামো সক্রিয় থাকবে তা নির্ধারণ করুন।</li>
                <li><strong>Can Override:</strong> এই অপশনটি চালু রাখলে, নির্দিষ্ট ছাত্রের জন্য এই ফির পরিমাণ পরিবর্তন করার সুযোগ থাকবে।</li>
              </ul>
              <p className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <strong>গুরুত্বপূর্ণ:</strong> প্রথমে এখানে সব সাধারণ ফি কাঠামো তৈরি করে নিন। এটিই আপনার ফি ব্যবস্থাপনার ভিত্তি।
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <UserCheck className="text-purple-500" />
                <span className="font-semibold text-lg">ধাপ ২: কাস্টম ছাত্র ফি (Custom Student Fees)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-10 text-gray-700">
              <p className="mb-4">
                অনেক সময় নির্দিষ্ট কোনো ছাত্রের জন্য ফির পরিমাণ ভিন্ন হতে পারে (যেমন - বিশেষ ছাড়)। এই সেকশনে আপনি সেই কাজটি করতে পারবেন।
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Search Student:</strong> ছাত্রের আইডি দিয়ে সার্চ করে নির্দিষ্ট ছাত্রকে খুঁজুন।</li>
                <li><strong>Select a fee setting:</strong> যে ফি-টি পরিবর্তন করতে চান, সেটি ড্রপডাউন থেকে বেছে নিন। (যেমন: মাসিক বেতন)।</li>
                <li><strong>New Amount:</strong> ছাত্রের জন্য নতুন ফির পরিমাণ লিখুন।</li>
                <li><strong>Reason:</strong> কী কারণে এই পরিবর্তন, তার একটি সংক্ষিপ্ত ব্যাখ্যা দিন (যেমন: "ভাইবোন ছাড়", "বৃত্তি")।</li>
                <li><strong>Is Active:</strong> এই কাস্টম ফি সক্রিয় রাখতে এটি চেক করুন।</li>
              </ul>
              <p className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <strong>মনে রাখবেন:</strong> শুধুমাত্র যে ফি-গুলোর জন্য "Can Override" অপশনটি চালু করা আছে, সেগুলোই এখানে পরিবর্তন করা যাবে।
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" />
                <span className="font-semibold text-lg">ধাপ ৩: ফি সংগ্রহ (Fee Collection)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-10 text-gray-700">
              <p className="mb-4">
                এটি হলো अंतिम ধাপ যেখানে আপনি ছাত্রদের কাছ থেকে ফি সংগ্রহ করবেন এবং তার রেকর্ড রাখবেন।
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>ছাত্র নির্বাচন:</strong> প্রথমে ছাত্রের আইডি দিয়ে সার্চ করে তাকে নির্বাচন করুন।</li>
                <li><strong>ফি বিশ্লেষণ দেখা:</strong> ছাত্রকে নির্বাচন করার সাথে সাথে আপনি তার সকল ফির একটি তালিকা দেখতে পাবেন, যেখানে দেখানো হবে কোন ফি কত টাকা, কত পরিশোধ করা হয়েছে এবং কত বাকি আছে।</li>
                <li><strong>ফি সংগ্রহ করুন:</strong> যে ফি-টি সংগ্রহ করতে চান, তার পাশে "Collect Fee" বাটনে ক্লিক করুন।</li>
                <li><strong>পরিমাণ ও মাধ্যম:</strong> কত টাকা নিচ্ছেন এবং কী মাধ্যমে (ক্যাশ, মোবাইল ব্যাংকিং) নিচ্ছেন তা লিখুন।</li>
                <li><strong>সংরক্ষণ:</strong> "Collect & Record" বাটনে ক্লিক করে তথ্য সংরক্ষণ করুন। সিস্টেম স্বয়ংক্রিয়ভাবে ছাত্রের পরিশোধিত ফির হিসাব আপডেট করে দেবে।</li>
              </ol>
              <p className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <strong>স্বয়ংক্রিয় হিসাব:</strong> এই প্রক্রিয়ার মাধ্যমে, কোনো ছাত্রের বকেয়া এবং পরিশোধিত ফির হিসাব সবসময় আপ-টু-ডেট থাকবে, যা আপনার কাজকে অনেক সহজ করে দেবে।
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default FeeManagementTour; 