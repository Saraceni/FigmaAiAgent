import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import { PiCoffeeFill } from "react-icons/pi";
import Image from 'next/image';

export const BotCard = ({ message }: { message: Message }) => {

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

    return <div className='bg-gray-200/90 rounded-md p-4 border border-gray-300 overflow-x-auto'>
        <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center"><Image src='/bot_icon.png' alt='logo' width={32} height={32} /></div>
            <div className="font-bold">AI</div>
        </div>
        <ReactMarkdown className="font-afacad" components={{ a: LinkRenderer, img: ImageRenderer }}>{message.content}</ReactMarkdown>
        {!!message?.toolInvocations?.length && message.toolInvocations.some(toolInvocation => toolInvocation.toolName === 'searchFigmaDocs') && message.content.length === 0 && <div className='flex items-center space-x-2'>
            <span className="italic font-light font-afacad text-lg">Let me get back to you with the answer while I drink my coffee and read the documentation of Figma...</span><PiCoffeeFill className='flex-shrink-0' color='black' />
        </div>}
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