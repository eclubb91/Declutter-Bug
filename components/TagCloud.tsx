
import React from 'react';

interface TagCloudProps {
  tags: Map<string, number>;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TagCloud: React.FC<TagCloudProps> = ({ tags, selectedTag, onSelectTag }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Filter by Tag</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectTag(null)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            !selectedTag
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {Array.from(tags.entries()).map(([tag, count]) => (
          <button
            key={tag}
            onClick={() => onSelectTag(tag)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedTag === tag
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tag} <span className="ml-1 px-1.5 py-0.5 bg-white/20 dark:bg-black/20 text-xs rounded-full">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
