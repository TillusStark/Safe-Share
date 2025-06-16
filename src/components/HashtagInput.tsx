
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const HashtagInput = ({ value, onChange, placeholder, className }: HashtagInputProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#[\w]+/g);
    return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
  };

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
    
    // Simple hashtag suggestions (in a real app, you'd fetch these from your database)
    const commonHashtags = ['photography', 'nature', 'travel', 'art', 'food', 'lifestyle', 'portrait', 'landscape'];
    const currentWord = newValue.split(' ').pop() || '';
    
    if (currentWord.startsWith('#') && currentWord.length > 1) {
      const searchTerm = currentWord.slice(1).toLowerCase();
      const filtered = commonHashtags.filter(tag => 
        tag.toLowerCase().includes(searchTerm) && 
        !newValue.toLowerCase().includes(`#${tag}`)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const addHashtag = (hashtag: string) => {
    const words = value.split(' ');
    words[words.length - 1] = `#${hashtag}`;
    onChange(words.join(' ') + ' ');
    setSuggestions([]);
  };

  const hashtags = extractHashtags(value);

  return (
    <div className={className}>
      <Textarea
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-20"
      />
      
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((hashtag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{hashtag}
            </Badge>
          ))}
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-600 mb-1">Suggested hashtags:</div>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 text-xs"
                onClick={() => addHashtag(suggestion)}
              >
                #{suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagInput;
