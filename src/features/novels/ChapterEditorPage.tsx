import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';

import styles from './ChapterEditorPage.module.css';
import { ParagraphEditor } from './ParagraphEditor';
import { getChapter } from './chaptersRepository';
import { appendParagraph, listParagraphs } from './paragraphsRepository';

export function ChapterEditorPage() {
  const { chapterId } = useParams();
  const chapter = useLiveQuery(
    async () => (chapterId === undefined ? null : await getChapter(chapterId)),
    [chapterId],
  );
  const paragraphs = useLiveQuery(
    async () => (chapterId === undefined ? [] : await listParagraphs(chapterId)),
    [chapterId],
  );

  if (chapter === undefined) {
    return null;
  }

  if (chapter === null) {
    return <p className={styles.note}>That chapter no longer exists.</p>;
  }

  return (
    <section className={styles.panel} aria-label={chapter.title}>
      <div className={styles.header}>
        <Link to="../.." relative="path" className={styles.back}>
          ← Chapters
        </Link>
        <h2 className={styles.heading}>
          <span className={styles.number}>Chapter {chapter.number}</span>
          {chapter.title}
        </h2>
      </div>

      <div className={styles.paragraphs}>
        {paragraphs?.map((paragraph) => (
          <ParagraphEditor key={paragraph.id} paragraph={paragraph} />
        ))}
      </div>

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          if (chapterId !== undefined) {
            void appendParagraph(chapterId);
          }
        }}
      >
        + Add paragraph
      </button>
    </section>
  );
}
