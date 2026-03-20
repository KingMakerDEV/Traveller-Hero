import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  tripTitle: string;
  slug: string;
}

const ShareButton = ({ tripTitle, slug }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://traveller-hero.vercel.app/trip/${slug}`;
  const shareText = `Check out this trip plan: ${tripTitle}`;

  const handleShare = async () => {
    // Try native Web Share API first — works on mobile and modern desktop
    if (navigator.share) {
      try {
        await navigator.share({
          title: tripTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled the share sheet — do nothing
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback — copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Final fallback for very old browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="border-white/10 text-stone-400 hover:border-[#e6c419] hover:text-[#e6c419] rounded-full px-6 h-12 transition-all flex items-center gap-2"
    >
      {copied ? (
        <>
          <Check size={16} className="text-emerald-400" />
          <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest">
            Copied
          </span>
        </>
      ) : (
        <>
          <Share2 size={16} />
          <span className="font-mono text-xs uppercase tracking-widest">
            Share
          </span>
        </>
      )}
    </Button>
  );
};

export default ShareButton;