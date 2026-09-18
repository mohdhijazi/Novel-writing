import {
  createFolder,
  createJsonFile,
  downloadJsonFile,
  findFolder,
  findJsonFile,
  listSubfolders,
  updateJsonFile,
  type DriveFile,
} from '@/lib/google/driveApi';
import { SCHEMA_VERSION } from '@/lib/storage/collectionFile';

import type { Chapter, ChapterDoc, Novel, NovelDoc, Paragraph, ParagraphsFile } from './types';

/** Folder inside a world's folder that holds one folder per novel. */
const NOVELS_FOLDER_NAME = 'Novels';
const NOVEL_DOC_NAME = 'novel.json';
const CHAPTER_DOC_NAME = 'chapter.json';
const PARAGRAPHS_FILE_NAME = 'paragraphs.json';

/** Characters Drive does not allow in file names. */
const INVALID_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function safeName(value: string, fallback: string): string {
  return value.replace(INVALID_NAME_CHARACTERS, ' ').trim() || fallback;
}

function chapterFolderName(chapter: Chapter): string {
  const number = String(chapter.number).padStart(2, '0');
  return safeName(`${number} ${chapter.title}`, number);
}

function toNovelDoc(novel: Novel): NovelDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: novel.id,
    worldId: novel.worldId,
    title: novel.title,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    deletedAt: novel.deletedAt,
  };
}

function toChapterDoc(chapter: Chapter): ChapterDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: chapter.id,
    novelId: chapter.novelId,
    number: chapter.number,
    title: chapter.title,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    deletedAt: chapter.deletedAt,
  };
}

function toParagraphsFile(chapterId: string, paragraphs: Paragraph[]): ParagraphsFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    chapterId,
    updatedAt: new Date().toISOString(),
    paragraphs: paragraphs
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(({ id, order, text, createdAt, updatedAt, deletedAt }) => ({
        id,
        order,
        text,
        createdAt,
        updatedAt,
        deletedAt,
      })),
  };
}

export async function ensureNovelsFolder(worldFolderId: string): Promise<string> {
  const existing = await findFolder(NOVELS_FOLDER_NAME, worldFolderId);
  const folder = existing ?? (await createFolder(NOVELS_FOLDER_NAME, worldFolderId));
  return folder.id;
}

export async function listNovelFolders(novelsFolderId: string): Promise<DriveFile[]> {
  return listSubfolders(novelsFolderId);
}

export async function listChapterFolders(novelFolderId: string): Promise<DriveFile[]> {
  return listSubfolders(novelFolderId);
}

export async function readNovelDoc(novelFolderId: string): Promise<NovelDoc | null> {
  const file = await findJsonFile(NOVEL_DOC_NAME, novelFolderId);
  return file ? await downloadJsonFile<NovelDoc>(file.id) : null;
}

export async function readChapterDoc(chapterFolderId: string): Promise<ChapterDoc | null> {
  const file = await findJsonFile(CHAPTER_DOC_NAME, chapterFolderId);
  return file ? await downloadJsonFile<ChapterDoc>(file.id) : null;
}

export async function createNovelFolder(novelsFolderId: string, novel: Novel): Promise<string> {
  const folder = await createFolder(safeName(novel.title, 'Untitled novel'), novelsFolderId);
  await createJsonFile(NOVEL_DOC_NAME, folder.id, toNovelDoc(novel));
  return folder.id;
}

export async function createChapterFolder(
  novelFolderId: string,
  chapter: Chapter,
): Promise<string> {
  const folder = await createFolder(chapterFolderName(chapter), novelFolderId);
  await createJsonFile(CHAPTER_DOC_NAME, folder.id, toChapterDoc(chapter));
  return folder.id;
}

export async function writeNovelDoc(novel: Novel, novelFolderId: string): Promise<void> {
  const file = await findJsonFile(NOVEL_DOC_NAME, novelFolderId);
  if (file) {
    await updateJsonFile(file.id, toNovelDoc(novel));
    return;
  }
  await createJsonFile(NOVEL_DOC_NAME, novelFolderId, toNovelDoc(novel));
}

export async function writeChapterDoc(chapter: Chapter, chapterFolderId: string): Promise<void> {
  const file = await findJsonFile(CHAPTER_DOC_NAME, chapterFolderId);
  if (file) {
    await updateJsonFile(file.id, toChapterDoc(chapter));
    return;
  }
  await createJsonFile(CHAPTER_DOC_NAME, chapterFolderId, toChapterDoc(chapter));
}

export async function findParagraphsFile(chapterFolderId: string): Promise<DriveFile | null> {
  return findJsonFile(PARAGRAPHS_FILE_NAME, chapterFolderId);
}

export async function downloadParagraphsFile(fileId: string): Promise<ParagraphsFile> {
  return downloadJsonFile<ParagraphsFile>(fileId);
}

export async function writeParagraphsFile(
  chapterFolderId: string,
  fileId: string | null,
  chapterId: string,
  paragraphs: Paragraph[],
): Promise<DriveFile> {
  const content = toParagraphsFile(chapterId, paragraphs);
  if (fileId) {
    return updateJsonFile(fileId, content);
  }
  return createJsonFile(PARAGRAPHS_FILE_NAME, chapterFolderId, content);
}
