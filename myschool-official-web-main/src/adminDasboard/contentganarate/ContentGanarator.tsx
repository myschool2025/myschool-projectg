import { useState, useCallback } from "react";

type DocumentTemplate = {
  name: string;
  type: string;
  content: string;
};

const ContentGenerator = () => {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [syllabusContent, setSyllabusContent] = useState("");
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState<"data" | "syllabus" | "templates">("data");
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [processing, setProcessing] = useState(false); // Track ongoing operations
  const apiKey = import.meta.env.VITE_MYSCHOOL_AI_API;

  // Pre-made templates with updated structure
  const documentTemplates: DocumentTemplate[] = [
    {
      name: "Course Syllabus",
      type: "syllabus",
      content: `Course Title: [Insert Course Name]
Instructor: [Instructor Name]
Duration: [Course Duration]

## Course Description
[Brief course overview]

## Learning Objectives
- [Objective 1]
- [Objective 2]
- [Objective 3]`,
    },
    {
      name: "Payment Voucher",
      type: "voucher",
      content: `Voucher Number: [####]
Date: [DD/MM/YYYY]

Payee: [Recipient Name]
Amount: [$$$]
Purpose: [Payment Description]

Authorized Signature: ________________`,
    },
    {
      name: "Student Profile",
      type: "profile",
      content: `Student ID: [####]
Name: [Full Name]
Date of Birth: [DD/MM/YYYY]

Academic Program: [Program Name]
Enrollment Date: [DD/MM/YYYY]

Contact Information:
- Email: [email@domain.com]
- Phone: [###-###-####]`,
    },
    {
      name: "Official Notice",
      type: "notice",
      content: `Date: [DD/MM/YYYY]
To: [Recipient(s)]
From: [Issuing Authority]

Subject: [Notice Subject]

[Detailed notice content...]`,
    },
  ];

  // File upload handler using FileReader
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessing(true);
    const file = e.target.files?.[0];
    if (!file) {
      setProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        if (file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj: any, header: string, idx: number) => {
              obj[header] = values[idx] || '';
              return obj;
            }, {});
          });
          setUploadedData(data);
        } else if (file.name.endsWith('.json')) {
          const parsedData = JSON.parse(text);
          setUploadedData(parsedData);
        }
      } catch (err) {
        console.error('Upload Error:', err);
        alert('Error parsing file. Please ensure it’s a valid CSV or JSON.');
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsText(file);
  }, []);

  // Download handlers
  const downloadFile = useCallback(
    (format: "csv" | "json" | "pdf") => {
      if (!uploadedData) return alert("No data to download!");
      setProcessing(true);

      try {
        if (format === "csv") {
          const csvContent = uploadedData.map((row) => Object.values(row).join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = "data.csv";
          link.click();
          window.URL.revokeObjectURL(url);
        } else if (format === "json") {
          const jsonContent = JSON.stringify(uploadedData, null, 2);
          const blob = new Blob([jsonContent], { type: "application/json" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = "data.json";
          link.click();
          window.URL.revokeObjectURL(url);
        } else if (format === "pdf") {
          exportToPDF(uploadedData, "Uploaded Data", "Data");
        }
      } finally {
        setProcessing(false);
      }
    },
    [uploadedData]
  );

  // PDF Export with image support
  const exportToPDF = useCallback(
    (data: any, title: string, type: string) => {
      setProcessing(true);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const exportDate = new Date().toLocaleDateString();
        let htmlContent = '';

        // Detect image URLs in the content
        const imageUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/gi;
        const images = typeof data === 'string' ? data.match(imageUrlRegex) : [];
        const imageHtml = images ? images.map(url => `<img src="${url}" alt="Document Image" class="max-w-full h-auto my-4" />`).join('') : '';

        if (type === "Data" && data) {
          const headers = Object.keys(data[0] || {});
          htmlContent = `
            <div class="container mx-auto max-w-5xl">
              <div class="header text-center mb-8 border-b-2 border-blue-500 pb-4">
                <h1 class="text-3xl font-bold text-gray-800">MySchool - ${title}</h1>
              </div>
              <div class="stats bg-gray-100 p-4 rounded-lg mb-6 flex justify-between text-sm">
                <span>Total Items: ${data.length}</span>
                <span>Exported on: ${exportDate}</span>
              </div>
              <table class="w-full border-collapse shadow-lg">
                <thead>
                  <tr class="bg-blue-500 text-white">
                    ${headers.map(header => `<th class="border p-3 font-bold">${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map((row: any) => `
                    <tr class="hover:bg-gray-100 even:bg-gray-50">
                      ${headers.map(header => `<td class="border p-3">${row[header] || '-'}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${imageHtml}
              <div class="footer mt-6 text-center text-gray-500 text-sm">
                Generated by MySchool Official Website • https://myschool-official.netlify.app
              </div>
            </div>
          `;
        } else {
          htmlContent = `
            <div class="container mx-auto max-w-5xl">
              <div class="header text-center mb-8 border-b-2 border-blue-500 pb-4">
                <h1 class="text-3xl font-bold text-gray-800">MySchool - ${title}</h1>
              </div>
              <div class="content p-4 bg-gray-100 rounded-lg mb-6 whitespace-pre-wrap">
                ${data || 'No content available.'}
              </div>
              ${imageHtml}
              <div class="footer mt-6 text-center text-gray-500 text-sm">
                Generated by MySchool Official Website • https://myschool-official.netlify.app
              </div>
            </div>
          `;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>MySchool - ${title}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print { @page { margin: 2cm; } }
                body { margin: 0; padding: 20px; color: #333; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      setProcessing(false);
    },
    []
  );

  // AI Content Generation with improved prompt
  const generateAIContent = useCallback(async () => {
    setProcessing(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'MySchool Academic System',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it:free',
          messages: [
            {
              role: 'system',
              content: 'You are an assistant generating professional academic content in English. Follow the user’s input language and context, and structure the response to match the provided template format. Do not add extra text beyond the requested content.',
            },
            {
              role: 'user',
              content: `Generate a professional syllabus for a 10-week course based on the following template:\nCourse Title: [Insert Course Name]\nInstructor: [Instructor Name]\nDuration: [Course Duration]\n\n## Course Description\n[Brief course overview]\n\n## Learning Objectives\n- [Objective 1]\n- [Objective 2]\n- [Objective 3]\n\nCurrent content:\n${syllabusContent}`,
            },
          ],
        }),
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No content generated.';
      setAiGeneratedContent(content);
      setSyllabusContent(content);
    } catch (error) {
      console.error('AI Error:', error);
      setAiGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [apiKey, syllabusContent]);

  // Template handling
  const handleTemplateSelect = useCallback((template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setSyllabusContent(template.content);
    setActiveTab("syllabus");
  }, []);

  // Data table rendering
  const renderDataTable = () => {
    if (!uploadedData || uploadedData.length === 0)
      return <p className="text-gray-500">No data uploaded yet.</p>;

    const headers = Object.keys(uploadedData[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="p-3 text-left text-sm font-semibold text-gray-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {uploadedData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {Object.values(row).map((value: any, j) => (
                  <td key={j} className="p-3 text-sm text-gray-600">
                    {value || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
          MySchool Suite
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg">Comprehensive Management Solution</p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap space-x-2 sm:space-x-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab("data")}
          disabled={processing}
          className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base ${activeTab === "data"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📊 Data Management
        </button>
        <button
          onClick={() => setActiveTab("syllabus")}
          disabled={processing}
          className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base ${activeTab === "syllabus"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📚 Document Creator
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          disabled={processing}
          className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base ${activeTab === "templates"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          🗂️ Templates
        </button>
      </div>

      {/* Data Management Tab */}
      {activeTab === "data" && (
        <div className="space-y-8">
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">📁 Upload Data</h2>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={processing}
              className={`w-full sm:w-auto text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {uploadedData && (
            <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-semibold">📈 Data Preview</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadFile("csv")}
                    disabled={processing}
                    className={`px-3 sm:px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => downloadFile("json")}
                    disabled={processing}
                    className={`px-3 sm:px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => downloadFile("pdf")}
                    disabled={processing}
                    className={`px-3 sm:px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              {renderDataTable()}
            </div>
          )}
        </div>
      )}

      {/* Document Creator Tab */}
      {activeTab === "syllabus" && (
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">📝 Document Editor</h2>
            <button
              onClick={() => exportToPDF(syllabusContent, selectedTemplate?.name || "Document", "Syllabus")}
              disabled={processing}
              className={`px-3 sm:px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Download PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <textarea
                value={syllabusContent}
                onChange={(e) => setSyllabusContent(e.target.value)}
                disabled={processing}
                className={`w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Start typing or select a template..."
              />
              <button
                onClick={generateAIContent}
                disabled={processing}
                className={`px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:opacity-90 text-sm sm:text-base ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing ? 'Processing...' : '✨ Enhance with AI'}
              </button>
            </div>

            {aiGeneratedContent && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-600">
                    AI Suggestions
                  </span>
                  <button
                    onClick={() => {
                      setSyllabusContent(aiGeneratedContent);
                      setAiGeneratedContent("");
                    }}
                    disabled={processing}
                    className={`text-blue-500 hover:text-blue-600 text-sm ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Apply All
                  </button>
                </div>
                <div className="prose max-w-none text-gray-700 text-sm sm:text-base">
                  {aiGeneratedContent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">📑 Document Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {documentTemplates.map((template) => (
              <div
                key={template.type}
                onClick={() => !processing && handleTemplateSelect(template)}
                className={`p-4 sm:p-6 border rounded-lg hover:border-blue-200 transition-colors cursor-pointer group ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                    <span className="text-xl">📄</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{template.name}</h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default ContentGenerator;