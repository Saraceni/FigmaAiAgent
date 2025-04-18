import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import { PiCoffeeFill } from "react-icons/pi";
import { MdImageSearch, MdWeb } from "react-icons/md";
import Image from 'next/image';
import ColorPalleteCard from '@/app/design/colorPalleteCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComponentOutput } from '@/app/design/designAgent';
import { ComponentInChatHistory } from '@/app/page';

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

// Hey, can you create a modern product card for my online store using blue (#3A5199) for buttons, yellow (#F8C630) for highlights, and white background with dark text? Include a product image, name, price, star rating, "Add to Cart" button, and save icon. Make it clean with rounded corners and subtle hover effects, and ensure it's responsive for mobile. Thanks!
export const BotCard = ({ message, componentOutput = undefined }: { message: Message, componentOutput?: ComponentInChatHistory }) => {

  const LinkRenderer = (props: any) => {
    return (
      <a className='text-blue-500 font-bold underline' href={props.href} target="_blank" rel="noreferrer">
        {props.children}
      </a>
    );
  }

  const ImageRenderer = (props: any) => {
    return (
      <img src={props.src} alt={props.alt} className='w-full max-h-[400px] md:max-h-[500px] object-contain cursor-pointer hover:outline hover:outline-2 hover:outline-black' onClick={() => window.open(props.src, '_blank')} />
    );
  }

  const renderGeneratedComponent = () => {
    let generatedComponent: ComponentOutput | undefined = undefined;
    if (componentOutput) {
      generatedComponent = {
        _metadata: {
          html: componentOutput.html,
          css: componentOutput.css,
          colorDetails: componentOutput.colorDetails
        },
        stylingNotes: componentOutput.stylingNotes
      }
    } else if (message?.parts?.length) {
      if (message?.parts?.length) {
        for (var i = 0; i < message.parts.length; i++) {
          const part = message.parts[i]
          if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result' && part.toolInvocation.toolName === 'createWebComponent') {
            generatedComponent = part.toolInvocation.result as ComponentOutput
            break
          }
        }
      }
    }


    // Add an explicit type guard here
    if (generatedComponent) {
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
                {/* <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                </div> */}
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
      </div>
    } else {
      return null;
    }
  }

  return <div className='bg-gray-200/90 rounded-md p-4 border border-gray-300 overflow-x-auto'>
    <div className="flex items-center mb-2">
      <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center"><Image src='/avatar.png' alt='logo' width={32} height={32} /></div>
      <div className="font-bold">AI</div>
    </div>

    {/* Display all message parts */}
    {renderGeneratedComponent()}

    <ReactMarkdown className="font-afacad" components={{ a: LinkRenderer, img: ImageRenderer }}>{message.content}</ReactMarkdown>

    {/* Tool invocation messages */}
    {!!message?.parts?.length && message.parts.some(part => part.type === 'tool-invocation' && part.toolInvocation.state !== 'result' && part.toolInvocation.toolName === 'searchFigmaDocs') && <div className='flex items-center space-x-2'>
      <span className="italic font-light font-afacad text-lg">Let me get back to you with the answer while I drink my coffee and read the documentation of Figma...</span><PiCoffeeFill className='flex-shrink-0' color='black' />
    </div>}
    {!!message?.parts?.length && message.parts.some(part => part.type === 'tool-invocation' && part.toolInvocation.state !== 'result' && part.toolInvocation.toolName === 'createWebComponent') && <div className='flex items-center space-x-2'>
      <span className="italic font-light font-afacad text-lg">Let me create the web component for you...</span><MdWeb className='flex-shrink-0' color='black' />
    </div>}
    {!!message?.parts?.length && message.parts.some(part => part.type === 'tool-invocation' && part.toolInvocation.state !== 'result' && part.toolInvocation.toolName === 'getImagesFromPexels') && <div className='flex items-center space-x-2'>
      <span className="italic font-light font-afacad text-lg">Let me search for images for you...</span><MdImageSearch className='flex-shrink-0' color='black' />
    </div>}



    {/* Display attachments */}
    <div>
      {message?.experimental_attachments
        ?.filter(attachment =>
          attachment?.contentType?.startsWith('image/'),
        )
        .map((attachment, index) => {
          if (attachment?.contentType?.startsWith('image/')) {
            return <Image
              key={`${message.id}-${index}`}
              src={attachment.url}
              width={500}
              height={500}
              alt={attachment.name ?? `attachment-${index}`}
            />
          } else {
            return <div key={`${message.id}-${index}`} className='w-[500px] h-[500px] bg-gray-200'>{attachment.name}</div>
          }
        })}
    </div>
  </div>
}