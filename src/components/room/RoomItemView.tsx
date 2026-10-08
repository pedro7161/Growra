import React, { useEffect } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface RoomItemViewProps {
  source: ImageSourcePropType | undefined;
  fallbackIcon: string;
  canvasWidth: number;
  canvasHeight: number;
  x: number;
  y: number;
  size: number; // fraction of canvas width at scale 1
  scale: number;
  flip: boolean;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onMoveEnd: (x: number, y: number) => void;
  onResizeEnd: (scale: number) => void;
}

export default function RoomItemView(props: RoomItemViewProps) {
  const { canvasWidth, canvasHeight, x, y, size, scale, flip, selected, editable } = props;
  const side = size * canvasWidth;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const pinch = useSharedValue(1);
  const active = useSharedValue(false);

  // Keep the drag/pinch offset until the committed position arrives as props, so the item doesn't
  // snap back for a frame. The timer covers edits that change nothing (props never change).
  useEffect(() => {
    dx.value = 0;
    dy.value = 0;
    pinch.value = 1;
  }, [x, y, scale, dx, dy, pinch]);

  const settleLater = () => {
    setTimeout(() => {
      if (active.value) return;
      dx.value = 0;
      dy.value = 0;
      pinch.value = 1;
    }, 400);
  };
  const commitMove = (nextX: number, nextY: number) => {
    props.onMoveEnd(nextX, nextY);
    settleLater();
  };
  const commitResize = (nextScale: number) => {
    props.onResizeEnd(nextScale);
    settleLater();
  };

  const pan = Gesture.Pan()
    .enabled(editable)
    .onStart(() => {
      active.value = true;
      runOnJS(props.onSelect)();
    })
    .onUpdate((event) => {
      dx.value = event.translationX;
      dy.value = event.translationY;
    })
    .onEnd(() => {
      active.value = false;
      runOnJS(commitMove)(x + dx.value / canvasWidth, y + dy.value / canvasHeight);
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(editable && selected)
    .onUpdate((event) => {
      pinch.value = event.scale;
    })
    .onStart(() => {
      active.value = true;
    })
    .onEnd(() => {
      active.value = false;
      runOnJS(commitResize)(scale * pinch.value);
    });

  const tap = Gesture.Tap()
    .enabled(editable)
    .onEnd(() => {
      runOnJS(props.onSelect)();
    });

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.value },
      { translateY: dy.value },
      { scale: scale * pinch.value },
      { scaleX: flip ? -1 : 1 },
    ],
  }));

  const box = {
    position: "absolute" as const,
    width: side,
    height: side,
    left: x * canvasWidth - side / 2,
    top: y * canvasHeight - side / 2,
  };

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinchGesture, tap)}>
      <Animated.View style={[box, animated, selected && styles.selected]}>
        {props.source ? (
          <Image source={props.source} style={styles.fill} resizeMode="contain" />
        ) : (
          <Text style={[styles.icon, { fontSize: side * 0.6 }]}>{props.fallbackIcon}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  icon: { textAlign: "center" },
  selected: { borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.9)", borderStyle: "dashed", borderRadius: 8 },
});
