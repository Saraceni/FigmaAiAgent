import { Message } from 'ai';
import Image from 'next/image';


export const UserCard = ({ message }: { message: { id: string, content: string, experimental_attachments?: any[] } }) => {
    return <div className='w-full flex justify-end items-end'>
        <div className='flex justify-end items-end bg-[#13628ce8] rounded-md p-4 w-auto'>
            <div className="font-afacad text-lg text-end text-white">{message.content}</div>
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
    </div>
}