import { useState } from 'react';
import { getCategoryStyle } from './categoryStyle.js';

// SVG files in public/category-icons/ are used as colorable masks.
export default function CategoryIcon({ category, className = '' }) {
  const style = getCategoryStyle(category);
  const [failedUrl, setFailedUrl] = useState(null);
  const hasAsset = failedUrl !== style.iconUrl;

  return (
    <span
      className={`category-icon-asset ${className}`}
      aria-hidden="true"
      style={{ color: style.color }}
    >
      <span className="category-icon-fallback" style={{ visibility: hasAsset ? 'hidden' : 'visible' }}>
        {style.icon}
      </span>
      {hasAsset && (
        <>
          <span
            className="category-icon-mask"
            style={{ maskImage: `url("${style.iconUrl}")`, WebkitMaskImage: `url("${style.iconUrl}")` }}
          />
          <img
            className="category-icon-probe"
            src={style.iconUrl}
            alt=""
            onError={() => setFailedUrl(style.iconUrl)}
          />
        </>
      )}
    </span>
  );
}
