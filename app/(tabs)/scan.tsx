import { colors } from '@/constants/colors';
import { uploadReceiptImage } from '@/services/storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Take photo with camera
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    setCapturedImage(photo.uri);
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to take picture');
            }
        }
    };

    // Pick from gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setCapturedImage(result.assets[0].uri);
        }
    };

    // Use the photo (upload + navigate)
    const usePhoto = async () => {
        if (!capturedImage) return;

        setUploading(true);
        const { url, error } = await uploadReceiptImage(capturedImage);
        setUploading(false);

        if (url) {
            // Navigate to add screen with receipt URL
            router.push({
                pathname: '/add',
                params: { receiptUrl: url },
            });
            // Reset state
            setCapturedImage(null);
        } else {
            Alert.alert('Upload Failed', error || 'Please try again');
        }
    };

    // No permission yet
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Loading camera...</Text>
            </View>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={colors.stone400} />
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to scan your receipts
                    </Text>
                    <Pressable style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // Preview mode - show captured image
    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="contain" />

                <View style={styles.previewControls}>
                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setCapturedImage(null)}
                        disabled={uploading}
                    >
                        <Ionicons name="close" size={24} color={colors.stone800} />
                        <Text style={styles.secondaryButtonText}>Retake</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.primaryButton, uploading && styles.primaryButtonDisabled]}
                        onPress={usePhoto}
                        disabled={uploading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {uploading ? 'Uploading...' : 'Use Photo'}
                        </Text>
                        {!uploading && <Ionicons name="arrow-forward" size={24} color={colors.white} />}
                    </Pressable>
                </View>
            </View>
        );
    }

    // Camera mode
    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back">
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerText}>Position receipt in frame</Text>
                </View>

                {/* Camera frame guide */}
                <View style={styles.frameGuide}>
                    <View style={styles.frameCorner} />
                </View>

                {/* Bottom controls */}
                <View style={styles.controls}>
                    <Pressable style={styles.galleryButton} onPress={pickImage}>
                        <Ionicons name="images-outline" size={28} color={colors.white} />
                        <Text style={styles.controlText}>Gallery</Text>
                    </Pressable>

                    <Pressable style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureButtonInner} />
                    </Pressable>

                    <View style={styles.galleryButton} />
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    camera: {
        flex: 1,
    },
    message: {
        color: colors.white,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginTop: 16,
    },
    permissionText: {
        fontSize: 16,
        color: colors.stone400,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: colors.amber600,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
        textAlign: 'center',
    },
    frameGuide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    frameCorner: {
        width: '100%',
        maxWidth: 300,
        aspectRatio: 0.75,
        borderWidth: 2,
        borderColor: colors.amber600,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    galleryButton: {
        alignItems: 'center',
        gap: 4,
        width: 80,
    },
    controlText: {
        fontSize: 12,
        color: colors.white,
        fontWeight: '500',
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.amber600,
    },
    captureButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.amber600,
    },
    preview: {
        flex: 1,
        backgroundColor: colors.black,
    },
    previewControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        gap: 16,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.stone800,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.amber600,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonDisabled: {
        backgroundColor: colors.stone400,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
});
