export interface MediaVariant {
    resolution: string;
    downloadUrl: string;
}

export interface MediaItem {
    id: string;
    type: 'image' | 'video' | 'animation';
    title: string;
    thumbUrl: string;
    downloadUrl: string; // The "best" one by default
    ext: string;
    resolution?: string;
    variants?: MediaVariant[];
}

export interface Extractor {
    platform: string;
    canHandle(url: string): boolean;
    extract(url: string): Promise<MediaItem[]>;
}
