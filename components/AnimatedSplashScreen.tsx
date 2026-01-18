
import { Image } from 'expo-image'; // Using expo-image for better performance if installed, or react-native Image
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

export default function AnimatedSplashScreen({ children, onAnimationFinish }: { children: React.ReactNode, onAnimationFinish?: () => void }) {
    const [isAppReady, setAppReady] = useState(false);
    const [isSplashAnimationComplete, setSplashAnimationComplete] = useState(false);

    // Animation Values
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.8);
    const logoPosition = useSharedValue(0);

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load assets or data here if needed
                // For now, we simulate a small loading time or wait for main app queries
                // In a real app, you might await font loading here

                // Artificial delay to ensure the animations are visible and "premium" feel
                // otherwise it flashes too fast on high-end devices
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (e) {
                console.warn(e);
            } finally {
                setAppReady(true);
            }
        }

        prepare();
    }, []);

    const onImageLoaded = React.useCallback(async () => {
        // Hide the native splash screen as soon as our image is loaded
        // so we can show our JS-controlled animation
        try {
            await SplashScreen.hideAsync();

            // Start Animations
            scale.value = withSpring(1, { damping: 12, stiffness: 100 });

            // Fade out after a delay
            opacity.value = withDelay(1500, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
                if (finished) {
                    runOnJS(setSplashAnimationComplete)(true);
                    if (onAnimationFinish) runOnJS(onAnimationFinish)();
                }
            }));

        } catch (e) {
            // handle error
        }
    }, []);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            // Optional: Zoom effect for the whole container to reveal app
            // transform: [{ scale: interpolate(opacity.value, [0, 1], [1.5, 1]) }] 
        };
    });

    const animatedLogoStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    if (!isAppReady) {
        // While checking readiness, return null or keep native splash
        // But we need to render THIS component to start loading image
        // We will handle strictly inside the view
    }

    return (
        <View style={{ flex: 1 }}>
            {/* The Actual App */}
            {isAppReady && <View style={{ flex: 1 }}>{children}</View>}

            {/* The Overlay Splash */}
            {!isSplashAnimationComplete && (
                <Animated.View style={[styles.container, animatedContainerStyle]}>
                    <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                        <Image
                            source={require('../assets/images/icon.png')}
                            style={styles.logo}
                            contentFit="contain"
                            onLoad={onImageLoaded} // Trigger animations when image is ready
                        />
                        {/* Optional Text */}
                        {/* <Text style={styles.text}>AgriFarm</Text> */}
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E6F4FE', // Match android adaptive icon bg or white
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
    }
});
