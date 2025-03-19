import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check } from 'lucide-react';
import { useState } from "react";

export default function ColorPalleteCard({ color }: { color: { hex: string, usage: string } }) {

    const [copied, setCopied] = useState(false);

    const copyToClipboard = (colorHex: string) => {
        navigator.clipboard.writeText(colorHex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-[400px] rounded-lg overflow-hidden shadow-md bg-white">
            <div className="relative h-[200px] flex items-end transition-all duration-300 ease-in-out" style={{ backgroundColor: color.hex }}>
                <div className="bg-white w-full p-4 rounded-tl-lg rounded-tr-lg border-t border-l border-r border-gray-200">
                    <div className="relative inline-block mb-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <button className="bg-gray-100 text-black font-mono font-semibold py-2 px-4 rounded border-0 cursor-pointer relative transition-all duration-200 ease-in-out text-base hover:bg-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" data-color={color.hex} aria-label={`Copy color code ${color.hex}`} onClick={() => copyToClipboard(color.hex)}>
                                        {color.hex}
                                        {/* <span className="tooltip">Click to copy</span> */}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Click to copy</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {copied && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-blue-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap mb-2 font-sans font-normal">
                            Copied!
                          </div>
                        )}
                    </div>
                    <div className="m-0 text-black text-sm leading-normal">{color.usage}</div>
                </div>
            </div>
        </div>
    )
}