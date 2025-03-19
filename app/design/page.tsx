"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import TextArea from "@/components/ui/textArea";
import ColorPalleteCard from "./colorPalleteCard";


// I need to call the api/design/route.ts

interface ComponentOutput {
  html: string;
  css: string;
  colorDetails: {
    hex: string;
    usage: string;
  }[];
  stylingNotes: string;
}

const designAgent = {
  generateComponent: async (prompt: string, constraints: any) => {
    const response = await fetch('/api/design', {
      method: 'POST',
      body: JSON.stringify({ userRequest: prompt, constraints }),
    });
    return response.json();
  }
}

function HtmlRenderer({ htmlContent, cssContent }: { htmlContent: string, cssContent: string }) {
  return (
    <div className="p-4 h-full h-min-[600px]">
      <iframe
        srcDoc={`
          <!DOCTYPE html>
          <html>
            <head>
              <style>${cssContent}</style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `}
        className="w-full h-full min-h-[400px] border-0 rounded-md"
        title="Component Preview"
      />
    </div>
  );
}
// React component example
export default function DesignComponentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedComponent, setGeneratedComponent] = useState<ComponentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setError(false);
    try {
      const result = await designAgent.generateComponent(prompt, {
        colorPalette: ['#3B82F6', '#1E3A8A', '#FFFFFF', '#F3F4F6'],
      });
      setGeneratedComponent(result);
      setIsLoading(false);
    } catch (error) {
      setError(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-[#F3F4F6]">
      <div className="flex items-center w-full justify-center" style={{ alignItems: !!generatedComponent ? 'start' : 'center' }}>
        <div className="flex flex-col items-start justify-center w-full max-w-md p-4">
          <h1 className="text-2xl font-bold mb-2">New Design</h1>
          <TextArea className="flex-shrink-0 w-full max-w-md min-h-40 p-2" value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the component you want to create..." />
          <Button className="mt-4" disabled={isLoading} onClick={handleGenerate}>
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : 'Generate Component'}
          </Button>
          {error && <div className="mt-4">Error</div>}
        </div>
        {generatedComponent && <div className="w-full overflow-hidden border-l px-2 ml-4 h-screen">
          <div className="w-full overflow-y-auto h-full py-2">
            <Tabs defaultValue="preview" className="w-full h-full">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <HtmlRenderer htmlContent={generatedComponent.html} cssContent={generatedComponent.css} />
              </TabsContent>
              <TabsContent value="colors">
                <div className="py-4 px-4">
                  <h3 className="text-lg font-bold mb-2">Color Palette</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedComponent.colorDetails.map((color, index) => (
                      <ColorPalleteCard key={index} color={color} />
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Design Notes</h3>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {generatedComponent.stylingNotes.split('\n').map((paragraph, index) => (
                        paragraph.trim() ? (
                          <p key={index} className="mb-2">
                            {paragraph}
                          </p>
                        ) : null
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="css">
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre">
                  {generatedComponent.css}
                </pre>
              </TabsContent>
              <TabsContent value="html">
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre">
                  {generatedComponent.html}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        }
      </div>
    </div>
  );
}
