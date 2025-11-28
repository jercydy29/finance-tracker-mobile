import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

export async function uploadReceiptImage(
    uri: string
): Promise<{ url: string | null; error: string | null }> {
    try {
        // Generate unique filename
        const filename = `receipt_${Date.now()}.jpg`;

        // Use the new File API (SDK 54+)
        const file = new FileSystem.File(uri);
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage using ArrayBuffer
        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(filename, arrayBuffer, {
                contentType: 'image/jpeg',
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(data.path);

        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.error('Upload error:', message);
        return { url: null, error: message };
    }
}
