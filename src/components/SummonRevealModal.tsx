import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings, Pet } from "../types";
import { getLevelProgress, getPetTemplates, PET_LEVEL_BASE_COST } from "../utils/gameplay";

interface SummonRevealModalProps {
  visible: boolean;
  settings: AppSettings;
  pets: Pet[];
  onClose: () => void;
}

interface ConfettiPiece {
  id: string;
  left: number;
  size: number;
  drift: number;
  rotate: string;
  start: number;
  end: number;
  color: string;
}

const CONFETTI_COUNT = 28;

export default function SummonRevealModal({
  visible,
  settings,
  pets,
  onClose,
}: SummonRevealModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const { height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.82)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActiveIndex(0);
    setPieces(createConfettiPieces(theme));
    confettiProgress.stopAnimation();
    cardScale.stopAnimation();
    cardOpacity.stopAnimation();
    confettiProgress.setValue(0);
    cardScale.setValue(0.82);
    cardOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(420),
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            damping: 11,
            stiffness: 140,
            mass: 0.75,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [cardOpacity, cardScale, confettiProgress, settings.theme, theme, visible]);

  useEffect(() => {
    if (activeIndex < pets.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, pets.length]);

  if (!visible || pets.length === 0) {
    return null;
  }

  const activePet = pets[activeIndex];
  const activeTemplate = getPetTemplates().filter(
    (template) => template.id === activePet.templateId,
  )[0];
  const activeProgress = getLevelProgress(activePet.experience, PET_LEVEL_BASE_COST);

  const handlePrevious = () => {
    if (activeIndex === 0) {
      setActiveIndex(pets.length - 1);
      return;
    }

    setActiveIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex === pets.length - 1) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex(activeIndex + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.82)" }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.shell, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {copy.petsSummonRevealTitle}
                </Text>
                <Text style={[styles.subtitle, { color: theme.mutedText }]}>
                  {copy.petsSummonRevealSubtitle}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>
                  {copy.petsSummonRevealClose}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.stage}>
                {pieces.map((piece) => {
                  const pieceOpacity = confettiProgress.interpolate({
                    inputRange: [0, piece.start, piece.start + 0.08, piece.end],
                    outputRange: [0, 0, 1, 0],
                    extrapolate: "clamp",
                  });
                  const translateY = confettiProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, height + 120],
                  });
                  const translateX = confettiProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.drift],
                  });

                  return (
                    <Animated.View
                      key={piece.id}
                      style={[
                        styles.confettiPiece,
                        {
                          left: piece.left,
                          width: piece.size,
                          height: piece.size,
                          backgroundColor: piece.color,
                          opacity: pieceOpacity,
                          transform: [
                            { translateY },
                            { translateX },
                            { rotate: piece.rotate },
                          ],
                        },
                      ]}
                    />
                  );
                })}

                <Animated.View
                  style={[
                    styles.revealCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: cardOpacity,
                      transform: [{ scale: cardScale }],
                    },
                  ]}
                >
                  <View style={styles.revealImageWrap}>
                    <View
                      style={[
                        styles.revealGlow,
                        { backgroundColor: theme.accentSoft },
                      ]}
                    />
                    <Image
                      source={getPetImage(
                        activePet.templateId,
                        activePet.evolutionStage,
                        activePet.activeImageVariantId,
                      )}
                      style={styles.revealImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.petName, { color: theme.text }]}>
                    {activePet.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme.accentSoft },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: theme.accent }]}>
                        {activePet.rarity}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: theme.mutedText }]}>
                        {activeTemplate.element}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.petDescription, { color: theme.mutedText }]}>
                    {activeTemplate.description}
                  </Text>
                  <View style={styles.statGrid}>
                    <StatPill label={copy.petsLevel} value={String(activePet.level)} themeColor={theme.text} mutedColor={theme.mutedText} bgColor={theme.surfaceMuted} />
                    <StatPill label={copy.petsCombatPower} value={String(activePet.combatPower)} themeColor={theme.text} mutedColor={theme.mutedText} bgColor={theme.surfaceMuted} />
                    <StatPill label={copy.petsExplorationPower} value={String(activePet.explorationPower)} themeColor={theme.text} mutedColor={theme.mutedText} bgColor={theme.surfaceMuted} />
                  </View>
                  <View
                    style={[
                      styles.xpTrack,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <View
                      style={[
                        styles.xpFill,
                        {
                          width: `${Math.round(activeProgress * 100)}%`,
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              </View>

              {pets.length > 1 && (
                <View style={styles.pager}>
                  <TouchableOpacity
                    style={[styles.pagerButton, { backgroundColor: theme.surfaceMuted }]}
                    onPress={handlePrevious}
                  >
                    <Text style={[styles.pagerButtonText, { color: theme.text }]}>
                      {copy.petsSummonRevealPrevious}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.pagerLabel, { color: theme.mutedText }]}>
                    {activeIndex + 1} / {pets.length}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pagerButton, { backgroundColor: theme.surfaceMuted }]}
                    onPress={handleNext}
                  >
                    <Text style={[styles.pagerButtonText, { color: theme.text }]}>
                      {copy.petsSummonRevealNext}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {pets.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {pets.map((pet, index) => {
                    const template = getPetTemplates().filter(
                      (item) => item.id === pet.templateId,
                    )[0];

                    return (
                      <TouchableOpacity
                        key={pet.id}
                        style={[
                          styles.thumbnailCard,
                          {
                            backgroundColor:
                              index === activeIndex
                                ? theme.accentSoft
                                : theme.surfaceMuted,
                            borderColor:
                              index === activeIndex ? theme.accent : theme.border,
                          },
                        ]}
                        onPress={() => setActiveIndex(index)}
                      >
                        <Image
                          source={getPetImage(
                            pet.templateId,
                            pet.evolutionStage,
                            pet.activeImageVariantId,
                          )}
                          style={styles.thumbnailImage}
                          resizeMode="contain"
                        />
                        <Text
                          style={[styles.thumbnailName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {template.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function createConfettiPieces(theme: ReturnType<typeof getAppTheme>): ConfettiPiece[] {
  const colors = [
    theme.accent,
    theme.hero,
    theme.warning,
    theme.danger,
    theme.success,
    theme.accentSoft,
  ];

  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const spread = Math.random();
    const start = Math.random() * 0.28;
    const end = 0.68 + Math.random() * 0.32;

    return {
      id: `${index}-${Date.now()}-${Math.random()}`,
      left: Math.random() * 100,
      size: 6 + Math.random() * 7,
      drift: (Math.random() - 0.5) * 120,
      rotate: `${Math.round(Math.random() * 360)}deg`,
      start: Math.min(start, spread * 0.32),
      end,
      color: colors[index % colors.length],
    };
  });
}

function StatPill({
  label,
  value,
  bgColor,
  themeColor,
  mutedColor,
}: {
  label: string;
  value: string;
  bgColor: string;
  themeColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: bgColor }]}>
      <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: themeColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 420,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
    top: 0,
    borderRadius: 999,
  },
  revealCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  revealImageWrap: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  revealGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.65,
  },
  revealImage: {
    width: 170,
    height: 170,
  },
  petName: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  petDescription: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  statGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statPill: {
    minWidth: "31%",
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  xpTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
  },
  pager: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  pagerButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  pagerButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pagerLabel: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 56,
    textAlign: "center",
  },
  thumbnailRow: {
    gap: 10,
    paddingBottom: 8,
  },
  thumbnailCard: {
    width: 94,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  thumbnailImage: {
    width: 52,
    height: 52,
    marginBottom: 6,
  },
  thumbnailName: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
