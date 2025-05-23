import ColorPalleteCard from '@/app/design/colorPalleteCard';
import { ComponentOutput } from '@/app/design/designAgent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaClipboard, FaSpinner } from 'react-icons/fa';
import { cacheUtils } from '@/app/cache';
import { Button } from './button';
import { saEvent } from '@/app/analytics';
import { useState } from 'react';

function HtmlRenderer({ htmlContent, cssContent }: { htmlContent: string, cssContent: string }) {
    return (
        <div>
            <iframe
                srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      min-width: 250px;
                      min-height: 250px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    ${cssContent}
                  </style>
                </head>
                <body>
                  ${htmlContent}
                </body>
              </html>
            `}
                className="w-full h-full flex items-center justify-center min-h-[400px] min-w-[400px] border-0 rounded-md"
                title="Component Preview"
            />
        </div>
    );
}

export const GeneratedComponent = ({ id, generatedComponent, onCopyToClipboard }: { id: string, generatedComponent: ComponentOutput, onCopyToClipboard: (clipboardData: string) => void }) => {
    
    const [isLoading, setIsLoading] = useState(false);

    return <div className="w-full h-full mb-2 border border-gray-300 rounded-md bg-gray-50">
        <div className="w-full overflow-y-auto h-full p-1">
            <Tabs defaultValue="preview" className="w-full h-full">
                <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                    <HtmlRenderer htmlContent={generatedComponent._metadata.html} cssContent={generatedComponent._metadata.css} />
                </TabsContent>
                <TabsContent value="colors">
                    <div className="py-4 px-4">
                        <h3 className="text-lg font-bold mb-2">Color Palette</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedComponent._metadata.colorDetails.map((color, index) => (
                                <ColorPalleteCard key={index} color={color} />
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="css">
                    <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre">
                        {generatedComponent._metadata.css}
                    </pre>
                </TabsContent>
                <TabsContent value="html">
                    <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre">
                        {generatedComponent._metadata.html}
                    </pre>
                </TabsContent>
            </Tabs>
        </div>
        <div className='flex items-center justify-center p-3 border-t border-gray-200'>
            <Button
                disabled={isLoading}
                onClick={async () => {
                    setIsLoading(true);
                    saEvent('copy_to_figma_button_clicked');
                    const cacheKey = `generatedComponent-${id}`;

                    if (cacheUtils.has(cacheKey)) {
                        onCopyToClipboard(cacheUtils.get(cacheKey));
                        return;
                    }

                    try {
                        // Call the codeToDesign function with the HTML and CSS data
                        const response = await fetch('/api/copy', {
                            method: 'POST',
                            body: JSON.stringify({
                                html: generatedComponent?._metadata.html,
                                css: generatedComponent?._metadata.css
                            })
                        });

                        const { clipboardDataFromAPI } = await response.json();
                        cacheUtils.set(cacheKey, clipboardDataFromAPI);
                        onCopyToClipboard(clipboardDataFromAPI);

                    } catch (error) {
                        console.error('Error copying to Figma:', error);
                        alert('Failed to copy component to Figma. Please try again.');
                    } finally {
                        setIsLoading(false);
                    }
                }}
                className="py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
            >
                <div className='flex items-center gap-2'>
                    {isLoading ? <FaSpinner className='animate-spin' /> : <FaClipboard />}
                    <span>Copy to Figma</span>
                </div>
            </Button>
        </div>
    </div>
}