import { supabase } from './supabase';

export async function uploadReceiptImage(
    uri: string
): Promise<{ url: string | null; error: string | null }> {
    try {
        // Generate unique filename
        const filename = `receipt_${Date.now()}.jpg`;

        // Fetch the image and convert to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('receipts') // Make sure this bucket exists in Supabase
            .upload(filename, blob, {
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
