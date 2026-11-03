import { useState } from 'react';
import type { ReactNode } from 'react';
import type { EditorialBlock, EditorialCodeSample } from './officialSolution';

function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1]) nodes.push(<strong key={key}>{match[1]}</strong>);
    else nodes.push(<code key={key}>{match[2]}</code>);
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function SolutionCode({ samples }: { samples: EditorialCodeSample[] }) {
  const [active, setActive] = useState(0);
  const index = active < samples.length ? active : 0;
  const sample = samples[index];
  if (!sample) return null;

  return (
    <div className="editorial-code">
      <div className="editorial-code-tabs" role="tablist" aria-label="Solution language">
        {samples.map((item, itemIndex) => (
          <button
            key={`${item.label}-${itemIndex}`}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            className={itemIndex === index ? 'is-active' : ''}
            onClick={() => setActive(itemIndex)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <pre>
        <code>{sample.code}</code>
      </pre>
    </div>
  );
}

export function EditorialArticle({ blocks }: { blocks: EditorialBlock[] }) {
  return (
    <article className="editorial">
      {blocks.map((block, index) => {
        if (block.type === 'heading' && block.level === 2) {
          return <h2 key={index}>{block.text}</h2>;
        }
        if (block.type === 'heading') {
          return <h3 key={index}>{block.text}</h3>;
        }
        if (block.type === 'label') {
          return (
            <p key={index} className="editorial-label">
              {block.text}
            </p>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <p key={index}>
              <RichText text={block.text} />
            </p>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'divider') return <hr key={index} />;
        return <SolutionCode key={index} samples={block.samples} />;
      })}
    </article>
  );
}
