import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadReceiptImage } from '@/services/storage';
import { parseReceiptImage } from '@/services/ocr';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ScanScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const styles = createStyles(colors);
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [processingStep, setProcessingStep] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // Take photo with camera
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    setCapturedImage(photo.uri);
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert(t('common.error'), t('scan.error'));
            }
        }
    };

    // Pick from gallery
    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCapturedImage(result.assets[0].uri);
        }
    };

    // Use the photo (parse with OCR + upload + navigate)
    const usePhoto = async () => {
        if (!capturedImage) return;

        setUploading(true);

        // Step 1: Parse receipt with OCR
        setProcessingStep(t('scan.analyzing'));
        const { data: parsedData, error: ocrError } = await parseReceiptImage(capturedImage);

        // Step 2: Upload image to storage
        setProcessingStep(t('scan.uploading'));
        const { url, error: uploadError } = await uploadReceiptImage(capturedImage);

        setProcessingStep(null);
        setUploading(false);

        if (uploadError) {
            Alert.alert(
                t('scan.error'),
                uploadError || t('scan.errorMessage'),
                [
                    { text: t('common.retry'), onPress: usePhoto },
                    { text: t('common.cancel'), style: 'cancel' },
                ]
            );
            return;
        }

        // Build navigation params
        const navParams: Record<string, string> = {
            receiptUrl: url || '',
        };

        // Add parsed data if available
        if (parsedData) {
            if (parsedData.amount) navParams.amount = parsedData.amount;
            if (parsedData.category) navParams.category = parsedData.category;
            if (parsedData.description) navParams.description = parsedData.description;
            if (parsedData.date) navParams.date = parsedData.date;
        }

        // Navigate to add screen with success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
            pathname: '/add',
            params: navParams,
        });

        // Reset state
        setCapturedImage(null);

        // Show contextual feedback based on what was parsed
        if (ocrError) {
            Alert.alert(
                t('scan.error'),
                t('scan.errorMessage'),
                [{ text: 'OK' }]
            );
        } else if (parsedData) {
            // Check which fields were successfully parsed
            const parsedFields = [];
            if (parsedData.amount) parsedFields.push('amount');
            if (parsedData.category) parsedFields.push('category');
            if (parsedData.description) parsedFields.push('merchant');
            if (parsedData.date) parsedFields.push('date');

            if (parsedFields.length < 4) {
                const missingFields = ['amount', 'category', 'merchant', 'date']
                    .filter(f => !parsedFields.includes(f));
                Alert.alert(
                    t('scan.success'),
                    `Please verify and fill in: ${missingFields.join(', ')}`,
                    [{ text: 'OK' }]
                );
            }
        }
    };

    // No permission yet
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>{t('common.loading')}</Text>
            </View>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={colors.stone400} />
                    <Text style={styles.permissionTitle}>{t('scan.permissionTitle')}</Text>
                    <Text style={styles.permissionText}>
                        {t('scan.permissionMessage')}
                    </Text>
                    <Pressable style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>{t('scan.grantPermission')}</Text>
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

                {/* Processing overlay */}
                {uploading && processingStep && (
                    <View style={styles.processingOverlay}>
                        <View style={styles.processingCard}>
                            <ActivityIndicator size="large" color={colors.amber400} />
                            <Text style={styles.processingText}>{processingStep}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.previewControls}>
                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setCapturedImage(null)}
                        disabled={uploading}
                    >
                        <Ionicons name="close" size={24} color={colors.stone800} />
                        <Text style={styles.secondaryButtonText}>{t('scan.retakePhoto')}</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.primaryButton, uploading && styles.primaryButtonDisabled]}
                        onPress={usePhoto}
                        disabled={uploading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {uploading ? t('scan.processing') : t('scan.usePhoto')}
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
            <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flashEnabled ? 'on' : 'off'}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerText}>{t('scan.captureReceipt')}</Text>
                </View>

                {/* Camera frame guide */}
                <View style={styles.frameGuide}>
                    <View style={styles.frameCorner} />
                </View>

                {/* Bottom controls */}
                <View style={styles.controls}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.galleryButton,
                            pressed && { transform: [{ scale: 0.9 }] },
                        ]}
                        onPress={pickImage}
                    >
                        <Ionicons name="images-outline" size={28} color={colors.white} />
                        <Text style={styles.controlText}>{t('scan.chooseFromGallery')}</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.captureButton,
                            pressed && { transform: [{ scale: 0.95 }] },
                        ]}
                        onPress={takePicture}
                    >
                        <View style={styles.captureButtonInner} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.flashButton,
                            pressed && { transform: [{ scale: 0.9 }] },
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setFlashEnabled(!flashEnabled);
                        }}
                    >
                        <Ionicons
                            name={flashEnabled ? 'flash' : 'flash-off'}
                            size={28}
                            color={flashEnabled ? colors.amber400 : colors.white}
                        />
                        <Text style={styles.controlText}>
                            {flashEnabled ? 'Flash On' : 'Flash Off'}
                        </Text>
                    </Pressable>
                </View>
            </CameraView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
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
        color: colors.textPlaceholder,
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
    flashButton: {
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
        backgroundColor: colors.surface,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
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
        backgroundColor: colors.textPlaceholder,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingCard: {
        backgroundColor: colors.surface,
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
        marginHorizontal: 48,
    },
    processingText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
});
