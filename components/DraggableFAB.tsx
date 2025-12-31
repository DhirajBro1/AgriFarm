import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface DraggableFABProps {
    onPress: () => void;
    backgroundColor: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FAB_SIZE = 56;

export default function DraggableFAB({ onPress, backgroundColor }: DraggableFABProps) {
    const insets = useSafeAreaInsets();

    // Initial position: bottom right (flush)
    const navbarHeight = Platform.OS === 'ios' ? 88 : 60;
    const initialX = SCREEN_WIDTH - FAB_SIZE;
    const initialY = SCREEN_HEIGHT - FAB_SIZE - navbarHeight;

    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const context = useSharedValue({ x: 0, y: 0 });

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd(() => {
            // Horizontal Magnetic Snap
            const midPoint = SCREEN_WIDTH / 2;
            const targetX = translateX.value < midPoint ? 0 : SCREEN_WIDTH - FAB_SIZE;
            translateX.value = withSpring(targetX);

            // Vertical Boundaries - flush with nav bar and top
            const minY = insets.top;
            // On Android, Dimensions.get('window').height already excludes the native navigation bar.
            // The tab bar height is 60. Subtracting just 60 (and FAB_SIZE) should place it right on top.
            const navbarHeight = Platform.OS === 'ios' ? 88 : 60;
            const maxY = SCREEN_HEIGHT - FAB_SIZE - navbarHeight;

            if (translateY.value < minY) translateY.value = withSpring(minY);
            if (translateY.value > maxY) translateY.value = withSpring(maxY);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <AnimatedTouchableOpacity
                onPress={onPress}
                style={[
                    styles.fab,
                    { backgroundColor },
                    animatedStyle,
                ]}
                activeOpacity={0.8}
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
            </AnimatedTouchableOpacity>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 999,
    },
});
